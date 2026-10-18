// Detector: abre la cámara y analiza la cara del estudiante con MediaPipe.
// Todo ocurre dentro del navegador; ninguna imagen sale del dispositivo.
import { FaceLandmarker, FilesetResolver } from "../vendor/mediapipe/vision_bundle.mjs";
import { DETECCION } from "./config.js";

// Puntos de la cara que usamos (MediaPipe da 478 puntos numerados)
const MEJILLA_IZQ = 234, MEJILLA_DER = 454, NARIZ = 1, FRENTE = 10, MENTON = 152;

export class Detector {
  constructor(video) {
    this.video = video;
    this.modelo = null;
    this.flujo = null;          // la señal de la cámara
    this.base = null;           // cómo se ve el estudiante "mirando al frente"
    this.muestrasCalib = [];
    this.historial = [];        // posiciones recientes de la nariz (para medir movimiento)
    this.ultimoTiempoVideo = -1;
    this.modoHoja = true;       // estudio con hoja o libro: mirar hacia abajo no es distracción
    this.ultimoAbajo = -1e9;    // cuándo fue la última vez que miró hacia abajo
    this.parpadeos = 0;         // antitrampa: una foto frente a la cámara nunca parpadea
    this.ojosCerrados = false;
  }

  /** Pide permiso y enciende la cámara. */
  async encenderCamara() {
    if (!window.isSecureContext) throw new Error("inseguro");
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("sin-soporte");
    this.flujo = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    this.video.srcObject = this.flujo;
    await this.video.play();
  }

  /** Carga el modelo de detección de caras (primero intenta con la tarjeta gráfica). */
  async cargarModelo() {
    const archivos = await FilesetResolver.forVisionTasks(new URL("../vendor/mediapipe/wasm", import.meta.url).href);
    const opciones = (delegate) => ({
      baseOptions: { modelAssetPath: new URL("../modelos/face_landmarker.task", import.meta.url).href, delegate },
      runningMode: "VIDEO",
      numFaces: 2,
      outputFaceBlendshapes: true,
    });
    try {
      this.modelo = await FaceLandmarker.createFromOptions(archivos, opciones("GPU"));
    } catch {
      this.modelo = await FaceLandmarker.createFromOptions(archivos, opciones("CPU"));
    }
  }

  get calibrado() { return this.base !== null; }

  /** Analiza el cuadro actual del video y devuelve lo que ve. */
  observar() {
    const v = this.video;
    if (!this.modelo || v.readyState < 2 || v.currentTime === this.ultimoTiempoVideo) return null;
    this.ultimoTiempoVideo = v.currentTime;

    const ahora = performance.now();
    const r = this.modelo.detectForVideo(v, ahora);
    const caras = r.faceLandmarks.length;
    if (caras === 0) {
      this.historial = [];
      // Si la cara se "perdió" justo después de mirar hacia abajo, lo más probable es que esté leyendo
      const haciaAbajo = this.modoHoja && ahora - this.ultimoAbajo < DETECCION.memoriaAbajoMs;
      return { caras: 0, mirada: false, movimiento: false, haciaAbajo };
    }

    // Si hay dos caras, analizamos la más grande (la más cercana a la cámara)
    const medidas = r.faceLandmarks.map((p) => medirCara(p));
    let i = 0;
    if (medidas.length > 1 && medidas[1].ancho > medidas[0].ancho) i = 1;
    const m = medidas[i];
    const ojos = leerOjos(r.faceBlendshapes[i]);

    // Cuenta un parpadeo cada vez que los ojos pasan de abiertos a cerrados
    if (ojos.cerrados > DETECCION.parpadeoCerrado && !this.ojosCerrados) { this.ojosCerrados = true; this.parpadeos++; }
    else if (ojos.cerrados < DETECCION.parpadeoAbierto) this.ojosCerrados = false;

    // Durante los primeros segundos solo aprendemos la postura normal
    if (!this.base) {
      this.muestrasCalib.push(m);
      return { caras, calibrando: true, mirada: false, movimiento: false };
    }

    // ¿Mira hacia abajo (a su hoja)? Cabeza inclinada, ojos hacia abajo o cara más abajo en la imagen
    const haciaAbajo = m.cabeceo - this.base.cabeceo > DETECCION.cabeceoAbajo
      || ojos.abajo > DETECCION.ojosAbajo
      || m.y - this.base.y > DETECCION.bajadaCara;
    if (haciaAbajo) this.ultimoAbajo = ahora;
    const leyendo = this.modoHoja && haciaAbajo;

    // ¿Mira hacia otro lado? Leyendo, solo cuenta girar la cabeza claramente (los ojos se ven raros al mirar abajo)
    const giro = Math.abs(m.giro - this.base.giro);
    const mirada = leyendo
      ? giro > DETECCION.giroMax * DETECCION.giroHojaFactor
      : giro > DETECCION.giroMax || ojos.lado > DETECCION.ojosLadoMax || ojos.arriba > DETECCION.ojosArribaMax;

    // ¿Se mueve demasiado o se alejó/levantó?
    this.historial.push({ t: ahora, x: m.x, y: m.y });
    const limite = ahora - DETECCION.ventanaMovSeg * 1000;
    while (this.historial.length && this.historial[0].t < limite) this.historial.shift();
    const velocidad = calcularVelocidad(this.historial) / this.base.ancho;
    const alejado = !leyendo && m.ancho < this.base.ancho * DETECCION.alejadoMin;
    const movimiento = velocidad > DETECCION.movimientoMax * (leyendo ? 1.5 : 1) || alejado;

    return { caras, mirada, movimiento, alejado, leyendo, haciaAbajo: leyendo };
  }

  /** Termina la calibración usando el promedio de lo observado. Devuelve true si salió bien. */
  terminarCalibracion() {
    const ms = this.muestrasCalib;
    if (ms.length < 5) return false;
    const mediana = (k) => ms.map((m) => m[k]).sort((a, b) => a - b)[Math.floor(ms.length / 2)];
    this.base = { giro: mediana("giro"), ancho: mediana("ancho"), cabeceo: mediana("cabeceo"), y: mediana("y") };
    return true;
  }

  reiniciarCalibracion() { this.base = null; this.muestrasCalib = []; this.historial = []; }

  /** Apaga la cámara (la luz de la cámara se apaga). */
  apagar() {
    this.flujo?.getTracks().forEach((t) => t.stop());
    this.flujo = null;
    this.video.srcObject = null;
  }
}

// Mide posición, tamaño y giro de la cabeza a partir de los puntos de la cara
function medirCara(p) {
  const izq = p[MEJILLA_IZQ], der = p[MEJILLA_DER], nariz = p[NARIZ], frente = p[FRENTE], menton = p[MENTON];
  const ancho = Math.hypot(der.x - izq.x, der.y - izq.y);
  // 0 = mirando al frente; negativo/positivo = cabeza girada a un lado u otro
  const giro = (nariz.x - izq.x) / (der.x - izq.x || 1e-6) - 0.5;
  // Cabeceo: al inclinar la cabeza hacia abajo, la nariz se ve más cerca de la barbilla
  const cabeceo = (nariz.y - frente.y) / (menton.y - frente.y || 1e-6);
  return { x: nariz.x, y: nariz.y, ancho, giro, cabeceo };
}

// Lee hacia dónde miran los ojos (valores de 0 a 1)
function leerOjos(blend) {
  const s = {};
  for (const c of blend?.categories ?? []) s[c.categoryName] = c.score;
  const g = (k) => s[k] ?? 0;
  const ladoA = (g("eyeLookOutLeft") + g("eyeLookInRight")) / 2;
  const ladoB = (g("eyeLookInLeft") + g("eyeLookOutRight")) / 2;
  return {
    lado: Math.max(ladoA, ladoB),
    arriba: (g("eyeLookUpLeft") + g("eyeLookUpRight")) / 2,
    cerrados: (g("eyeBlinkLeft") + g("eyeBlinkRight")) / 2,
    abajo: (g("eyeLookDownLeft") + g("eyeLookDownRight")) / 2,
  };
}

// Distancia recorrida por la nariz por segundo
function calcularVelocidad(h) {
  if (h.length < 3) return 0;
  let recorrido = 0;
  for (let i = 1; i < h.length; i++) recorrido += Math.hypot(h[i].x - h[i - 1].x, h[i].y - h[i - 1].y);
  const seg = (h[h.length - 1].t - h[0].t) / 1000;
  return seg > 0 ? recorrido / seg : 0;
}
