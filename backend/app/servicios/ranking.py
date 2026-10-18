# Ranking: reglas antitrampa y cálculo de puntos por estudiante y por salón.
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import ZONA_HORARIA
from ..modelos import Distraccion, InicioSesionEstudio, SesionEstudio, Usuario
from .seguridad import huella

ZONA = ZoneInfo(ZONA_HORARIA)

# --- Reglas antitrampa (se pueden ajustar aquí) ---
MIN_SEG_RANKING = 10 * 60          # sesiones de menos de 10 minutos no cuentan
MAX_SEG_POR_DIA = 8 * 3600         # máximo 8 horas concentrado por día y estudiante
PARPADEOS_POR_MINUTO = 1           # una persona parpadea ~15 veces por minuto; una foto, nunca
CONCENTRACION_MINIMA = 0.2         # si casi siempre "no estabas", la cámara pudo estar tapada
TOLERANCIA_RELOJ_SEG = 30          # margen entre el reloj del servidor y el del navegador


def utc(f: datetime) -> datetime:
    return f if f.tzinfo else f.replace(tzinfo=timezone.utc)


def validar_para_ranking(bd: Session, datos, usuario: Usuario | None, concentrado: int) -> tuple[bool, str | None]:
    """¿Esta sesión cuenta para el ranking? Si no, explica por qué."""
    if usuario is None:
        return False, "Inicia sesión con tu cuenta para participar en el ranking"
    if datos.duracion_real < MIN_SEG_RANKING:
        return False, "Solo cuentan sesiones de 10 minutos o más"

    # El servidor anotó la hora de inicio: la duración no puede ser mayor al tiempo real que pasó
    inicio = bd.scalar(select(InicioSesionEstudio).where(
        InicioSesionEstudio.hash_token == huella(datos.token_inicio or "-")))
    if not inicio or inicio.usado or inicio.usuario_id != usuario.id:
        return False, "No se pudo verificar cuándo empezó la sesión"
    inicio.usado = True  # cada marca de inicio sirve una sola vez
    transcurrido = (datetime.now(timezone.utc) - utc(inicio.creado)).total_seconds()
    if datos.duracion_real > transcurrido + TOLERANCIA_RELOJ_SEG:
        return False, "La duración no coincide con el reloj del servidor"

    if datos.parpadeos < PARPADEOS_POR_MINUTO * datos.duracion_real / 60:
        return False, "No se detectaron parpadeos suficientes (¿foto frente a la cámara?)"
    if concentrado < CONCENTRACION_MINIMA * datos.duracion_real:
        return False, "Casi no se te vio en la cámara (¿estaba tapada?)"
    return True, None


def inicio_periodo(periodo: str) -> datetime | None:
    """Fecha desde la que se cuenta: lunes de esta semana, día 1 del mes, o desde siempre."""
    ahora = datetime.now(ZONA)
    if periodo == "semana":
        lunes = (ahora - timedelta(days=ahora.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        return lunes.astimezone(timezone.utc)
    if periodo == "mes":
        return ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    return None


def estadisticas_por_estudiante(bd: Session, salon_ids: list[int], desde: datetime | None) -> dict[int, dict]:
    """Minutos concentrados (con tope diario) y distracciones de cada estudiante, en sesiones válidas."""
    if not salon_ids:
        return {}
    conteo_distr = (
        select(Distraccion.sesion_id, func.count().label("n")).group_by(Distraccion.sesion_id).subquery()
    )
    consulta = (
        select(SesionEstudio.usuario_id, SesionEstudio.fecha, SesionEstudio.tiempo_concentrado,
               SesionEstudio.duracion_real, func.coalesce(conteo_distr.c.n, 0))
        .outerjoin(conteo_distr, conteo_distr.c.sesion_id == SesionEstudio.id)
        .where(SesionEstudio.valida_ranking.is_(True), SesionEstudio.salon_id.in_(salon_ids),
               SesionEstudio.usuario_id.is_not(None))
    )
    if desde is not None:
        consulta = consulta.where(SesionEstudio.fecha >= desde)

    por_dia = defaultdict(int)           # (usuario, día) -> segundos concentrado
    stats = defaultdict(lambda: {"seg": 0, "seg_total": 0, "distracciones": 0})
    for usuario_id, fecha, concentrado, total, distr in bd.execute(consulta):
        dia = utc(fecha).astimezone(ZONA).date()
        cupo = max(0, MAX_SEG_POR_DIA - por_dia[(usuario_id, dia)])
        sumar = min(concentrado, cupo)
        por_dia[(usuario_id, dia)] += sumar
        s = stats[usuario_id]
        s["seg"] += sumar
        s["seg_total"] += total
        s["distracciones"] += distr
    return stats


def puntos(minutos: int, distracciones: int) -> int:
    """Puntos = minutos concentrado menos 1 punto por cada distracción (nunca negativo)."""
    return max(0, minutos - distracciones)


def fila_estudiante(u: Usuario, s: dict | None, yo_id: int | None) -> dict:
    s = s or {"seg": 0, "seg_total": 0, "distracciones": 0}
    minutos = s["seg"] // 60
    horas = s["seg_total"] / 3600
    return {
        # Privacidad: solo el apodo, y "anónimo" si el estudiante así lo pidió
        "apodo": u.apodo if (u.mostrar_en_ranking or u.id == yo_id) else "Estudiante anónimo",
        "es_tu": u.id == yo_id,
        "minutos_concentrados": minutos,
        "distracciones": s["distracciones"],
        "distracciones_por_hora": round(s["distracciones"] / horas, 1) if horas > 0 else 0.0,
        "puntos": puntos(minutos, s["distracciones"]),
    }


def numerar(filas: list[dict], clave_orden) -> list[dict]:
    filas.sort(key=clave_orden)
    for i, f in enumerate(filas, start=1):
        f["posicion"] = i
    return filas


def ranking_de_salon(bd: Session, salon, periodo: str, yo_id: int | None) -> list[dict]:
    stats = estadisticas_por_estudiante(bd, [salon.id], inicio_periodo(periodo))
    filas = [fila_estudiante(u, stats.get(u.id), yo_id) for u in salon.miembros]
    # Más puntos primero; si empatan, menos distracciones por hora
    return numerar(filas, lambda f: (-f["puntos"], f["distracciones_por_hora"], f["apodo"].lower()))


def ranking_de_escuela(bd: Session, escuela, periodo: str, mi_salon_id: int | None) -> list[dict]:
    salones = escuela.salones
    stats = estadisticas_por_estudiante(bd, [s.id for s in salones], inicio_periodo(periodo))
    filas = []
    for salon in salones:
        miembros = salon.miembros
        filas_alumnos = [fila_estudiante(u, stats.get(u.id), None) for u in miembros]
        total_puntos = sum(f["puntos"] for f in filas_alumnos)
        filas.append({
            "salon": salon.nombre,
            "es_tu_salon": salon.id == mi_salon_id,
            "estudiantes": len(miembros),
            "activos": sum(1 for f in filas_alumnos if f["minutos_concentrados"] > 0),
            "minutos_concentrados": sum(f["minutos_concentrados"] for f in filas_alumnos),
            # Promedio por estudiante: un salón grande no gana solo por tener más alumnos
            "puntos_promedio": round(total_puntos / len(miembros), 1) if miembros else 0.0,
        })
    return numerar(filas, lambda f: (-f["puntos_promedio"], -f["activos"], f["salon"].lower()))
