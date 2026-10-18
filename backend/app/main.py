# Punto de arranque del servidor de VigilaTec.
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .config import CARPETA_FRONTEND
from sqlalchemy import text

from .database import actualizar_tablas, motor
from .rutas import cuentas, escuelas, paquetes, ranking, sesiones

# Crea las tablas (o agrega columnas nuevas) si hace falta
if ("sesiones", "paquete") in actualizar_tablas():
    # Sesiones anteriores a los paquetes: el paquete es el mismo que su modo
    with motor.begin() as conexion:
        conexion.execute(text("UPDATE sesiones SET paquete = modo"))

app = FastAPI(title="VigilaTec API", version="0.3.0")


@app.get("/api/salud")
def salud():
    """Sirve para comprobar que el servidor está vivo."""
    return {"estado": "ok"}


# --- Módulos de la API ---
app.include_router(sesiones.router)
app.include_router(paquetes.router)
app.include_router(cuentas.router)    # registro e inicio de sesión
app.include_router(escuelas.router)   # escuelas, salones y códigos de invitación
app.include_router(ranking.router)    # ranking y progreso semanal
# Próxima fase (un archivo nuevo en app/rutas/):
#   app.include_router(ia_academica.router) -> IA de búsqueda académica

# La página web se sirve al final, para no tapar las rutas /api
app.mount("/", StaticFiles(directory=CARPETA_FRONTEND, html=True), name="frontend")
