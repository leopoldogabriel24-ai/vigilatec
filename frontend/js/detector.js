// Detector: abre la cámara y analiza la cara del estudiante con MediaPipe.
// Todo ocurre dentro del navegador; ninguna imagen sale del dispositivo.
import { FaceLandmarker, FilesetResolver } from "../vendor/mediapipe/vision_bundle.mjs";
import { DETECCION } from "./config.js";

// Puntos de la cara que usamos (MediaPipe da 478 puntos numerados)
const MEJILLA_IZQ = 234, MEJILLA_DER = 454, NARIZ = 1;

export class Detector {
  constructor(video) {
    this.video = video;
    this.modelo = null;
    this.flujo = null;          // la señal de la cámara
    this.base = null;           // cómo se ve el estudiante "mirando al frente"
    this.muestrasCalib = [];
    this.historial = [];        // posiciones recientes de la nariz (para medir movimiento)
    this.ultimoTiempoVideo = -1;
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
      return { caras: 0, mirada: false, movimiento: false };
    }

    // Si hay dos caras, analizamos la más grande (la más cercana a la cámara)
    const medidas = r.faceLandmarks.map((p) => medirCara(p));
    let i = 0;
    if (medidas.length > 1 && medidas[1].ancho > medidas[0].ancho) i = 1;
    const m = medidas[i];
    const ojos = leerOjos(r.faceBlendshapes[i]);

    // Durante los primeros segundos solo aprendemos la postura normal
    if (!this.base) {
      this.muestrasCalib.push(m);
      return { caras, calibrando: true, mirada: false, movimiento: false };
    }

    // ¿Mira hacia otro lado? (giro de cabeza o de ojos)
    const giro = Math.abs(m.giro - this.base.giro);
    const mirada = giro > DETECCION.giroMax || ojos.lado > DETECCION.ojosLadoMax || ojos.arriba > DETECCION.ojosArribaMax;

    // ¿Se mueve demasiado o se alejó/levantó?
    this.historial.push({ t: ahora, x: m.x, y: m.y });
    const limite = ahora - DETECCION.ventanaMovSeg * 1000;
    while (this.historial.length && this.historial[0].t < limite) this.historial.shift();
    const velocidad = calcularVelocidad(this.historial) / this.base.ancho;
    const alejado = m.ancho < this.base.ancho * DETECCION.alejadoMin;
    const movimiento = velocidad > DETECCION.movimientoMax || alejado;

    return { caras, mirada, movimiento, alejado };
  }

  /** Termina la calibración usando el promedio de lo observado. Devuelve true si salió bien. */
  terminarCalibracion() {
    const ms = this.muestrasCalib;
    if (ms.length < 5) return false;
    const mediana = (k) => ms.map((m) => m[k]).sort((a, b) => a - b)[Math.floor(ms.length / 2)];
    this.base = { giro: mediana("giro"), ancho: mediana("ancho") };
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
  const izq = p[MEJILLA_IZQ], der = p[MEJILLA_DER], nariz = p[NARIZ];
  const ancho = Math.hypot(der.x - izq.x, der.y - izq.y);
  // 0 = mirando al frente; negativo/positivo = cabeza girada a un lado u otro
  const giro = (nariz.x - izq.x) / (der.x - izq.x || 1e-6) - 0.5;
  return { x: nariz.x, y: nariz.y, ancho, giro };
}

// Lee hacia dónde miran los ojos (valores de 0 a 1)
function leerOjos(blend) {
  const s = {};
  for (const c of blend?.categories ?? []) s[c.categoryName] = c.score;
  const g = (k) => s[k] ?? 0;
  const ladoA = (g("eyeLookOutLeft") + g("eyeLookInRight")) / 2;
  const ladoB = (g("eyeLookInLeft") + g("eyeLookOutRight")) / 2;
  return { lado: Math.max(ladoA, ladoB), arriba: (g("eyeLookUpLeft") + g("eyeLookUpRight")) / 2 };
}

// Distancia recorrida por la nariz por segundo
function calcularVelocidad(h) {
  if (h.length < 3) return 0;
  let recorrido = 0;
  for (let i = 1; i < h.length; i++) recorrido += Math.hypot(h[i].x - h[i - 1].x, h[i].y - h[i - 1].y);
  const seg = (h[h.length - 1].t - h[0].t) / 1000;
  return seg > 0 ? recorrido / seg : 0;
}
