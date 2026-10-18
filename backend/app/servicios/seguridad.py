# Seguridad: contraseñas cifradas, tokens de sesión y límite de intentos.
import hashlib
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Cookie, Depends, HTTPException, Request
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..database import obtener_bd
from ..modelos import TokenAcceso, Usuario

NOMBRE_COOKIE = "vigilatec_sesion"
DURACION_SESION = timedelta(days=30)
_cifrador = PasswordHasher()  # Argon2: método recomendado para guardar contraseñas


def cifrar_contrasena(contrasena: str) -> str:
    return _cifrador.hash(contrasena)


def verificar_contrasena(hash_guardado: str, contrasena: str) -> bool:
    try:
        return _cifrador.verify(hash_guardado, contrasena)
    except (VerificationError, InvalidHashError):
        return False


def huella(texto: str) -> str:
    """Huella SHA-256: en la base de datos se guarda esto, nunca el token real."""
    return hashlib.sha256(texto.encode()).hexdigest()


def crear_token(bd: Session, usuario: Usuario) -> str:
    """Crea una sesión nueva y devuelve el token (solo lo conocerá el navegador)."""
    token = secrets.token_urlsafe(32)
    ahora = datetime.now(timezone.utc)
    bd.execute(delete(TokenAcceso).where(TokenAcceso.expira < ahora))  # limpia sesiones vencidas
    bd.add(TokenAcceso(usuario_id=usuario.id, hash_token=huella(token), expira=ahora + DURACION_SESION))
    bd.commit()
    return token


def borrar_token(bd: Session, token: str | None) -> None:
    if token:
        bd.execute(delete(TokenAcceso).where(TokenAcceso.hash_token == huella(token)))
        bd.commit()


def usuario_opcional(
    vigilatec_sesion: str | None = Cookie(default=None), bd: Session = Depends(obtener_bd)
) -> Usuario | None:
    """Devuelve el usuario si inició sesión; si no, None (la app se puede usar sin cuenta)."""
    if not vigilatec_sesion:
        return None
    token = bd.scalar(select(TokenAcceso).where(TokenAcceso.hash_token == huella(vigilatec_sesion)))
    if not token:
        return None
    expira = token.expira if token.expira.tzinfo else token.expira.replace(tzinfo=timezone.utc)
    if expira < datetime.now(timezone.utc):
        return None
    return bd.get(Usuario, token.usuario_id)


def usuario_requerido(usuario: Usuario | None = Depends(usuario_opcional)) -> Usuario:
    if usuario is None:
        raise HTTPException(status_code=401, detail="Necesitas iniciar sesión")
    return usuario


def admin_requerido(usuario: Usuario = Depends(usuario_requerido)) -> Usuario:
    if usuario.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo un administrador puede hacer esto")
    return usuario


# --- Límite de intentos para evitar que adivinen contraseñas probando miles ---
_intentos: dict[str, deque] = defaultdict(deque)
MAX_INTENTOS, VENTANA_SEG = 10, 15 * 60


def revisar_intentos(request: Request, correo: str) -> None:
    clave = f"{request.client.host if request.client else '?'}|{correo}"
    ahora = time.monotonic()
    cola = _intentos[clave]
    while cola and ahora - cola[0] > VENTANA_SEG:
        cola.popleft()
    if len(cola) >= MAX_INTENTOS:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.")
    cola.append(ahora)
