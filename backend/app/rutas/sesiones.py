# Rutas (direcciones) de la API para guardar sesiones y ver informes.
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..catalogo import APARIENCIAS, PAQUETES_POR_ID
from ..database import obtener_bd
from ..esquemas import Informe, ResumenSesion, SesionEntrada
from ..modelos import Distraccion, SesionEstudio
from ..servicios.acceso import puede_usar
from ..servicios.informe import calcular_tiempo_distraido, construir_informe, porcentaje

router = APIRouter(prefix="/api/sesiones", tags=["sesiones"])


@router.post("", response_model=Informe)
def guardar_sesion(datos: SesionEntrada, bd: Session = Depends(obtener_bd)):
    """Guarda una sesión terminada y devuelve su informe."""
    paquete = PAQUETES_POR_ID.get(datos.paquete or datos.modo)
    if not paquete or paquete["modo"] != datos.modo:
        raise HTTPException(status_code=422, detail="Paquete no válido")
    if not puede_usar(paquete):
        raise HTTPException(status_code=402, detail="Este paquete es de pago")
    if datos.apariencia not in APARIENCIAS:
        raise HTTPException(status_code=422, detail="Vigilante no válido")

    distraido = calcular_tiempo_distraido(datos.distracciones, datos.duracion_real)
    concentrado = max(datos.duracion_real - distraido, 0)

    sesion = SesionEstudio(
        dispositivo_id=datos.dispositivo_id,
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
def historial(dispositivo_id: str = Query(min_length=8, max_length=64), bd: Session = Depends(obtener_bd)):
    """Historial de sesiones de este navegador, de la más reciente a la más antigua."""
    consulta = (
        select(SesionEstudio)
        .where(SesionEstudio.dispositivo_id == dispositivo_id)
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
def ver_informe(sesion_id: int, dispositivo_id: str = Query(min_length=8, max_length=64), bd: Session = Depends(obtener_bd)):
    """Informe de una sesión anterior (solo si pertenece a este navegador)."""
    sesion = bd.get(SesionEstudio, sesion_id)
    if not sesion or sesion.dispositivo_id != dispositivo_id:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return construir_informe(sesion)
