# Catálogo de paquetes de uso.
# Para volver un paquete de pago en el futuro basta con poner de_pago=True y un precio;
# la regla de quién puede usarlo está en servicios/acceso.py.

PAQUETES = [
    {
        "id": "examen",
        "nombre": "Preparación para exámenes",
        "descripcion": "Simulacros con tiempo definido y un vigilante estricto. Sin pausas, como el día del examen.",
        "icono": "📝",
        "modo": "examen",
        "duraciones": [30, 60, 90, 120],   # minutos que puede elegir el estudiante
        "duracion_por_defecto": 60,
        "severidad_fija": "estricto",       # en simulacro el vigilante siempre es estricto
        "de_pago": False,
        "precio_mxn": None,
    },
    {
        "id": "estudio",
        "nombre": "Sesiones de estudio",
        "descripcion": "Tú programas tu tiempo y el vigilante detecta distracciones y procrastinación.",
        "icono": "📚",
        "modo": "estudio",
        "duraciones": None,                 # None = el estudiante escribe los minutos que quiera
        "duracion_por_defecto": 25,
        "severidad_fija": None,
        "de_pago": False,
        "precio_mxn": None,
    },
]

PAQUETES_POR_ID = {p["id"]: p for p in PAQUETES}

# Apariencias del vigilante permitidas (los dibujos viven en el navegador)
APARIENCIAS = {"vigilatec", "profesor", "profesora", "robot", "sargento"}
