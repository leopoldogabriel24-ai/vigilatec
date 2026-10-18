# Asistente académico: habla con la API de Claude (Anthropic).
# No se guarda ninguna pregunta ni respuesta: solo se cuentan los usos (ver rutas/asistente.py).
import json
import logging
import os
import re

import anthropic

from ..config import ASISTENTE_ESFUERZO, ASISTENTE_MAX_TOKENS, ASISTENTE_MODELO

log = logging.getLogger("uvicorn.error")

# Instrucciones fijas para Claude (el "prompt de sistema")
INSTRUCCIONES = """Eres el Asistente académico de VigilaTec, una app que ayuda a estudiantes de secundaria, \
preparatoria y universidad en México a estudiar con concentración.

Temas: responde solo dudas académicas y de estudio (matemáticas, ciencias, historia, lengua, idiomas, \
programación, técnicas de estudio y preparación para exámenes). Si te piden otra cosa, explica con amabilidad \
que solo ayudas con temas de estudio y sugiere cómo convertirla en una pregunta académica.

Forma de responder:
- Siempre en español claro, adaptado al nivel que muestre el estudiante.
- Empieza con la idea principal en una o dos frases. Después explica paso a paso (lista numerada), \
da un ejemplo sencillo y termina con una pregunta corta para que el estudiante compruebe si entendió.
- Sé breve: unas 300 palabras como máximo, salvo que pidan más detalle.
- Si parece una tarea o un examen, prioriza que entienda el procedimiento: explica el método y los pasos \
antes del resultado final.
- Usa Markdown sencillo: títulos cortos con ##, listas y **negritas**. Escribe las fórmulas en texto plano \
(por ejemplo: x^2 + 3x = 0).

Honestidad y fuentes:
- Si no estás seguro de algo, o el tema tiene opiniones distintas, dilo claramente \
("No estoy completamente seguro de…") y recomienda verificarlo con su profesor o un libro de texto.
- No inventes datos, fechas, citas ni enlaces.
- Si tienes resultados de búsqueda en internet, basa tu respuesta en ellos. Si no, puedes recomendar \
tipos de fuentes confiables (libros de texto de la SEP, Khan Academy, enciclopedias, sitios de universidades) \
sin escribir direcciones web.

Privacidad y cuidado:
- Nunca pidas datos personales (nombre completo, dirección, teléfono, escuela). Si el estudiante los comparte, ignóralos.
- Si el estudiante expresa angustia seria o que está en riesgo, responde con empatía y recomiéndale hablar \
con un adulto de confianza o llamar a la Línea de la Vida: 800 911 2000 (México, gratuita, 24 horas)."""

INSTRUCCIONES_PRACTICA = """Eres el generador de preguntas de práctica de VigilaTec. Crea preguntas de estudio \
en español, claras y variadas (de recordar, de entender y de aplicar), de dificultad creciente, \
adecuadas para estudiantes de secundaria, preparatoria o universidad en México. Cada respuesta debe ser breve \
(una a tres frases) e incluir el porqué. Si el tema no es académico, genera preguntas sobre técnicas de estudio."""

ESQUEMA_PRACTICA = {
    "type": "object",
    "properties": {
        "preguntas": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"pregunta": {"type": "string"}, "respuesta": {"type": "string"}},
                "required": ["pregunta", "respuesta"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["preguntas"],
    "additionalProperties": False,
}

# Modelos que aceptan el "respaldo automático": si un filtro de seguridad rechaza la pregunta por error,
# Anthropic la reintenta con otro modelo dentro de la misma llamada
MODELOS_CON_RESPALDO = {"claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"}

BUSQUEDA_WEB = {"type": "web_search_20260209", "name": "web_search", "max_uses": 2}


class AsistenteNoDisponible(Exception):
    """Falta la clave de la API o la API respondió con un error."""


# ---------- Privacidad ----------
_PATRONES_PERSONALES = [
    re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"),                          # correos
    re.compile(r"\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b", re.I),       # CURP
    re.compile(r"(?<!\d)(?:\+?\d[\s.-]?){8,13}\d(?!\d)"),               # teléfonos (8 a 14 dígitos)
]


def quitar_datos_personales(texto: str) -> str:
    """Borra correos, CURP y teléfonos antes de enviar el texto a la IA."""
    for patron in _PATRONES_PERSONALES:
        texto = patron.sub("[dato personal omitido]", texto)
    return texto


# ---------- Conexión con Claude ----------
_cliente = None


def disponible() -> bool:
    return bool(os.getenv("ANTHROPIC_API_KEY"))


def cliente() -> anthropic.Anthropic:
    global _cliente
    if not disponible():
        raise AsistenteNoDisponible("El asistente aún no está configurado (falta la clave de la API).")
    if _cliente is None:
        _cliente = anthropic.Anthropic(timeout=90.0, max_retries=2)  # lee ANTHROPIC_API_KEY del entorno
    return _cliente


def _pedir(**parametros):
    """Hace la llamada a Claude con los ajustes comunes y traduce los errores a mensajes simples."""
    opciones = {"model": ASISTENTE_MODELO, "max_tokens": ASISTENTE_MAX_TOKENS, **parametros}
    opciones["output_config"] = {"effort": ASISTENTE_ESFUERZO, **parametros.get("output_config", {})}
    if ASISTENTE_MODELO in MODELOS_CON_RESPALDO:
        opciones["betas"] = ["server-side-fallback-2026-07-01"]
        opciones["fallbacks"] = "default"
    try:
        return cliente().beta.messages.create(**opciones)
    except anthropic.AuthenticationError:
        log.error("Asistente: la clave ANTHROPIC_API_KEY no es válida")
        raise AsistenteNoDisponible("El asistente no está disponible: la clave de la API no es válida.")
    except anthropic.RateLimitError:
        raise AsistenteNoDisponible("El asistente está muy ocupado en este momento. Intenta en un minuto.")
    except anthropic.BadRequestError as e:
        log.error("Asistente: petición rechazada por la API: %s", e.message)
        raise AsistenteNoDisponible("El asistente no pudo procesar la pregunta. Intenta escribirla de otra forma.")
    except anthropic.APIStatusError as e:
        log.error("Asistente: error %s de la API: %s", e.status_code, e.message)
        raise AsistenteNoDisponible("El asistente tuvo un problema. Intenta de nuevo en un momento.")
    except anthropic.APIConnectionError:
        raise AsistenteNoDisponible("No se pudo conectar con el asistente. Intenta de nuevo en un momento.")


def responder(pregunta: str, historial: list[dict], buscar_web: bool) -> dict:
    """Responde una pregunta académica. El historial son los mensajes anteriores de esta conversación."""
    mensajes = [{"role": m["rol"], "content": quitar_datos_personales(m["texto"])} for m in historial]
    mensajes.append({"role": "user", "content": quitar_datos_personales(pregunta)})
    extra = {"tools": [BUSQUEDA_WEB]} if buscar_web else {}

    respuesta = _pedir(system=INSTRUCCIONES, messages=mensajes, **extra)
    # Con búsqueda web, el servidor puede pausar el turno; se reanuda reenviando lo que ya respondió
    for _ in range(2):
        if respuesta.stop_reason != "pause_turn":
            break
        respuesta = _pedir(system=INSTRUCCIONES, messages=mensajes + [{"role": "assistant", "content": respuesta.content}], **extra)

    if respuesta.stop_reason == "refusal":
        return {"respuesta": "No puedo ayudar con esa pregunta. Intenta con otra duda de estudio.", "fuentes": [], "recortada": False}

    textos, fuentes = [], {}
    for bloque in respuesta.content:
        if bloque.type != "text":
            continue
        textos.append(bloque.text)
        for cita in getattr(bloque, "citations", None) or []:
            url = getattr(cita, "url", None)
            if url and url not in fuentes:
                fuentes[url] = getattr(cita, "title", None) or url
    return {
        "respuesta": "".join(textos).strip() or "No obtuve una respuesta. Intenta de nuevo.",
        "fuentes": [{"titulo": t, "url": u} for u, t in list(fuentes.items())[:6]],
        "recortada": respuesta.stop_reason == "max_tokens",
    }


def preguntas_practica(tema: str, cantidad: int) -> list[dict]:
    """Genera preguntas de práctica (con respuesta) sobre un tema de estudio."""
    respuesta = _pedir(
        system=INSTRUCCIONES_PRACTICA,
        messages=[{"role": "user", "content": f"Tema: {quitar_datos_personales(tema)}\nNúmero de preguntas: {cantidad}"}],
        output_config={"format": {"type": "json_schema", "schema": ESQUEMA_PRACTICA}},
    )
    if respuesta.stop_reason == "refusal":
        raise AsistenteNoDisponible("No pude crear preguntas sobre ese tema. Prueba con otro tema de estudio.")
    texto = next((b.text for b in respuesta.content if b.type == "text"), "")
    try:
        return json.loads(texto)["preguntas"][:cantidad]
    except (ValueError, KeyError):
        raise AsistenteNoDisponible("No pude crear las preguntas esta vez. Intenta de nuevo.")
