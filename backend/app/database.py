# Conexión con la base de datos.
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import DATABASE_URL

# SQLite necesita este ajuste para funcionar con el servidor web
_opciones = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

motor = create_engine(DATABASE_URL, connect_args=_opciones)
SesionBD = sessionmaker(bind=motor, autoflush=False)


class Base(DeclarativeBase):
    """Clase madre de todas las tablas."""


def obtener_bd():
    """Abre una conexión por cada petición y la cierra al terminar."""
    bd = SesionBD()
    try:
        yield bd
    finally:
        bd.close()
