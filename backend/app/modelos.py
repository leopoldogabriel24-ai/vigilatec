# Tablas de la base de datos.
# Solo se guardan estadísticas: NUNCA video, audio ni imágenes.
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
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
    # Dueño de la sesión (vacío si se usó sin cuenta)
    usuario_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    # Salón del estudiante en el momento de la sesión (para el ranking)
    salon_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)

    modo: Mapped[str] = mapped_column(String(20))  # "examen" o "estudio"
    paquete: Mapped[str] = mapped_column(String(30), default="estudio")
    apariencia: Mapped[str] = mapped_column(String(20), default="vigilatec")
    microfono: Mapped[bool] = mapped_column(Boolean, default=False)  # solo si se midió el volumen
    severidad: Mapped[str] = mapped_column(String(20), default="normal")
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    # Tiempos en segundos
    duracion_planeada: Mapped[int] = mapped_column(Integer)
    duracion_real: Mapped[int] = mapped_column(Integer)
    tiempo_concentrado: Mapped[int] = mapped_column(Integer)
    porcentaje_concentracion: Mapped[float] = mapped_column(Float)

    # Antitrampa: parpadeos detectados (una foto no parpadea) y si cuenta para el ranking
    parpadeos: Mapped[int] = mapped_column(Integer, default=0)
    valida_ranking: Mapped[bool] = mapped_column(Boolean, default=False)
    motivo_no_valida: Mapped[str | None] = mapped_column(String(120), nullable=True)

    distracciones: Mapped[list["Distraccion"]] = relationship(
        back_populates="sesion", cascade="all, delete-orphan"
    )


class Distraccion(Base):
    """Cada vez que el vigilante detectó una distracción."""

    __tablename__ = "distracciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    sesion_id: Mapped[int] = mapped_column(ForeignKey("sesiones.id"), index=True)
    tipo: Mapped[str] = mapped_column(String(30))  # ausente, mirada, movimiento, ruido...
    inicio: Mapped[int] = mapped_column(Integer)  # segundo de la sesión en que empezó
    duracion: Mapped[int] = mapped_column(Integer)  # cuántos segundos duró
    nivel: Mapped[int] = mapped_column(Integer)  # severidad del aviso: 1, 2 o 3

    sesion: Mapped[SesionEstudio] = relationship(back_populates="distracciones")


class Usuario(Base):
    """Cuenta de un estudiante o administrador."""

    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    correo: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    # La contraseña NUNCA se guarda: solo su "huella" cifrada con Argon2
    hash_contrasena: Mapped[str] = mapped_column(String(255))
    nombre: Mapped[str] = mapped_column(String(80))            # privado: solo lo ve su escuela
    apodo: Mapped[str] = mapped_column(String(30))             # público: lo único que sale en el ranking
    rol: Mapped[str] = mapped_column(String(20), default="estudiante")  # "estudiante" o "admin"
    mostrar_en_ranking: Mapped[bool] = mapped_column(Boolean, default=True)
    salon_id: Mapped[int | None] = mapped_column(ForeignKey("salones.id"), nullable=True, index=True)

    # Privacidad y consentimiento
    acepto_privacidad_version: Mapped[str] = mapped_column(String(20))
    acepto_privacidad_fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)
    es_menor: Mapped[bool] = mapped_column(Boolean, default=False)
    consentimiento_tipo: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "tutor" o "escuela"
    tutor_nombre: Mapped[str | None] = mapped_column(String(80), nullable=True)
    tutor_correo: Mapped[str | None] = mapped_column(String(254), nullable=True)

    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    salon: Mapped["Salon | None"] = relationship(back_populates="miembros", foreign_keys=[salon_id])


class TokenAcceso(Base):
    """Sesión iniciada en un navegador (como una pulsera de entrada que vence)."""

    __tablename__ = "tokens_acceso"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    hash_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # el token real solo lo tiene el navegador
    expira: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InicioSesionEstudio(Base):
    """Marca de tiempo del servidor al empezar una sesión (antitrampa: no se pueden inventar duraciones)."""

    __tablename__ = "inicios_sesion"

    id: Mapped[int] = mapped_column(primary_key=True)
    hash_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)
    usado: Mapped[bool] = mapped_column(Boolean, default=False)


class Escuela(Base):
    __tablename__ = "escuelas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    # use_alter: usuarios y salones se apuntan en círculo; esta relación se crea al final
    admin_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", use_alter=True), index=True)
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    salones: Mapped[list["Salon"]] = relationship(back_populates="escuela", order_by="Salon.nombre")


class Salon(Base):
    __tablename__ = "salones"

    id: Mapped[int] = mapped_column(primary_key=True)
    escuela_id: Mapped[int] = mapped_column(ForeignKey("escuelas.id"), index=True)
    nombre: Mapped[str] = mapped_column(String(60))
    codigo: Mapped[str] = mapped_column(String(12), unique=True, index=True)  # código de invitación
    creado: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora)

    escuela: Mapped[Escuela] = relationship(back_populates="salones")
    miembros: Mapped[list[Usuario]] = relationship(back_populates="salon", foreign_keys="Usuario.salon_id")
