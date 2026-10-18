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
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
# Tolera errores comunes al copiar desde Neon: "psql '...'" o comillas alrededor
if DATABASE_URL.startswith("psql "):
    DATABASE_URL = DATABASE_URL[5:].strip()
DATABASE_URL = DATABASE_URL.strip("'\"").strip() or f"sqlite:///{_ruta_sqlite}"

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

# --- Asistente académico (IA de Claude) ---
# La clave va SOLO en la variable ANTHROPIC_API_KEY de Render (la librería la lee sola). Nunca en el código.
ASISTENTE_MODELO = os.getenv("ASISTENTE_MODELO", "claude-opus-5-5")
ASISTENTE_ESFUERZO = os.getenv("ASISTENTE_ESFUERZO", "low")          # low = respuestas más rápidas y baratas
ASISTENTE_MAX_TOKENS = int(os.getenv("ASISTENTE_MAX_TOKENS", "2500"))  # tope de largo por respuesta
ASISTENTE_LIMITE_DIARIO = int(os.getenv("ASISTENTE_LIMITE_DIARIO", "15"))        # preguntas por estudiante al día
ASISTENTE_LIMITE_GLOBAL = int(os.getenv("ASISTENTE_LIMITE_GLOBAL", "300"))       # preguntas de toda la app al día
