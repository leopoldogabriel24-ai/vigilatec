# Forma de los datos que entran y salen del servidor (se validan solos).
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, field_validator

TipoDistraccion = Literal["ausente", "mirada", "movimiento", "pestana", "otra_persona", "ruido"]


class DistraccionEntrada(BaseModel):
    tipo: TipoDistraccion
    inicio: int = Field(ge=0)
    duracion: int = Field(ge=0)
    nivel: int = Field(ge=1, le=3)


class SesionEntrada(BaseModel):
    """Lo que el navegador envía al terminar una sesión (solo números)."""

    dispositivo_id: str = Field(min_length=8, max_length=64)
    modo: Literal["examen", "estudio"]
    paquete: str | None = Field(default=None, max_length=30)   # si no viene, se usa el del modo
    apariencia: str = Field(default="vigilatec", max_length=20)
    microfono: bool = False
    severidad: Literal["suave", "normal", "estricto"] = "normal"
    duracion_planeada: int = Field(ge=60, le=6 * 3600)
    duracion_real: int = Field(ge=0, le=6 * 3600)
    distracciones: list[DistraccionEntrada] = Field(default_factory=list, max_length=2000)


class Paquete(BaseModel):
    """Un paquete de uso (por ejemplo, Preparación para exámenes)."""

    id: str
    nombre: str
    descripcion: str
    icono: str
    modo: str
    duraciones: list[int] | None
    duracion_por_defecto: int
    severidad_fija: str | None
    de_pago: bool
    precio_mxn: float | None
    disponible: bool


class ConFecha(BaseModel):
    fecha: datetime

    @field_validator("fecha")
    @classmethod
    def con_zona_horaria(cls, f: datetime) -> datetime:
        # SQLite guarda la fecha sin zona horaria; indicamos que es UTC
        return f if f.tzinfo else f.replace(tzinfo=timezone.utc)


class Informe(ConFecha):
    """Informe estadístico que se muestra al final de la sesión."""

    id: int
    modo: str
    paquete: str
    apariencia: str
    microfono: bool
    severidad: str
    duracion_planeada: int
    duracion_real: int
    tiempo_concentrado: int
    tiempo_distraido: int
    numero_distracciones: int
    porcentaje_concentracion: float
    distracciones_por_tipo: dict[str, int]
    tiempo_por_tipo: dict[str, int]
    distraccion_mas_larga: int
    mensaje: str


class ResumenSesion(ConFecha):
    """Una fila del historial."""

    id: int
    modo: str
    paquete: str
    duracion_real: int
    tiempo_concentrado: int
    numero_distracciones: int
    porcentaje_concentracion: float
