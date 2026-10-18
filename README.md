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
│   │   └── servicios/       Cálculos (informe estadístico) y reglas de acceso a paquetes
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
- Personajes (dibujo, voz, tono): `frontend/js/vigilantes.js`. Si agregas uno, añade su `id` en `APARIENCIAS` de `backend/app/catalogo.py`.

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

## API

- `GET  /api/salud` — comprobar que el servidor vive
- `GET  /api/paquetes` — paquetes disponibles
- `POST /api/sesiones` — guardar una sesión y recibir su informe
- `GET  /api/sesiones?dispositivo_id=...` — historial
- `GET  /api/sesiones/{id}?dispositivo_id=...` — informe de una sesión
- Documentación automática: `/docs`
