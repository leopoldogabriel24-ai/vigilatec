# Ruta para consultar los paquetes disponibles.
from fastapi import APIRouter

from ..catalogo import PAQUETES
from ..esquemas import Paquete
from ..servicios.acceso import puede_usar

router = APIRouter(prefix="/api/paquetes", tags=["paquetes"])


@router.get("", response_model=list[Paquete])
def listar_paquetes():
    """Lista de paquetes, indicando si el estudiante puede usarlos."""
    return [{**p, "disponible": puede_usar(p)} for p in PAQUETES]
