# Rutas de cuentas: registro, inicio de sesión, perfil y borrado de cuenta.
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from ..catalogo import VERSION_AVISO
from ..config import ADMIN_CORREOS, EN_PRODUCCION
from ..database import obtener_bd
from ..esquemas import BorrarCuenta, CambiosCuenta, EntrarEntrada, RegistroEntrada, UsuarioSalida
from ..modelos import Distraccion, Escuela, SesionEstudio, TokenAcceso, UsoAsistente, Usuario
from ..servicios.seguridad import (
    DURACION_SESION, NOMBRE_COOKIE, borrar_token, cifrar_contrasena, crear_token,
    revisar_intentos, usuario_requerido, verificar_contrasena,
)

router = APIRouter(prefix="/api/cuentas", tags=["cuentas"])


def salida(u: Usuario) -> dict:
    """Datos de la cuenta que se devuelven a su dueño."""
    salon = None
    if u.salon:
        salon = {"id": u.salon.id, "nombre": u.salon.nombre, "escuela": u.salon.escuela.nombre}
    return {
        "id": u.id, "correo": u.correo, "nombre": u.nombre, "apodo": u.apodo, "rol": u.rol,
        "mostrar_en_ranking": u.mostrar_en_ranking, "es_menor": u.es_menor, "salon": salon,
    }


def poner_cookie(respuesta: Response, token: str) -> None:
    # HttpOnly: el JavaScript de la página no puede leerla (protege contra robos de sesión)
    respuesta.set_cookie(
        NOMBRE_COOKIE, token, max_age=int(DURACION_SESION.total_seconds()),
        httponly=True, samesite="lax", secure=EN_PRODUCCION, path="/",
    )


def adoptar_sesiones(bd: Session, usuario: Usuario, dispositivo_id: str | None) -> None:
    """Las sesiones hechas sin cuenta en este navegador pasan a ser del usuario."""
    if dispositivo_id:
        bd.execute(
            update(SesionEstudio)
            .where(SesionEstudio.dispositivo_id == dispositivo_id, SesionEstudio.usuario_id.is_(None))
            .values(usuario_id=usuario.id)
        )
        bd.commit()


@router.post("/registro", response_model=UsuarioSalida)
def registro(datos: RegistroEntrada, respuesta: Response, bd: Session = Depends(obtener_bd)):
    if bd.scalar(select(Usuario).where(Usuario.correo == datos.correo)):
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo")
    usuario = Usuario(
        correo=datos.correo,
        hash_contrasena=cifrar_contrasena(datos.contrasena),
        nombre=" ".join(datos.nombre.split()),
        apodo=datos.apodo,
        rol="admin" if datos.correo in ADMIN_CORREOS else "estudiante",
        acepto_privacidad_version=VERSION_AVISO,
        es_menor=datos.es_menor,
        consentimiento_tipo=datos.consentimiento_tipo,
        tutor_nombre=(datos.tutor_nombre or "").strip() or None,
        tutor_correo=datos.tutor_correo,
    )
    bd.add(usuario)
    bd.commit()
    bd.refresh(usuario)
    adoptar_sesiones(bd, usuario, datos.dispositivo_id)
    poner_cookie(respuesta, crear_token(bd, usuario))
    return salida(usuario)


@router.post("/entrar", response_model=UsuarioSalida)
def entrar(datos: EntrarEntrada, request: Request, respuesta: Response, bd: Session = Depends(obtener_bd)):
    revisar_intentos(request, datos.correo)
    usuario = bd.scalar(select(Usuario).where(Usuario.correo == datos.correo))
    if not usuario or not verificar_contrasena(usuario.hash_contrasena, datos.contrasena):
        # Mismo mensaje en ambos casos: así no se puede averiguar qué correos existen
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    if usuario.correo in ADMIN_CORREOS and usuario.rol != "admin":
        usuario.rol = "admin"
        bd.commit()
    adoptar_sesiones(bd, usuario, datos.dispositivo_id)
    poner_cookie(respuesta, crear_token(bd, usuario))
    return salida(usuario)


@router.post("/salir")
def salir(respuesta: Response, vigilatec_sesion: str | None = Cookie(default=None), bd: Session = Depends(obtener_bd)):
    borrar_token(bd, vigilatec_sesion)
    respuesta.delete_cookie(NOMBRE_COOKIE, path="/")
    return {"ok": True}


@router.get("/yo", response_model=UsuarioSalida)
def yo(usuario: Usuario = Depends(usuario_requerido)):
    return salida(usuario)


@router.patch("/yo", response_model=UsuarioSalida)
def cambiar(datos: CambiosCuenta, usuario: Usuario = Depends(usuario_requerido), bd: Session = Depends(obtener_bd)):
    if datos.apodo is not None:
        usuario.apodo = datos.apodo
    if datos.mostrar_en_ranking is not None:
        usuario.mostrar_en_ranking = datos.mostrar_en_ranking
    bd.commit()
    return salida(usuario)


@router.delete("/yo")
def borrar_cuenta(
    datos: BorrarCuenta, respuesta: Response,
    usuario: Usuario = Depends(usuario_requerido), bd: Session = Depends(obtener_bd),
):
    """Borra la cuenta y TODAS sus sesiones (derecho a eliminar tus datos)."""
    if not verificar_contrasena(usuario.hash_contrasena, datos.contrasena):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    if bd.scalar(select(Escuela).where(Escuela.admin_id == usuario.id)):
        raise HTTPException(status_code=409, detail="Administras una escuela; pide ayuda para transferirla antes de borrar tu cuenta")
    ids = select(SesionEstudio.id).where(SesionEstudio.usuario_id == usuario.id)
    bd.execute(delete(Distraccion).where(Distraccion.sesion_id.in_(ids)))
    bd.execute(delete(SesionEstudio).where(SesionEstudio.usuario_id == usuario.id))
    bd.execute(delete(TokenAcceso).where(TokenAcceso.usuario_id == usuario.id))
    bd.execute(delete(UsoAsistente).where(UsoAsistente.usuario_id == usuario.id))
    bd.delete(usuario)
    bd.commit()
    respuesta.delete_cookie(NOMBRE_COOKIE, path="/")
    return {"ok": True}
