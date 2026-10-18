# Tablas de la base de datos.
# Solo se guardan estadísticas: NUNCA video, audio ni imágenes.
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _ahora():
    return datetime.now(timezone.utc)


class SesionEstudio(Base):
    """Una sesión de Modo Examen o Modo Estudio."""

    __tablename__ = "sesiones"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Identificador anónimo del navegador (mientras no existan cuentas)
    dispositivo_id: Mapped[str] = mapped_column(String(64), index=True)
    # Preparado para el futuro: cuando haya cuentas se llenará este campo
    usuario_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)

    modo: Mapped[str] = mapped_column(String(20))  # "examen" o "estudio"
    severidad: Mapped[str] = mapped_column(String(20), default="normal")
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    # Tiempos en segundos
    duracion_planeada: Mapped[int] = mapped_column(Integer)
    duracion_real: Mapped[int] = mapped_column(Integer)
    tiempo_concentrado: Mapped[int] = mapped_column(Integer)
    porcentaje_concentracion: Mapped[float] = mapped_column(Float)

    distracciones: Mapped[list["Distraccion"]] = relationship(
        back_populates="sesion", cascade="all, delete-orphan"
    )


class Distraccion(Base):
    """Cada vez que el vigilante detectó una distracción."""

    __tablename__ = "distracciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    sesion_id: Mapped[int] = mapped_column(ForeignKey("sesiones.id"), index=True)
    tipo: Mapped[str] = mapped_column(String(30))  # ausente, mirada, movimiento...
    inicio: Mapped[int] = mapped_column(Integer)  # segundo de la sesión en que empezó
    duracion: Mapped[int] = mapped_column(Integer)  # cuántos segundos duró
    nivel: Mapped[int] = mapped_column(Integer)  # severidad del aviso: 1, 2 o 3

    sesion: Mapped[SesionEstudio] = relationship(back_populates="distracciones")
