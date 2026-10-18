# Configuración general de VigilaTec.
import os
from pathlib import Path

# Carpeta raíz del proyecto (vigilatec/)
RAIZ = Path(__file__).resolve().parents[2]

# Carpeta donde están los archivos de la página web
CARPETA_FRONTEND = RAIZ / "frontend"

# Base de datos: por defecto un archivo SQLite local.
# En internet se puede cambiar por PostgreSQL con la variable DATABASE_URL.
_ruta_sqlite = RAIZ / "backend" / "datos" / "vigilatec.db"
_ruta_sqlite.parent.mkdir(parents=True, exist_ok=True)  # crea la carpeta si no existe
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_ruta_sqlite}")

# Algunos servicios entregan "postgres://", pero SQLAlchemy espera "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
