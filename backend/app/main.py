# Punto de arranque del servidor de VigilaTec.
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .config import CARPETA_FRONTEND
from .database import Base, motor
from .rutas import sesiones

# Crea las tablas si todavía no existen
Base.metadata.create_all(motor)

app = FastAPI(title="VigilaTec API", version="0.1.0")


@app.get("/api/salud")
def salud():
    """Sirve para comprobar que el servidor está vivo."""
    return {"estado": "ok"}


# --- Módulos de la API ---
app.include_router(sesiones.router)
# Próximas fases (cada una será un archivo nuevo en app/rutas/):
#   app.include_router(cuentas.router)      -> registro e inicio de sesión
#   app.include_router(grupos.router)       -> escuelas y salones
#   app.include_router(ranking.router)      -> ranking entre salones
#   app.include_router(ia_academica.router) -> IA de búsqueda académica

# La página web se sirve al final, para no tapar las rutas /api
app.mount("/", StaticFiles(directory=CARPETA_FRONTEND, html=True), name="frontend")
