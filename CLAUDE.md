# VigilaTec — instrucciones para Claude

El dueño del proyecto es principiante: háblale en español, sin tecnicismos (si usas uno, explícalo en una línea).

## Publicar: cuando diga "sube los cambios"
Render publica solo lo que está en la rama `main` de GitHub (leopoldogabriel24-ai/vigilatec).
1. Prueba en localhost antes de subir (servidor: `.venv/bin/uvicorn backend.app.main:app --port 8000`).
   Para probar con PostgreSQL local: `service postgresql start` y `DATABASE_URL=postgresql://usuario:clave@localhost/base`.
2. `git add -A` y `git commit` con un mensaje en español que diga qué cambió.
3. `git fetch origin main`; si GitHub tiene cambios nuevos (por ejemplo subidos a mano), combínalos sin borrar nada.
4. `git push origin main`. Render publica en 2–3 minutos: https://vigilatec.onrender.com
5. Si el push es rechazado por permisos, pide al dueño instalar la app de Claude en GitHub:
   https://github.com/apps/claude/installations/select_target (elegir el repositorio `vigilatec`).

## Reglas del proyecto
- El video y el audio se analizan SOLO en el navegador. Nunca enviar ni guardar imágenes ni audio; al servidor solo van números.
- Comentarios del código en español, cortos.
- Colores: azul del logo (#045491) y blanco, con un toque leve de amarillo TecNM (#f5b800); tipografía Montserrat.
  La portada lleva el escudo del TecNM (`frontend/img/escudo-tecnm.svg`, trazado de la referencia del dueño).
- Voces grabadas: `herramientas/generar_voces.mjs`. Penumbra, Profesor y Sargento usan la voz de IA gratuita Piper
  (es_MX-ald-medium; se descarga de GitHub: k2-fsa/sherpa-onnx, release "tts-models"); los demás usan meSpeak.
- Maestro Musgo y Exo-Guardián usan la forma anterior de elegir voz (`vozAnterior: true`); el dueño la prefiere.
- La app debe seguir funcionando SIN cuenta (las cuentas son opcionales, solo necesarias para el ranking).
- En el ranking solo se muestra el apodo; nunca correos, nombres reales ni edades.
- Asistente de IA: la clave ANTHROPIC_API_KEY solo vive en Render; nunca en el código. No guardar preguntas ni respuestas,
  ni enviar a la IA nombre, correo o ID del estudiante. Respetar los límites diarios de uso.
- DECISIÓN DEL DUEÑO: el asistente está APAGADO por ahora (sin pagos). Se oculta solo mientras no exista
  ANTHROPIC_API_KEY. No activarlo ni cambiarlo a otro proveedor de IA sin preguntar antes
  (los planes gratuitos como Gemini usan los datos para entrenar y no son adecuados para menores).
- Vigilantes premium: por decisión del dueño, HOY son un PROTOTIPO inspirado de cerca en personajes famosos
  (Vader, Doom, Kratos, Batman, Sauron, Yoda, Iron Man). Antes de publicar en serio o cobrar, deben reemplazarse
  por diseños originales o licenciados. Nunca clonar voces de actores reales.
- No romper lo que ya funciona: probar con el navegador automático antes de decir que algo está listo.
