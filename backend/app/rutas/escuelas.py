# Rutas de escuelas y salones: el administrador los crea y los estudiantes se unen con un código.
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import obtener_bd
from ..esquemas import CodigoEntrada, EscuelaAdmin, MiembroSalon, NombreEntrada, UsuarioSalida
from ..modelos import Escuela, Salon, Usuario
from ..servicios.seguridad import admin_requerido, usuario_requerido
from .cuentas import salida

router = APIRouter(prefix="/api", tags=["escuelas"])

# Sin letras que se confunden (O/0, I/1) para que sea fácil dictar el código en clase
LETRAS_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def nuevo_codigo(bd: Session) -> str:
    while True:
        codigo = "".join(secrets.choice(LETRAS_CODIGO) for _ in range(6))
        if not bd.scalar(select(Salon).where(Salon.codigo == codigo)):
            return codigo


def escuela_propia(bd: Session, escuela_id: int, admin: Usuario) -> Escuela:
    escuela = bd.get(Escuela, escuela_id)
    if not escuela or escuela.admin_id != admin.id:
        raise HTTPException(status_code=404, detail="Escuela no encontrada")
    return escuela


def salon_propio(bd: Session, salon_id: int, admin: Usuario) -> Salon:
    salon = bd.get(Salon, salon_id)
    if not salon or salon.escuela.admin_id != admin.id:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    return salon


def escuelas_de(bd: Session, admin: Usuario) -> list[dict]:
    conteo = dict(bd.execute(
        select(Usuario.salon_id, func.count()).where(Usuario.salon_id.is_not(None)).group_by(Usuario.salon_id)
    ).all())
    escuelas = bd.scalars(select(Escuela).where(Escuela.admin_id == admin.id).order_by(Escuela.nombre))
    return [
        {"id": e.id, "nombre": e.nombre,
         "salones": [{"id": s.id, "nombre": s.nombre, "codigo": s.codigo, "miembros": conteo.get(s.id, 0)} for s in e.salones]}
        for e in escuelas
    ]


# ----- Administrador -----
@router.get("/escuelas", response_model=list[EscuelaAdmin])
def mis_escuelas(admin: Usuario = Depends(admin_requerido), bd: Session = Depends(obtener_bd)):
    return escuelas_de(bd, admin)


@router.post("/escuelas", response_model=list[EscuelaAdmin])
def crear_escuela(datos: NombreEntrada, admin: Usuario = Depends(admin_requerido), bd: Session = Depends(obtener_bd)):
    bd.add(Escuela(nombre=datos.nombre, admin_id=admin.id))
    bd.commit()
    return escuelas_de(bd, admin)


@router.post("/escuelas/{escuela_id}/salones", response_model=list[EscuelaAdmin])
def crear_salon(escuela_id: int, datos: NombreEntrada, admin: Usuario = Depends(admin_requerido), bd: Session = Depends(obtener_bd)):
    escuela = escuela_propia(bd, escuela_id, admin)
    bd.add(Salon(escuela_id=escuela.id, nombre=datos.nombre[:60], codigo=nuevo_codigo(bd)))
    bd.commit()
    bd.expire_all()
    return escuelas_de(bd, admin)


@router.post("/salones/{salon_id}/nuevo-codigo", response_model=list[EscuelaAdmin])
def cambiar_codigo(salon_id: int, admin: Usuario = Depends(admin_requerido), bd: Session = Depends(obtener_bd)):
    """Por si el código se compartió con quien no debía: el anterior deja de servir."""
    salon = salon_propio(bd, salon_id, admin)
    salon.codigo = nuevo_codigo(bd)
    bd.commit()
    return escuelas_de(bd, admin)


@router.get("/salones/{salon_id}/miembros", response_model=list[MiembroSalon])
def miembros(salon_id: int, admin: Usuario = Depends(admin_requerido), bd: Session = Depends(obtener_bd)):
    salon = salon_propio(bd, salon_id, admin)
    return sorted(salon.miembros, key=lambda u: u.nombre.lower())


@router.delete("/salones/{salon_id}/miembros/{usuario_id}", response_model=list[MiembroSalon])
def quitar_miembro(salon_id: int, usuario_id: int, admin: Usuario = Depends(admin_requerido), bd: Session = Depends(obtener_bd)):
    salon = salon_propio(bd, salon_id, admin)
    alumno = bd.get(Usuario, usuario_id)
    if alumno and alumno.salon_id == salon.id:
        alumno.salon_id = None
        bd.commit()
    bd.refresh(salon)
    return sorted(salon.miembros, key=lambda u: u.nombre.lower())


# ----- Estudiante -----
@router.post("/salones/unirse", response_model=UsuarioSalida)
def unirse(datos: CodigoEntrada, usuario: Usuario = Depends(usuario_requerido), bd: Session = Depends(obtener_bd)):
    salon = bd.scalar(select(Salon).where(Salon.codigo == datos.codigo))
    if not salon:
        raise HTTPException(status_code=404, detail="Ese código no existe. Revisa que esté bien escrito.")
    usuario.salon_id = salon.id
    bd.commit()
    bd.refresh(usuario)
    return salida(usuario)


@router.post("/salones/salir", response_model=UsuarioSalida)
def salir_salon(usuario: Usuario = Depends(usuario_requerido), bd: Session = Depends(obtener_bd)):
    usuario.salon_id = None
    bd.commit()
    bd.refresh(usuario)
    return salida(usuario)
