# Cálculo del informe estadístico de una sesión.
from collections import Counter

from ..modelos import SesionEstudio


def calcular_tiempo_distraido(distracciones, duracion_real: int) -> int:
    """Suma los segundos distraído sin contar dos veces los tramos que se enciman."""
    tramos = sorted((d.inicio, min(d.inicio + d.duracion, duracion_real)) for d in distracciones)
    total, fin_actual = 0, 0
    for inicio, fin in tramos:
        inicio = max(inicio, fin_actual)
        if fin > inicio:
            total += fin - inicio
            fin_actual = fin
    return total


def porcentaje(concentrado: int, total: int) -> float:
    return round(100 * concentrado / total, 1) if total > 0 else 0.0


def mensaje_final(pct: float) -> str:
    """Frase del vigilante según el resultado."""
    if pct >= 90:
        return "¡Excelente! Te mantuviste concentrado casi todo el tiempo."
    if pct >= 75:
        return "Buen trabajo. Aún puedes reducir algunas distracciones."
    if pct >= 50:
        return "Vas bien, pero te distrajiste bastante. ¡La próxima lo harás mejor!"
    return "Hoy costó concentrarse. Prueba sesiones más cortas y ve subiendo poco a poco."


def construir_informe(sesion: SesionEstudio) -> dict:
    """Arma el informe completo a partir de una sesión guardada."""
    ds = sesion.distracciones
    conteo = Counter(d.tipo for d in ds)
    tiempos = Counter()
    for d in ds:
        tiempos[d.tipo] += d.duracion
    return {
        "id": sesion.id,
        "modo": sesion.modo,
        "severidad": sesion.severidad,
        "fecha": sesion.fecha,
        "duracion_planeada": sesion.duracion_planeada,
        "duracion_real": sesion.duracion_real,
        "tiempo_concentrado": sesion.tiempo_concentrado,
        "tiempo_distraido": sesion.duracion_real - sesion.tiempo_concentrado,
        "numero_distracciones": len(ds),
        "porcentaje_concentracion": sesion.porcentaje_concentracion,
        "distracciones_por_tipo": dict(conteo),
        "tiempo_por_tipo": dict(tiempos),
        "distraccion_mas_larga": max((d.duracion for d in ds), default=0),
        "mensaje": mensaje_final(sesion.porcentaje_concentracion),
    }
