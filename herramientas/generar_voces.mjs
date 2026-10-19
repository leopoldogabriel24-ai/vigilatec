// Genera las voces grabadas de algunos vigilantes (prototipo), con efectos de audio.
// Se ejecuta UNA vez en la computadora del desarrollador, no en la app. La app solo reproduce los mp3.
//
// Requisitos: Node 18+, ffmpeg (con rubberband y libmp3lame) y el paquete "mespeak" descomprimido:
//   npm pack mespeak@2.0.2 && tar xzf mespeak-2.0.2.tgz   (crea la carpeta "package")
// Uso:
//   MESPEAK_DIR=/ruta/a/package node herramientas/generar_voces.mjs [id ...]
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const { VIGILANTE_POR_ID } = await import(join(RAIZ, "frontend/js/vigilantes.js"));
const { MENSAJES } = await import(join(RAIZ, "frontend/js/config.js"));

// Voz base del sintetizador y efectos de ffmpeg de cada personaje
// Calidad del cambio de tono (más suave y entendible)
const RB = "pitchq=quality:transients=smooth:phase=independent";
const VOCES = {
  // Notas: tras "vibrato" siempre va "aformat=sample_fmts=s16" (sin eso, ffmpeg puede dejar la voz en silencio).
  // Para que se entiendan las palabras: voz base "m3"/"m4" (las "klatt" se entienden peor), poco cambio de tono
  // en la voz principal y lo grave como una capa aparte por debajo. Rasgos guiados por audios de referencia del dueño.
  // Señor oscuro: grave y pausado, con un retumbe de casco debajo y eco metálico corto
  penumbra: {
    variante: "m3", tono: 28, velocidad: 110, palabras: 2,
    capas: ["anull", `rubberband=pitch=0.6:formant=shifted:${RB},lowpass=f=700,volume=0.4`],
    filtro: "highpass=f=80,lowpass=f=5000,equalizer=f=1200:t=q:w=1:g=4,equalizer=f=2800:t=q:w=1:g=3,"
      + "aecho=0.8:0.5:5|9:0.3|0.2,dynaudnorm=f=150:g=7",
  },
  // Monarca de hierro: barítono formal con timbre de máscara de acero
  tirano: {
    variante: "m3", tono: 52, velocidad: 140,
    filtro: "highpass=f=150,lowpass=f=5000,equalizer=f=2000:t=q:w=1:g=4,aecho=0.7:0.6:3|4.5:0.4|0.3,"
      + "flanger=delay=0.8:depth=1:speed=0.5:regen=30,dynaudnorm=f=150:g=7",
  },
  // Guerrero: grave, rápido y áspero, con aire de grito por debajo
  ares: {
    variante: "m3", tono: 30, velocidad: 150, segundaVariante: "whisper",
    capas: ["anull", "highpass=f=1200,volume=0.35"],
    filtro: "highpass=f=80,lowpass=f=6500,equalizer=f=220:t=q:w=1:g=4,equalizer=f=1900:t=q:w=1:g=6,volume=1.5,"
      + "asoftclip=type=tanh:threshold=0.8,aecho=0.6:0.25:50:0.12,dynaudnorm=f=150:g=7",
  },
  // Justiciero nocturno: muy grave, pausado y rasposo (susurro por debajo)
  buho: {
    variante: "m3", tono: 8, velocidad: 118, palabras: 2, segundaVariante: "whisper",
    capas: ["anull", "highpass=f=1200,volume=0.4"],
    filtro: "highpass=f=70,lowpass=f=6000,equalizer=f=3000:t=q:w=1:g=4,equalizer=f=150:t=q:w=1:g=2,volume=1.4,"
      + "asoftclip=type=atan:threshold=0.75,aecho=0.6:0.25:30:0.1,dynaudnorm=f=150:g=7",
  },
  // Supersoldado: grave, calmado y seco, escuchado a través del radio del casco
  jefe: {
    variante: "m3", tono: 12, velocidad: 135,
    filtro: "highpass=f=200,lowpass=f=4200,equalizer=f=1400:t=q:w=1.2:g=4,volume=1.3,asoftclip=type=tanh:threshold=0.85,"
      + "aecho=0.5:0.25:8:0.1,dynaudnorm=f=150:g=7",
  },
  // Profesor anciano y gruñón: lento, con un temblor leve y algo de aire
  profesor: {
    variante: "m3", tono: 42, velocidad: 118, palabras: 1, segundaVariante: "whisper",
    capas: ["vibrato=f=6:d=0.05,aformat=sample_fmts=s16,tremolo=f=5:d=0.1", "highpass=f=1500,volume=0.25"],
    filtro: "highpass=f=120,lowpass=f=5500,equalizer=f=2500:t=q:w=1:g=3,equalizer=f=250:t=q:w=1:g=-2,dynaudnorm=f=150:g=7",
  },
  // Sargento instructor: rápido, fuerte y gritado, con aspereza y eco de cuartel
  sargento: {
    variante: "m4", tono: 40, velocidad: 160, segundaVariante: "whisper",
    capas: ["anull", "highpass=f=1500,volume=0.2"],
    filtro: "highpass=f=110,lowpass=f=6000,equalizer=f=2000:t=q:w=1:g=4,equalizer=f=250:t=q:w=1:g=2,volume=1.4,"
      + "asoftclip=type=tanh:threshold=0.85,aecho=0.7:0.25:35:0.1,dynaudnorm=f=120:g=5",
  },
  // Ojo de fuego: gravísimo y lento, con un retumbe una octava abajo y eco amplio
  ojo: {
    variante: "m3", tono: 10, velocidad: 100, palabras: 3,
    capas: ["anull", `rubberband=pitch=0.5:formant=shifted:${RB},lowpass=f=500,volume=0.45`],
    filtro: "highpass=f=80,lowpass=f=5000,equalizer=f=2500:t=q:w=1:g=3,aecho=0.8:0.35:260:0.1,dynaudnorm=f=150:g=7",
  },
};

/** Todas las frases que puede decir un personaje (avisos con su estilo + frases propias). */
function frasesDe(personaje) {
  const textos = new Set();
  for (const tipo of Object.keys(MENSAJES)) {
    for (const nivel of [1, 2, 3]) {
      for (const f of personaje.mensajes?.[tipo]?.[nivel] ?? MENSAJES[tipo][nivel]) textos.add(personaje.decorar(f, nivel));
    }
  }
  for (const v of Object.values(personaje.frases)) (Array.isArray(v) ? v : [v]).forEach((f) => textos.add(f));
  return [...textos];
}

const require = createRequire(import.meta.url);
const dirMespeak = process.env.MESPEAK_DIR;
if (!dirMespeak) throw new Error("Falta MESPEAK_DIR (carpeta 'package' de mespeak)");
const meSpeak = require(join(dirMespeak, "src/index.js"));
meSpeak.loadConfig(require(join(dirMespeak, "src/mespeak_config.json")));
meSpeak.loadVoice(require(join(dirMespeak, "voices/es-la.json")));

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VOCES);
const temporal = join(tmpdir(), "vigilatec-voces");
mkdirSync(temporal, { recursive: true });

for (const id of ids) {
  const voz = VOCES[id];
  const salida = join(RAIZ, "frontend/audio/voces", id);
  rmSync(salida, { recursive: true, force: true });
  mkdirSync(salida, { recursive: true });
  const indice = {};
  frasesDe(VIGILANTE_POR_ID[id]).forEach((texto, i) => {
    // 1) Voz base del sintetizador (en minúsculas para que no deletree palabras en MAYÚSCULAS)
    const opciones = { rawdata: "buffer", pitch: voz.tono, speed: voz.velocidad, wordgap: voz.palabras ?? 0, amplitude: voz.amplitud ?? 100 };
    const base = join(temporal, `${id}-${i}.wav`);
    writeFileSync(base, Buffer.from(meSpeak.speak(texto.toLowerCase(), { ...opciones, variant: voz.variante })));
    const entradas = ["-i", base];
    if (voz.segundaVariante) {
      // Segunda voz base (por ejemplo, una voz grave debajo de un susurro)
      const base2 = join(temporal, `${id}-${i}-b.wav`);
      writeFileSync(base2, Buffer.from(meSpeak.speak(texto.toLowerCase(), { ...opciones, variant: voz.segundaVariante })));
      entradas.push("-i", base2);
    }
    // 2) Efectos con ffmpeg y conversión a mp3 ligero
    const archivo = `${String(i).padStart(2, "0")}.mp3`;
    // Cada capa toma la voz base (o la segunda voz, si existe, para la última capa) y luego se mezclan
    const fuente = (k) => (voz.segundaVariante && k === voz.capas.length - 1 ? "[1:a]" : "[0:a]");
    const grafo = voz.capas
      ? `${voz.capas.map((c, k) => `${fuente(k)}${c}[c${k}]`).join(";")};${voz.capas.map((_, k) => `[c${k}]`).join("")}amix=inputs=${voz.capas.length}:normalize=0,${voz.filtro}`
      : voz.filtro;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...entradas, "-filter_complex", grafo,
      "-ac", "1", "-ar", "24000", "-codec:a", "libmp3lame", "-b:a", "40k", join(salida, archivo)]);
    // Revisión automática: el volumen promedio debe ser de voz normal (ni silencio ni ruido saturado)
    const volumen = spawnSync("ffmpeg", ["-hide_banner", "-i", join(salida, archivo), "-af", "volumedetect", "-f", "null", "-"],
      { encoding: "utf8" }).stderr.match(/mean_volume: (-?[\d.]+)/);
    const db = volumen ? Number(volumen[1]) : -99;
    if (db > -8 || db < -40) throw new Error(`${id}/${archivo}: volumen anormal (${db} dB) en "${texto}"`);
    // La "huella" del contenido va en el nombre: si el audio cambia, el navegador no usa una copia vieja guardada
    const huella = createHash("sha1").update(readFileSync(join(salida, archivo))).digest("hex").slice(0, 8);
    const definitivo = archivo.replace(".mp3", `-${huella}.mp3`);
    renameSync(join(salida, archivo), join(salida, definitivo));
    indice[texto] = definitivo;
  });
  writeFileSync(join(salida, "indice.json"), JSON.stringify(indice, null, 1));
  console.log(`${id}: ${Object.keys(indice).length} frases`);
}
