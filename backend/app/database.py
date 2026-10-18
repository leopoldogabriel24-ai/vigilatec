# Conexión con la base de datos.
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import DATABASE_URL

# SQLite necesita este ajuste para funcionar con el servidor web
_opciones = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# pool_pre_ping revisa que la conexión siga viva (Neon "duerme" las conexiones sin uso)
motor = create_engine(DATABASE_URL, connect_args=_opciones, pool_pre_ping=True)
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


def actualizar_tablas():
    """Crea las tablas y agrega columnas nuevas a bases de datos antiguas, sin borrar datos.
    Devuelve la lista de columnas agregadas, como (tabla, columna)."""
    agregadas = []
    Base.metadata.create_all(motor)
    inspector = inspect(motor)
    for tabla in Base.metadata.sorted_tables:
        existentes = {c["name"] for c in inspector.get_columns(tabla.name)}
        for columna in tabla.columns:
            if columna.name in existentes:
                continue
            tipo = columna.type.compile(motor.dialect)
            defecto = columna.default.arg if columna.default is not None and not callable(columna.default.arg) else None
            sql = f'ALTER TABLE {tabla.name} ADD COLUMN {columna.name} {tipo}'
            if isinstance(defecto, bool):
                sql += " DEFAULT TRUE" if defecto else " DEFAULT FALSE"
            elif isinstance(defecto, str):
                sql += f" DEFAULT '{defecto}'"
            elif defecto is not None:
                sql += f" DEFAULT {defecto}"
            with motor.begin() as conexion:
                conexion.execute(text(sql))
            agregadas.append((tabla.name, columna.name))
    return agregadas
