# Rutas del ranking y del progreso semanal.
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session

from ..database import obtener_bd
from ..esquemas import RankingEscuela, RankingSalon, SemanaProgreso
from ..modelos import Escuela, Salon, SesionEstudio, Usuario
from ..servicios.progreso import progreso_semanal
from ..servicios.ranking import ranking_de_escuela, ranking_de_salon
from ..servicios.seguridad import usuario_opcional, usuario_requerido

router = APIRouter(prefix="/api", tags=["ranking"])
Periodo = Literal["semana", "mes", "total"]


@router.get("/ranking/salon", response_model=RankingSalon)
def ranking_salon(
    periodo: Periodo = "semana", salon_id: int | None = None,
    usuario: Usuario = Depends(usuario_requerido), bd: Session = Depends(obtener_bd),
):
    """Ranking dentro de un salón: el del estudiante, o cualquiera de la escuela del administrador."""
    salon = usuario.salon
    if salon_id is not None:
        salon = bd.get(Salon, salon_id)
        if not salon or (salon.id != usuario.salon_id and salon.escuela.admin_id != usuario.id):
            raise HTTPException(status_code=404, detail="Salón no encontrado")
    if salon is None:
        raise HTTPException(status_code=404, detail="Únete a un salón con el código que te dé tu escuela")
    return {"salon": salon.nombre, "escuela": salon.escuela.nombre, "periodo": periodo,
            "filas": ranking_de_salon(bd, salon, periodo, usuario.id)}


@router.get("/ranking/escuela", response_model=RankingEscuela)
def ranking_escuela(
    periodo: Periodo = "semana", escuela_id: int | None = None,
    usuario: Usuario = Depends(usuario_requerido), bd: Session = Depends(obtener_bd),
):
    """Ranking entre los salones de una escuela."""
    escuela = usuario.salon.escuela if usuario.salon else None
    if escuela_id is not None:
        escuela = bd.get(Escuela, escuela_id)
        if not escuela or (escuela.admin_id != usuario.id and (not usuario.salon or usuario.salon.escuela_id != escuela.id)):
            raise HTTPException(status_code=404, detail="Escuela no encontrada")
    if escuela is None:
        raise HTTPException(status_code=404, detail="Únete a un salón con el código que te dé tu escuela")
    return {"escuela": escuela.nombre, "periodo": periodo,
            "filas": ranking_de_escuela(bd, escuela, periodo, usuario.salon_id)}


@router.get("/progreso", response_model=list[SemanaProgreso])
def progreso(
    semanas: int = Query(default=8, ge=1, le=26), dispositivo_id: str | None = Query(default=None, max_length=64),
    usuario: Usuario | None = Depends(usuario_opcional), bd: Session = Depends(obtener_bd),
):
    """Minutos, concentración y distracciones por semana (para las gráficas)."""
    if usuario:
        filtro = SesionEstudio.usuario_id == usuario.id
    elif dispositivo_id and len(dispositivo_id) >= 8:
        filtro = and_(SesionEstudio.dispositivo_id == dispositivo_id, SesionEstudio.usuario_id.is_(None))
    else:
        raise HTTPException(status_code=422, detail="Falta identificar al estudiante")
    return progreso_semanal(bd, filtro, semanas)
