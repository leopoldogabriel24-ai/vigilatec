# VigilaTec

Simulador de "miedo controlado" para estudiar: un vigilante observa al estudiante por la cámara
y le avisa cuando se distrae. **El video se analiza solo en el navegador; al servidor solo llegan números.**

## Estructura

```
vigilatec/
├── backend/                 Servidor en Python (FastAPI)
│   ├── app/
│   │   ├── main.py          Arranque del servidor y lista de módulos
│   │   ├── config.py        Ajustes (base de datos, carpetas)
│   │   ├── database.py      Conexión a la base de datos
│   │   ├── modelos.py       Tablas: sesiones y distracciones
│   │   ├── esquemas.py      Forma y validación de los datos
│   │   ├── catalogo.py      Paquetes de uso (aquí se marcan los de pago) y vigilantes permitidos
│   │   ├── rutas/           Direcciones de la API (aquí irán cuentas, grupos, ranking, IA)
│   │   ├── rutas/cuentas.py, escuelas.py, ranking.py   Cuentas, salones, ranking y progreso
│   │   ├── rutas/asistente.py + servicios/asistente.py  Asistente académico con Claude (límites, privacidad)
│   │   └── servicios/       Informe, acceso a paquetes, seguridad (contraseñas), ranking antitrampa y progreso
│   └── datos/               Archivo de base de datos local (no se sube a internet)
├── frontend/                Lo que ve el usuario en el navegador
│   ├── index.html           Todas las pantallas
│   ├── css/estilos.css      Diseño (azul marino y dorado)
│   ├── js/
│   │   ├── app.js           Flujo de pantallas y de la sesión
│   │   ├── config.js        Sensibilidad, tiempos y mensajes del vigilante
│   │   ├── detector.js      Cámara + MediaPipe (detección de cara)
│   │   ├── microfono.js     Micrófono opcional: solo mide volumen, nunca graba
│   │   ├── vigilantes.js    Los 5 personajes: dibujo, voz y forma de hablar
│   │   ├── preferencias.js  Recuerda las elecciones del estudiante en su navegador
│   │   ├── cuentas.js       Registro (privacidad y consentimiento), entrar y "Mi cuenta"
│   │   ├── ranking.js       Ranking del salón y entre salones
│   │   ├── admin.js         Pantalla del administrador (escuelas, salones, códigos)
│   │   ├── graficas.js      Gráficas de progreso semanal
│   │   ├── asistente.js     Chat del asistente académico y preguntas de práctica
│   │   ├── pantallas.js / usuario.js   Navegación y usuario con sesión iniciada
│   │   ├── vigilancia.js    Decide qué es distracción y su nivel
│   │   ├── vigilante.js     Dibujo, mensajes y voz del vigilante
│   │   ├── temporizador.js  Reloj de la sesión
│   │   └── api.js           Envía las estadísticas al servidor
│   ├── vendor/mediapipe/    Librería de detección (copiada aquí para no depender de otros sitios)
│   └── modelos/             Modelo de detección de caras
├── requirements.txt         Librerías de Python
└── render.yaml              Configuración para publicar en Render
```

## Ajustar el vigilante

- Segundos antes de avisar, severidad, sensibilidad y frases: `frontend/js/config.js`.
- Personajes (dibujo, voz, tono, efecto de sonido): `frontend/js/vigilantes.js`. Si agregas uno, añade su `id` en `backend/app/catalogo.py`.
- Efectos de sonido (respiración, fuego, pitido…): `frontend/js/efectos.js`, generados por el navegador.
- Vigilantes premium: personajes ORIGINALES (no usar personajes con derechos de autor). Para volverlos de pago:
  `VIGILANTES_PREMIUM_DE_PAGO = True` en `catalogo.py` y la regla en `servicios/acceso.py`.

## Paquetes de uso

Están en `backend/app/catalogo.py`. Para volver uno de pago: `"de_pago": True` y un `"precio_mxn"`.
La regla de quién puede usarlo está en `backend/app/servicios/acceso.py` (hoy todo es gratis).

## Probar en tu computadora (Windows)

1. Instala Python desde https://www.python.org/downloads/ (marca la casilla **"Add python.exe to PATH"**).
2. Abre la carpeta `vigilatec`, escribe `cmd` en la barra de direcciones y presiona Enter.
3. Escribe, una línea a la vez:
   ```
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt
   .venv\Scripts\uvicorn backend.app.main:app --reload
   ```
4. Abre http://localhost:8000 en Chrome o Edge.

## Base de datos y variables en Render

- `DATABASE_URL`: dirección de PostgreSQL (Neon). Sin ella se usa SQLite local (se borra en Render).
- `ADMIN_CORREOS`: correos (separados por comas) que al registrarse son administradores.
- `ZONA_HORARIA` (opcional): por defecto `America/Mexico_City`.
- `ANTHROPIC_API_KEY`: clave de la API de Claude para el asistente (sin ella, el asistente aparece como "no configurado").
- `ASISTENTE_LIMITE_DIARIO` (15), `ASISTENTE_LIMITE_GLOBAL` (300): preguntas por estudiante y para toda la app al día.
- `ASISTENTE_MODELO` (`claude-opus-5-5`), `ASISTENTE_ESFUERZO` (`low`), `ASISTENTE_MAX_TOKENS` (2500): calidad, velocidad y costo.

## Asistente académico

Las instrucciones para Claude están en `backend/app/servicios/asistente.py` (`INSTRUCCIONES`).
No se guardan preguntas ni respuestas: solo el número de usos por día (tabla `uso_asistente`).
Antes de enviar se borran correos, teléfonos y CURP. Buscar en internet cuenta como 2 preguntas.

## Reglas antitrampa del ranking

En `backend/app/servicios/ranking.py`: mínimo 10 minutos por sesión, máximo 8 horas al día,
marca de inicio del servidor, parpadeos mínimos (una foto no parpadea) y cámara no tapada.

## API

- `GET  /api/salud` — comprobar que el servidor vive
- `GET  /api/paquetes` — paquetes disponibles
- `POST /api/cuentas/registro`, `/entrar`, `/salir` · `GET/PATCH/DELETE /api/cuentas/yo`
- `GET/POST /api/escuelas` · `POST /api/escuelas/{id}/salones` · `POST /api/salones/unirse`
- `GET /api/ranking/salon` · `GET /api/ranking/escuela` · `GET /api/progreso`
- `GET /api/asistente/estado` · `POST /api/asistente/preguntar` · `POST /api/asistente/practica`
- `POST /api/sesiones` — guardar una sesión y recibir su informe
- `GET  /api/sesiones?dispositivo_id=...` — historial
- `GET  /api/sesiones/{id}?dispositivo_id=...` — informe de una sesión
- Documentación automática: `/docs`
