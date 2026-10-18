# Rutas del asistente académico, con límite de preguntas por día.
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import ASISTENTE_LIMITE_DIARIO, ASISTENTE_LIMITE_GLOBAL
from ..database import obtener_bd
from ..modelos import UsoAsistente, Usuario
from ..servicios import asistente
from ..servicios.ranking import ZONA
from ..servicios.seguridad import usuario_requerido

router = APIRouter(prefix="/api/asistente", tags=["asistente"])
COSTO_BUSQUEDA = 2   # buscar en internet cuesta más, así que cuenta como 2 preguntas


class MensajePrevio(BaseModel):
    rol: Literal["user", "assistant"]
    texto: str = Field(max_length=4000)


class Pregunta(BaseModel):
    pregunta: str = Field(min_length=2, max_length=1500)
    historial: list[MensajePrevio] = Field(default_factory=list, max_length=6)  # últimos mensajes, para preguntas de seguimiento
    buscar_web: bool = False


class PedidoPractica(BaseModel):
    tema: str = Field(min_length=2, max_length=120)
    cantidad: int = Field(default=5, ge=3, le=8)


def hoy():
    return datetime.now(ZONA).date()


def uso_de(bd: Session, usuario: Usuario) -> UsoAsistente:
    uso = bd.scalar(select(UsoAsistente).where(UsoAsistente.usuario_id == usuario.id, UsoAsistente.dia == hoy()))
    if not uso:
        uso = UsoAsistente(usuario_id=usuario.id, dia=hoy(), usos=0)
        bd.add(uso)
        bd.flush()
    return uso


def estado(bd: Session, usuario: Usuario) -> dict:
    usados = bd.scalar(select(UsoAsistente.usos).where(UsoAsistente.usuario_id == usuario.id, UsoAsistente.dia == hoy())) or 0
    return {
        "disponible": asistente.disponible(),
        "usados_hoy": usados,
        "limite_diario": ASISTENTE_LIMITE_DIARIO,
        "restantes": max(0, ASISTENTE_LIMITE_DIARIO - usados),
    }


def cobrar(bd: Session, usuario: Usuario, costo: int) -> UsoAsistente:
    """Revisa los límites y descuenta las preguntas ANTES de llamar a la IA (si falla, se devuelven)."""
    if not asistente.disponible():
        raise HTTPException(status_code=503, detail="El asistente aún no está configurado. Avísale al administrador.")
    uso = uso_de(bd, usuario)
    if uso.usos + costo > ASISTENTE_LIMITE_DIARIO:
        raise HTTPException(status_code=429, detail=f"Ya usaste tus {ASISTENTE_LIMITE_DIARIO} preguntas de hoy. Mañana tendrás más. 🙂")
    total_hoy = bd.scalar(select(func.coalesce(func.sum(UsoAsistente.usos), 0)).where(UsoAsistente.dia == hoy()))
    if total_hoy + costo > ASISTENTE_LIMITE_GLOBAL:
        raise HTTPException(status_code=429, detail="El asistente alcanzó su límite de hoy para toda la escuela. Vuelve mañana.")
    uso.usos += costo
    bd.commit()
    return uso


def devolver(bd: Session, uso: UsoAsistente, costo: int) -> None:
    uso.usos = max(0, uso.usos - costo)
    bd.commit()


@router.get("/estado")
def ver_estado(usuario: Usuario = Depends(usuario_requerido), bd: Session = Depends(obtener_bd)):
    return estado(bd, usuario)


@router.post("/preguntar")
def preguntar(datos: Pregunta, usuario: Usuario = Depends(usuario_requerido), bd: Session = Depends(obtener_bd)):
    costo = COSTO_BUSQUEDA if datos.buscar_web else 1
    uso = cobrar(bd, usuario, costo)
    try:
        # A la IA solo se envía el texto de la conversación: nunca el nombre, correo ni ID del estudiante
        resultado = asistente.responder(datos.pregunta, [m.model_dump() for m in datos.historial], datos.buscar_web)
    except asistente.AsistenteNoDisponible as e:
        devolver(bd, uso, costo)
        raise HTTPException(status_code=503, detail=str(e))
    return {**resultado, "estado": estado(bd, usuario)}


@router.post("/practica")
def practica(datos: PedidoPractica, usuario: Usuario = Depends(usuario_requerido), bd: Session = Depends(obtener_bd)):
    uso = cobrar(bd, usuario, 1)
    try:
        preguntas = asistente.preguntas_practica(datos.tema, datos.cantidad)
    except asistente.AsistenteNoDisponible as e:
        devolver(bd, uso, 1)
        raise HTTPException(status_code=503, detail=str(e))
    return {"tema": datos.tema, "preguntas": preguntas, "estado": estado(bd, usuario)}
