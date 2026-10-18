# Configuración general de VigilaTec.
import os
from pathlib import Path

# Carpeta raíz del proyecto (vigilatec/)
RAIZ = Path(__file__).resolve().parents[2]

# Carpeta donde están los archivos de la página web
CARPETA_FRONTEND = RAIZ / "frontend"

# Base de datos: en internet se usa PostgreSQL (variable DATABASE_URL, por ejemplo de Neon).
# Si no hay DATABASE_URL, se usa un archivo SQLite local (útil para pruebas).
_ruta_sqlite = RAIZ / "backend" / "datos" / "vigilatec.db"
_ruta_sqlite.parent.mkdir(parents=True, exist_ok=True)  # crea la carpeta si no existe
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_ruta_sqlite}")

# Los servicios entregan "postgres://" o "postgresql://"; le indicamos a SQLAlchemy
# que use el conector psycopg (el "traductor" entre Python y PostgreSQL)
for _prefijo in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(_prefijo):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len(_prefijo):]

# Correos que al registrarse obtienen permisos de administrador (pueden crear escuelas).
# En Render se configura en la variable ADMIN_CORREOS, separados por comas.
ADMIN_CORREOS = {c.strip().lower() for c in os.getenv("ADMIN_CORREOS", "").split(",") if c.strip()}

# En internet (https) las cookies de sesión solo viajan cifradas
EN_PRODUCCION = os.getenv("RENDER") is not None

# Zona horaria para agrupar por semana y día
ZONA_HORARIA = os.getenv("ZONA_HORARIA", "America/Mexico_City")
