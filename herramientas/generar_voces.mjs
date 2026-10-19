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
const VOCES = {
  // Nota: tras "vibrato" siempre va "aformat=sample_fmts=s16" (sin eso, ffmpeg puede dejar la voz en silencio)
  // Señor oscuro: bajo profundo, lento y pausado, voz "grande" dentro de un casco metálico
  penumbra: {
    variante: "m4", tono: 15, velocidad: 118, palabras: 2,
    filtro: "rubberband=pitch=0.72:formant=shifted,highpass=f=90,lowpass=f=3200,equalizer=f=600:t=q:w=1.2:g=7,"
      + "aecho=0.8:0.55:5|9:0.35|0.25,dynaudnorm=f=150:g=7",
  },
  // Monarca de hierro: barítono más alto y nítido, formal, con timbre de máscara de acero
  tirano: {
    variante: "m1", tono: 45, velocidad: 150,
    filtro: "rubberband=pitch=0.92:formant=preserved,highpass=f=180,lowpass=f=5200,equalizer=f=2400:t=q:w=1:g=6,"
      + "aecho=0.7:0.85:3|4.5:0.6|0.5,flanger=delay=0.8:depth=1.5:speed=0.6:regen=40,dynaudnorm=f=150:g=7",
  },
  // Guerrero: grave, rápido y gritado. Voz base "Klatt", temblor leve, saturación cálida
  // y una capa de respiración (voz susurrada) debajo para que suene menos a zumbido de máquina
  ares: {
    variante: "klatt2", tono: 32, velocidad: 158, amplitud: 150,
    capas: ["rubberband=pitch=0.82:formant=shifted,vibrato=f=5.5:d=0.05,aformat=sample_fmts=s16",
      "rubberband=pitch=0.81:formant=shifted,adelay=12,volume=0.45",
      "rubberband=pitch=0.85,highpass=f=400,volume=0.9"],
    filtro: "highpass=f=80,lowpass=f=3400,equalizer=f=250:t=q:w=1:g=6,equalizer=f=1500:t=q:w=1:g=2,"
      + "volume=2.5,asoftclip=type=tanh:threshold=0.55,aecho=0.6:0.3:60:0.18,deesser,dynaudnorm=f=150:g=7",
    segundaVariante: "whisper",
  },
  // Justiciero nocturno: susurro rasposo y voz grave "Klatt" debajo, con mucho aire y aspereza cálida
  buho: {
    variante: "whisper", tono: 20, velocidad: 122,
    capas: ["rubberband=pitch=0.85,highpass=f=300,volume=2.2",
      "rubberband=pitch=0.62:formant=shifted,vibrato=f=4.5:d=0.04,aformat=sample_fmts=s16,volume=0.6,lowpass=f=1100"],
    filtro: "highpass=f=90,lowpass=f=5000,equalizer=f=3000:t=q:w=1:g=3,volume=2,asoftclip=type=atan:threshold=0.45,"
      + "aecho=0.6:0.3:35:0.15,deesser,dynaudnorm=f=150:g=8",
    segundaVariante: "klatt2",
  },
  // Supersoldado: grave, calmado y seco, escuchado a través del radio del casco
  jefe: {
    variante: "klatt2", tono: 26, velocidad: 138,
    capas: ["rubberband=pitch=0.84:formant=shifted", "rubberband=pitch=0.86,highpass=f=500,volume=0.5"],
    filtro: "highpass=f=320,lowpass=f=3300,equalizer=f=1400:t=q:w=1.2:g=5,volume=2,asoftclip=type=tanh:threshold=0.6,"
      + "aecho=0.5:0.25:8:0.12,deesser,dynaudnorm=f=150:g=7",
    segundaVariante: "whisper",
  },
  // Profesor anciano y gruñón: lento, voz temblorosa (vibrato y trémolo), con aire y un poco ronca
  profesor: {
    variante: "m3", tono: 42, velocidad: 118, palabras: 1,
    capas: ["rubberband=pitch=0.97:formant=preserved,vibrato=f=6.5:d=0.12,aformat=sample_fmts=s16,tremolo=f=5:d=0.25",
      "rubberband=pitch=0.97,highpass=f=900,volume=0.55"],
    filtro: "highpass=f=130,lowpass=f=4200,equalizer=f=1100:t=q:w=1:g=4,equalizer=f=250:t=q:w=1:g=-3,volume=1.8,"
      + "asoftclip=type=atan:threshold=0.6,aecho=0.6:0.3:22:0.12,deesser,dynaudnorm=f=150:g=7",
    segundaVariante: "whisper",
  },
  // Sargento instructor: rápido, fuerte y gritado, con pecho, aspereza y eco de cuartel
  sargento: {
    variante: "klatt2", tono: 48, velocidad: 172, amplitud: 170,
    capas: ["rubberband=pitch=0.9:formant=shifted",
      "rubberband=pitch=0.9:formant=shifted,adelay=6,volume=0.3",
      "rubberband=pitch=0.92,highpass=f=1200,volume=0.3"],
    filtro: "highpass=f=100,lowpass=f=4800,equalizer=f=260:t=q:w=1:g=3,equalizer=f=1900:t=q:w=1.2:g=5,volume=1.5,"
      + "asoftclip=type=tanh:threshold=0.75,aecho=0.7:0.3:40:0.15,deesser,dynaudnorm=f=120:g=5",
    segundaVariante: "whisper",
  },
  // Ojo de fuego: gravísimo y muy lento, varias voces y un eco que crece
  ojo: {
    variante: "m4", tono: 5, velocidad: 100, palabras: 3,
    // Una capa menos grave para que se oiga en bocinas pequeñas (laptop y celular)
    capas: ["rubberband=pitch=0.5:formant=shifted", "rubberband=pitch=0.45:formant=shifted,adelay=40", "rubberband=pitch=0.72,adelay=20,volume=1.4"],
    filtro: "highpass=f=110,lowpass=f=3200,equalizer=f=1200:t=q:w=1:g=7,aecho=0.8:0.75:140|300|520:0.45|0.35|0.25,dynaudnorm=f=150:g=9",
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
