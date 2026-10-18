# Reglas de acceso a los paquetes.
# Hoy todo es gratis. Cuando existan cuentas y pagos, aquí se revisará si el usuario compró el paquete.


def puede_usar_vigilante(apariencia: str, usuario_id: int | None = None) -> bool:
    """¿Puede usar este vigilante? Los premium serán de pago cuando VIGILANTES_PREMIUM_DE_PAGO sea True."""
    from ..catalogo import APARIENCIAS_PREMIUM, VIGILANTES_PREMIUM_DE_PAGO
    if apariencia not in APARIENCIAS_PREMIUM or not VIGILANTES_PREMIUM_DE_PAGO:
        return True
    # Futuro: revisar si usuario_id compró los vigilantes premium
    return False


def puede_usar(paquete: dict, usuario_id: int | None = None) -> bool:
    """¿Este usuario puede usar este paquete?"""
    if not paquete["de_pago"]:
        return True
    # Futuro: consultar si usuario_id tiene una compra vigente de este paquete
    return False
