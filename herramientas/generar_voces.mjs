// Genera las voces grabadas de algunos vigilantes (prototipo), con efectos de audio.
// Se ejecuta UNA vez en la computadora del desarrollador, no en la app. La app solo reproduce los mp3.
//
// Requisitos: Node 18+, ffmpeg (con rubberband y libmp3lame) y el paquete "mespeak" descomprimido:
//   npm pack mespeak@2.0.2 && tar xzf mespeak-2.0.2.tgz   (crea la carpeta "package")
// Uso:
//   MESPEAK_DIR=/ruta/a/package node herramientas/generar_voces.mjs [id ...]
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const { VIGILANTE_POR_ID } = await import(join(RAIZ, "frontend/js/vigilantes.js"));
const { MENSAJES } = await import(join(RAIZ, "frontend/js/config.js"));

// Voz base del sintetizador y efectos de ffmpeg de cada personaje
const VOCES = {
  // Señor oscuro: muy grave, voz encerrada en un casco metálico
  penumbra: {
    variante: "m4", tono: 18, velocidad: 128,
    filtro: "rubberband=pitch=0.72,highpass=f=110,lowpass=f=3400,equalizer=f=650:t=q:w=1.2:g=7,"
      + "aecho=0.8:0.55:5|9:0.35|0.25,chorus=0.6:0.8:30:0.35:0.25:1.5,dynaudnorm=f=150:g=7",
  },
  // Monarca de hierro: grave y metálico, con un ligero zumbido
  tirano: {
    variante: "m3", tono: 28, velocidad: 135,
    filtro: "rubberband=pitch=0.8,highpass=f=140,lowpass=f=4200,aecho=0.8:0.85:7|12:0.55|0.45,"
      + "flanger=delay=1.5:depth=2:speed=0.25:regen=20,dynaudnorm=f=150:g=7",
  },
  // Guerrero espartano: ronco, profundo y con fuerza (la aspereza se agrega después del cambio de tono)
  ares: {
    variante: "m4", tono: 14, velocidad: 138,
    filtro: "rubberband=pitch=0.78,highpass=f=70,lowpass=f=3600,equalizer=f=180:t=q:w=1:g=6,"
      + "volume=4,alimiter=limit=0.6,acrusher=bits=10:mix=0.15:mode=log,aecho=0.6:0.3:45:0.18,dynaudnorm=f=150:g=7",
  },
  // Justiciero nocturno: muy grave, áspero y casi susurrado
  buho: {
    variante: "m4", tono: 10, velocidad: 128,
    filtro: "rubberband=pitch=0.74,highpass=f=90,lowpass=f=2800,equalizer=f=130:t=q:w=1:g=6,"
      + "acrusher=bits=8:mix=0.28:mode=log,volume=2.5,alimiter=limit=0.7,aecho=0.6:0.25:28:0.12,dynaudnorm=f=150:g=7",
  },
  // Ojo de fuego: varias voces graves a la vez y eco enorme
  ojo: {
    variante: "m4", tono: 5, velocidad: 112,
    capas: ["rubberband=pitch=0.55", "rubberband=pitch=0.5,adelay=35", "rubberband=pitch=0.62,adelay=18"],
    filtro: "lowpass=f=2600,aecho=0.8:0.7:110|230|380:0.42|0.3|0.2,dynaudnorm=f=150:g=9",
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
    const wav = meSpeak.speak(texto.toLowerCase(), { rawdata: "buffer", variant: voz.variante, pitch: voz.tono, speed: voz.velocidad });
    const base = join(temporal, `${id}-${i}.wav`);
    writeFileSync(base, Buffer.from(wav));
    // 2) Efectos con ffmpeg y conversión a mp3 ligero
    const archivo = `${String(i).padStart(2, "0")}.mp3`;
    const grafo = voz.capas
      ? `${voz.capas.map((c, k) => `[0:a]${c}[c${k}]`).join(";")};${voz.capas.map((_, k) => `[c${k}]`).join("")}amix=inputs=${voz.capas.length}:normalize=0,${voz.filtro}`
      : voz.filtro;
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", base, "-filter_complex", grafo,
      "-ac", "1", "-ar", "24000", "-codec:a", "libmp3lame", "-b:a", "40k", join(salida, archivo)]);
    indice[texto] = archivo;
  });
  writeFileSync(join(salida, "indice.json"), JSON.stringify(indice, null, 1));
  console.log(`${id}: ${Object.keys(indice).length} frases`);
}
