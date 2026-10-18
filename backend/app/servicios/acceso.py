# Reglas de acceso a los paquetes.
# Hoy todo es gratis. Cuando existan cuentas y pagos, aquí se revisará si el usuario compró el paquete.


def puede_usar(paquete: dict, usuario_id: int | None = None) -> bool:
    """¿Este usuario puede usar este paquete?"""
    if not paquete["de_pago"]:
        return True
    # Futuro: consultar si usuario_id tiene una compra vigente de este paquete
    return False
