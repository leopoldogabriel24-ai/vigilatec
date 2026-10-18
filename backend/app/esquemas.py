# Forma de los datos que entran y salen del servidor (se validan solos).
from datetime import datetime, timezone
from typing import Literal

import re

from pydantic import BaseModel, Field, field_validator, model_validator

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
    token_inicio: str | None = Field(default=None, max_length=100)   # antitrampa: marca de inicio del servidor
    parpadeos: int = Field(default=0, ge=0, le=100000)                 # antitrampa: una foto no parpadea


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
    valida_ranking: bool = False
    motivo_no_valida: str | None = None


class ResumenSesion(ConFecha):
    """Una fila del historial."""

    id: int
    modo: str
    paquete: str
    duracion_real: int
    tiempo_concentrado: int
    numero_distracciones: int
    porcentaje_concentracion: float


# ---------- Cuentas ----------
CORREO_VALIDO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
APODO_VALIDO = re.compile(r"^[\wáéíóúüñÁÉÍÓÚÜÑ .\-]{2,30}$")


def _correo(valor: str) -> str:
    valor = valor.strip().lower()
    if not CORREO_VALIDO.match(valor):
        raise ValueError("Escribe un correo válido")
    return valor


def _apodo(valor: str) -> str:
    valor = " ".join(valor.split())
    if not APODO_VALIDO.match(valor):
        raise ValueError("El apodo debe tener de 2 a 30 letras o números")
    return valor


class RegistroEntrada(BaseModel):
    correo: str = Field(max_length=254)
    contrasena: str = Field(min_length=8, max_length=128)
    nombre: str = Field(min_length=2, max_length=80)
    apodo: str
    acepto_privacidad: bool
    es_menor: bool
    consentimiento_tipo: Literal["tutor", "escuela"] | None = None
    consentimiento_confirmado: bool = False
    tutor_nombre: str | None = Field(default=None, max_length=80)
    tutor_correo: str | None = Field(default=None, max_length=254)
    dispositivo_id: str | None = Field(default=None, max_length=64)

    v_correo = field_validator("correo")(_correo)
    v_apodo = field_validator("apodo")(_apodo)

    @model_validator(mode="after")
    def revisar_consentimiento(self):
        if not self.acepto_privacidad:
            raise ValueError("Debes aceptar el aviso de privacidad")
        if self.es_menor:
            if not self.consentimiento_tipo or not self.consentimiento_confirmado:
                raise ValueError("Para menores de edad se necesita el consentimiento de tu tutor o de tu escuela")
            if self.consentimiento_tipo == "tutor":
                if not (self.tutor_nombre or "").strip():
                    raise ValueError("Escribe el nombre de tu madre, padre o tutor")
                self.tutor_correo = _correo(self.tutor_correo or "")
        else:
            # Si es mayor de edad no guardamos datos de tutor
            self.consentimiento_tipo = self.tutor_nombre = self.tutor_correo = None
        return self


class EntrarEntrada(BaseModel):
    correo: str = Field(max_length=254)
    contrasena: str = Field(max_length=128)
    dispositivo_id: str | None = Field(default=None, max_length=64)

    v_correo = field_validator("correo")(lambda v: v.strip().lower())


class CambiosCuenta(BaseModel):
    apodo: str | None = None
    mostrar_en_ranking: bool | None = None

    @field_validator("apodo")
    @classmethod
    def v_apodo(cls, v):
        return None if v is None else _apodo(v)


class BorrarCuenta(BaseModel):
    contrasena: str = Field(max_length=128)


class SalonResumen(BaseModel):
    id: int
    nombre: str
    escuela: str


class UsuarioSalida(BaseModel):
    """Datos de la propia cuenta (solo los ve su dueño)."""

    id: int
    correo: str
    nombre: str
    apodo: str
    rol: str
    mostrar_en_ranking: bool
    es_menor: bool
    salon: SalonResumen | None


# ---------- Escuelas y salones ----------
class NombreEntrada(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)

    @field_validator("nombre")
    @classmethod
    def limpiar(cls, v):
        return " ".join(v.split())


class CodigoEntrada(BaseModel):
    codigo: str = Field(min_length=4, max_length=12)

    @field_validator("codigo")
    @classmethod
    def limpiar(cls, v):
        return v.strip().upper().replace(" ", "").replace("-", "")


class SalonAdmin(BaseModel):
    id: int
    nombre: str
    codigo: str
    miembros: int


class EscuelaAdmin(BaseModel):
    id: int
    nombre: str
    salones: list[SalonAdmin]


class MiembroSalon(BaseModel):
    """Lo que ve el administrador de su escuela (sin correos ni datos del tutor)."""

    id: int
    nombre: str
    apodo: str
    es_menor: bool
    consentimiento_tipo: str | None


# ---------- Ranking y progreso ----------
class FilaRankingEstudiante(BaseModel):
    posicion: int
    apodo: str
    es_tu: bool
    minutos_concentrados: int
    distracciones: int
    distracciones_por_hora: float
    puntos: int


class FilaRankingSalon(BaseModel):
    posicion: int
    salon: str
    es_tu_salon: bool
    estudiantes: int
    activos: int
    minutos_concentrados: int
    puntos_promedio: float


class SemanaProgreso(BaseModel):
    semana: str          # fecha del lunes, por ejemplo "2026-10-12"
    sesiones: int
    minutos_totales: int
    minutos_concentrados: int
    distracciones: int
    porcentaje: float


class RankingSalon(BaseModel):
    salon: str
    escuela: str
    periodo: str
    filas: list[FilaRankingEstudiante]


class RankingEscuela(BaseModel):
    escuela: str
    periodo: str
    filas: list[FilaRankingSalon]
