// Micrófono: mide SOLO el volumen del ambiente para detectar ruido o conversación.
// Nunca graba, nunca guarda y nunca envía audio: solo calcula números (decibeles) en el navegador.
import { DETECCION } from "./config.js";

export class Microfono {
  constructor() {
    this.contexto = null;     // "motor" de audio del navegador
    this.flujo = null;        // la señal del micrófono
    this.analizador = null;   // calcula volumen y tonos, sin guardar el sonido
    this.base = null;         // volumen normal del lugar (se aprende al inicio)
    this.muestrasCalib = [];
    this.historial = [];      // volúmenes recientes, para no reaccionar a un ruido de un instante
  }

  /** Se llama justo al tocar el botón: algunos celulares solo permiten audio después de un toque. */
  preparar() {
    const Contexto = window.AudioContext ?? window.webkitAudioContext;
    if (Contexto) this.contexto = new Contexto();
  }

  /** Pide permiso y empieza a medir. */
  async encender() {
    if (!this.contexto) throw new Error("sin-soporte");
    this.flujo = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      video: false,
    });
    const fuente = this.contexto.createMediaStreamSource(this.flujo);
    this.analizador = this.contexto.createAnalyser();
    this.analizador.fftSize = 2048;
    fuente.connect(this.analizador);   // no se conecta a las bocinas ni a ningún grabador
    await this.contexto.resume();
    this.tiempo = new Float32Array(this.analizador.fftSize);
    this.frecuencias = new Float32Array(this.analizador.frequencyBinCount);
  }

  get calibrado() { return this.base !== null; }

  /** Volumen actual (en decibeles) y qué parte del sonido está en el rango de la voz humana. */
  medir() {
    this.analizador.getFloatTimeDomainData(this.tiempo);
    let suma = 0;
    for (const x of this.tiempo) suma += x * x;
    const db = 20 * Math.log10(Math.sqrt(suma / this.tiempo.length) || 1e-8);

    // Energía en el rango de la voz (300–3400 Hz) comparada con todo el sonido (80–8000 Hz)
    this.analizador.getFloatFrequencyData(this.frecuencias);
    const hzPorCasilla = this.contexto.sampleRate / this.analizador.fftSize;
    let voz = 0, total = 0;
    this.frecuencias.forEach((valor, i) => {
      const hz = i * hzPorCasilla;
      if (hz < 80 || hz > 8000) return;
      const energia = 10 ** (valor / 10);
      total += energia;
      if (hz >= 300 && hz <= 3400) voz += energia;
    });
    return { db, partVoz: total > 0 ? voz / total : 0 };
  }

  /** Durante la calibración: aprende el volumen normal del lugar. */
  muestrear() { if (this.analizador) this.muestrasCalib.push(this.medir().db); }

  terminarCalibracion() {
    const ms = this.muestrasCalib.sort((a, b) => a - b);
    this.base = ms.length ? ms[Math.floor(ms.length / 2)] : -60;
  }

  /** ¿Hay ruido excesivo o conversación? */
  observar() {
    if (!this.analizador || !this.calibrado) return { ruido: false, conversacion: false };
    const ahora = performance.now();
    this.historial.push({ t: ahora, ...this.medir() });
    const limite = ahora - DETECCION.ventanaRuidoSeg * 1000;
    while (this.historial.length && this.historial[0].t < limite) this.historial.shift();

    const promedio = (k) => this.historial.reduce((s, m) => s + m[k], 0) / this.historial.length;
    const db = promedio("db");
    const umbral = Math.max(this.base + DETECCION.ruidoMargenDb, DETECCION.ruidoMinimoDb);
    const ruido = db > umbral;
    return { ruido, conversacion: ruido && promedio("partVoz") > DETECCION.partVozConversacion, db };
  }

  /** Apaga el micrófono por completo. */
  apagar() {
    this.flujo?.getTracks().forEach((t) => t.stop());
    this.flujo = null;
    this.contexto?.close().catch(() => {});
    this.contexto = null;
    this.analizador = null;
  }
}
