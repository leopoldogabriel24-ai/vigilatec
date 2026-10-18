# Rutas (direcciones) de la API para guardar sesiones y ver informes.
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, delete, select
from sqlalchemy.orm import Session, selectinload

from ..catalogo import APARIENCIAS, PAQUETES_POR_ID
from ..database import obtener_bd
from ..esquemas import Informe, ResumenSesion, SesionEntrada
from ..modelos import Distraccion, InicioSesionEstudio, SesionEstudio, Usuario
from ..servicios.acceso import puede_usar, puede_usar_vigilante
from ..servicios.ranking import validar_para_ranking
from ..servicios.seguridad import huella, usuario_opcional
from ..servicios.informe import calcular_tiempo_distraido, construir_informe, porcentaje

router = APIRouter(prefix="/api/sesiones", tags=["sesiones"])


def filtro_dueno(usuario: Usuario | None, dispositivo_id: str | None):
    """Con cuenta: las sesiones del usuario. Sin cuenta: las de este navegador que no tienen dueño."""
    if usuario:
        return SesionEstudio.usuario_id == usuario.id
    if not dispositivo_id or len(dispositivo_id) < 8:
        raise HTTPException(status_code=422, detail="Falta identificar al estudiante")
    return and_(SesionEstudio.dispositivo_id == dispositivo_id, SesionEstudio.usuario_id.is_(None))


def es_dueno(sesion: SesionEstudio, usuario: Usuario | None, dispositivo_id: str | None) -> bool:
    if sesion.usuario_id is not None:
        return usuario is not None and sesion.usuario_id == usuario.id
    return sesion.dispositivo_id == dispositivo_id


@router.post("/iniciar")
def iniciar(usuario: Usuario | None = Depends(usuario_opcional), bd: Session = Depends(obtener_bd)):
    """Antitrampa: el servidor anota la hora de inicio y entrega una marca de un solo uso."""
    token = secrets.token_urlsafe(24)
    bd.execute(delete(InicioSesionEstudio).where(InicioSesionEstudio.usado.is_(True)))
    bd.add(InicioSesionEstudio(hash_token=huella(token), usuario_id=usuario.id if usuario else None))
    bd.commit()
    return {"token_inicio": token}


@router.post("", response_model=Informe)
def guardar_sesion(
    datos: SesionEntrada, usuario: Usuario | None = Depends(usuario_opcional), bd: Session = Depends(obtener_bd),
):
    """Guarda una sesión terminada y devuelve su informe."""
    paquete = PAQUETES_POR_ID.get(datos.paquete or datos.modo)
    if not paquete or paquete["modo"] != datos.modo:
        raise HTTPException(status_code=422, detail="Paquete no válido")
    if not puede_usar(paquete):
        raise HTTPException(status_code=402, detail="Este paquete es de pago")
    if datos.apariencia not in APARIENCIAS:
        raise HTTPException(status_code=422, detail="Vigilante no válido")
    if not puede_usar_vigilante(datos.apariencia, usuario.id if usuario else None):
        raise HTTPException(status_code=402, detail="Este vigilante es premium")

    distraido = calcular_tiempo_distraido(datos.distracciones, datos.duracion_real)
    concentrado = max(datos.duracion_real - distraido, 0)
    valida, motivo = validar_para_ranking(bd, datos, usuario, concentrado)

    sesion = SesionEstudio(
        dispositivo_id=datos.dispositivo_id,
        usuario_id=usuario.id if usuario else None,
        salon_id=usuario.salon_id if usuario else None,
        parpadeos=datos.parpadeos,
        valida_ranking=valida,
        motivo_no_valida=motivo,
        modo=datos.modo,
        paquete=paquete["id"],
        apariencia=datos.apariencia,
        microfono=datos.microfono,
        severidad=datos.severidad,
        duracion_planeada=datos.duracion_planeada,
        duracion_real=datos.duracion_real,
        tiempo_concentrado=concentrado,
        porcentaje_concentracion=porcentaje(concentrado, datos.duracion_real),
        distracciones=[Distraccion(**d.model_dump()) for d in datos.distracciones],
    )
    bd.add(sesion)
    bd.commit()
    bd.refresh(sesion)
    return construir_informe(sesion)


@router.get("", response_model=list[ResumenSesion])
def historial(
    dispositivo_id: str | None = Query(default=None, max_length=64),
    usuario: Usuario | None = Depends(usuario_opcional), bd: Session = Depends(obtener_bd),
):
    """Historial del estudiante (o de este navegador si no tiene cuenta), del más reciente al más antiguo."""
    consulta = (
        select(SesionEstudio)
        .where(filtro_dueno(usuario, dispositivo_id))
        .options(selectinload(SesionEstudio.distracciones))
        .order_by(SesionEstudio.fecha.desc())
        .limit(100)
    )
    return [
        ResumenSesion(
            id=s.id,
            modo=s.modo,
            paquete=s.paquete,
            fecha=s.fecha,
            duracion_real=s.duracion_real,
            tiempo_concentrado=s.tiempo_concentrado,
            numero_distracciones=len(s.distracciones),
            porcentaje_concentracion=s.porcentaje_concentracion,
        )
        for s in bd.scalars(consulta)
    ]


@router.get("/{sesion_id}", response_model=Informe)
def ver_informe(
    sesion_id: int, dispositivo_id: str | None = Query(default=None, max_length=64),
    usuario: Usuario | None = Depends(usuario_opcional), bd: Session = Depends(obtener_bd),
):
    """Informe de una sesión anterior (solo para su dueño)."""
    sesion = bd.get(SesionEstudio, sesion_id)
    if not sesion or not es_dueno(sesion, usuario, dispositivo_id):
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return construir_informe(sesion)
