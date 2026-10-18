// Efectos de sonido de los vigilantes, generados por el navegador (sin archivos de audio).
// Cada efecto suena antes de que el vigilante hable y devuelve cuántos milisegundos dura.

let ctx = null;

/** Se llama con un toque del usuario: los navegadores solo permiten sonido después de una interacción. */
export function prepararSonido() {
  const Contexto = window.AudioContext ?? window.webkitAudioContext;
  if (!Contexto) return;
  ctx ??= new Contexto();
  ctx.resume?.().catch(() => {});
}

/** Ruido blanco (base para respiración y fuego). */
function ruido(segundos) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * segundos), ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  const fuente = ctx.createBufferSource();
  fuente.buffer = buffer;
  return fuente;
}

/** Volumen que sube y baja en el tiempo: [[segundo, volumen], ...] */
function envolvente(puntos, inicio) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, inicio);
  for (const [t, v] of puntos) g.gain.linearRampToValueAtTime(Math.max(v, 0.0001), inicio + t);
  return g;
}

/** Un tono simple (seno, cuadrado, etc.) con su envolvente. */
function tono(frecuencia, tipo, puntos, inicio, frecuenciaFinal) {
  const o = ctx.createOscillator();
  o.type = tipo;
  o.frequency.setValueAtTime(frecuencia, inicio);
  if (frecuenciaFinal) o.frequency.exponentialRampToValueAtTime(frecuenciaFinal, inicio + puntos.at(-1)[0]);
  const g = envolvente(puntos, inicio);
  o.connect(g).connect(ctx.destination);
  o.start(inicio);
  o.stop(inicio + puntos.at(-1)[0] + 0.05);
}

/** Ruido filtrado con envolvente (respiración, fuego, golpes). `barrido` mueve el filtro: [[segundo, Hz], ...] */
function soplo(inicio, duracion, filtro, frecuencia, puntos, q = 1, barrido = []) {
  const f = ctx.createBiquadFilter();
  f.type = filtro;
  f.frequency.setValueAtTime(frecuencia, inicio);
  for (const [t, hz] of barrido) f.frequency.exponentialRampToValueAtTime(hz, inicio + t);
  f.Q.value = q;
  const fuente = ruido(duracion);
  const g = envolvente(puntos, inicio);
  fuente.connect(f).connect(g).connect(ctx.destination);
  fuente.start(inicio);
  fuente.stop(inicio + duracion);
}

const EFECTOS = {
  // Respiración mecánica de respirador: inhalar (silbido agudo) y exhalar (soplo grave), lenta
  respiracion(t) {
    soplo(t, 1.0, "bandpass", 1400, [[0.45, 0.4], [1.0, 0.01]], 4, [[1.0, 1800]]);
    soplo(t + 1.05, 1.1, "bandpass", 420, [[0.25, 0.45], [1.1, 0.01]], 3, [[1.1, 300]]);
    return 2150;
  },
  // Golpe metálico de armadura sobre un zumbido grave
  metal(t) {
    tono(55, "sawtooth", [[0.1, 0.05], [0.9, 0.001]], t);
    for (const [f, v] of [[310, 0.25], [523, 0.15], [847, 0.1]]) tono(f, "sine", [[0.005, v], [0.6, 0.001]], t);
    for (const [f, v] of [[290, 0.2], [610, 0.12]]) tono(f, "sine", [[0.005, v], [0.5, 0.001]], t + 0.22);
    return 650;
  },
  // Tambor de guerra
  tambor(t) {
    for (const d of [0, 0.28]) {
      tono(110, "sine", [[0.005, 0.7], [0.35, 0.001]], t + d, 45);
      soplo(t + d, 0.1, "lowpass", 400, [[0.005, 0.4], [0.1, 0.001]]);
    }
    return 700;
  },
  // Ulular de búho: "hu-huuu"
  ulular(t) {
    tono(430, "sine", [[0.05, 0.25], [0.2, 0.001]], t, 390);
    tono(440, "sine", [[0.06, 0.28], [0.5, 0.001]], t + 0.28, 380);
    return 850;
  },
  // Fuego que crepita sobre un rugido grave (la voz empieza mientras el fuego sigue)
  fuego(t) {
    tono(45, "sawtooth", [[0.4, 0.06], [1.6, 0.001]], t);
    soplo(t, 1.4, "lowpass", 300, [[0.3, 0.35], [1.4, 0.001]]);
    for (let i = 0; i < 14; i++) {
      const d = Math.random() * 1.2;
      soplo(t + d, 0.03, "highpass", 2000, [[0.003, 0.25 * Math.random() + 0.1], [0.03, 0.001]]);
    }
    return 450;
  },
  // Campanita suave de sabio
  campanita(t) {
    tono(880, "sine", [[0.01, 0.18], [1.0, 0.001]], t);
    tono(1320, "sine", [[0.01, 0.1], [0.8, 0.001]], t + 0.15);
    return 700;
  },
  // Capa que se agita en la oscuridad
  capa(t) {
    soplo(t, 0.7, "bandpass", 300, [[0.25, 0.45], [0.7, 0.001]], 1.2, [[0.3, 1800], [0.7, 400]]);
    return 650;
  },
  // Propulsor de armadura cargándose
  repulsor(t) {
    tono(220, "sine", [[0.4, 0.12], [0.55, 0.001]], t, 1400);
    soplo(t + 0.35, 0.3, "highpass", 1500, [[0.05, 0.2], [0.3, 0.001]]);
    return 650;
  },
  // Pitido de sistema: "bip-bip"
  pitido(t) {
    tono(1250, "square", [[0.005, 0.07], [0.08, 0.07], [0.09, 0.001]], t);
    tono(1650, "square", [[0.005, 0.07], [0.08, 0.07], [0.09, 0.001]], t + 0.14);
    return 350;
  },
};

// ---------- Voces grabadas (mp3 generados con herramientas/generar_voces.mjs) ----------
const cacheAudio = new Map();
let vozActual = null;

/** Descarga y prepara un audio (se guarda para no descargarlo dos veces). */
function cargarAudio(url) {
  if (!cacheAudio.has(url)) {
    cacheAudio.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)));
  }
  return cacheAudio.get(url);
}

/** Reproduce una voz grabada. Devuelve false si no se pudo (para usar la voz del navegador). */
export async function tocarVoz(url) {
  if (!ctx || ctx.state !== "running") return false;
  try {
    const buffer = await cargarAudio(url);
    callarVoz();
    vozActual = ctx.createBufferSource();
    vozActual.buffer = buffer;
    vozActual.connect(ctx.destination);
    vozActual.start();
    return true;
  } catch {
    cacheAudio.delete(url);
    return false;
  }
}

export function callarVoz() {
  try { vozActual?.stop(); } catch { /* ya terminó */ }
  vozActual = null;
}

/** Toca el efecto y devuelve los milisegundos a esperar antes de hablar (0 si no hay efecto o sonido). */
export function tocarEfecto(nombre) {
  const efecto = EFECTOS[nombre];
  if (!efecto || !ctx || ctx.state !== "running") return 0;
  try { return efecto(ctx.currentTime + 0.02); } catch { return 0; }
}
