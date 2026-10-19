// Vigilante: el personaje en pantalla, sus expresiones, mensajes y voz.
import { MENSAJES } from "./config.js";
import { VIGILANTES, VIGILANTE_POR_ID } from "./vigilantes.js";
import { callarVoz, tocarEfecto, tocarVoz } from "./efectos.js";

// Índices de las voces grabadas: { personaje: Promise<{ texto: archivo }> }
const indicesVoz = {};
function indiceDe(id) {
  indicesVoz[id] ??= fetch(`audio/voces/${id}/indice.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return indicesVoz[id];
}

const azar = (lista) => (Array.isArray(lista) ? lista[Math.floor(Math.random() * lista.length)] : lista);

// Pistas para elegir una voz de hombre o de mujer según su nombre (depende del dispositivo)
const VOCES_MUJER = /paulina|m[oó]nica|helena|laura|sabina|elvira|dalia|luc[ií]a|marisol|female|mujer/i;
const VOCES_HOMBRE = /jorge|juan|diego|pablo|ra[uú]l|[aá]lvaro|enrique|carlos|male|hombre/i;

export class Vigilante {
  constructor(svg, globo) {
    this.svg = svg;
    this.globo = globo;
    this.voz = true;
    this.nivel = 0;
    this.voces = [];
    if ("speechSynthesis" in window) {
      // Las voces del navegador cargan un poco después
      const cargar = () => { this.voces = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("es")); };
      cargar();
      speechSynthesis.addEventListener?.("voiceschanged", cargar);
    }
    this.usar(VIGILANTES[0].id);
  }

  /** Cambia el personaje (dibujo, voz y forma de hablar). */
  usar(id) {
    this.personaje = VIGILANTE_POR_ID[id] ?? VIGILANTES[0];
    this.svg.innerHTML = this.personaje.svg;
    this.svg.setAttribute("aria-label", `Vigilante: ${this.personaje.nombre}`);
    if (this.personaje.vozGrabada) indiceDe(this.personaje.id);   // se descarga desde ahora
    this.pintarNivel(this.nivel);
  }

  pintarNivel(nivel) {
    this.nivel = nivel;
    const hablando = this.svg.classList.contains("hablando") ? " hablando" : "";
    this.svg.setAttribute("class", `vigilante nivel-${nivel} ap-${this.personaje.id}${hablando}`);
  }

  /** Cambia la expresión (0 = tranquilo, 3 = muy serio) y el texto del globo. */
  mostrar(texto, nivel, { positivo = false } = {}) {
    this.pintarNivel(nivel);
    this.globo.className = `globo nivel-${nivel}${positivo ? " positivo" : ""}`;
    this.globo.textContent = texto;
  }

  /** Advertencia por una distracción, con el tono del personaje. */
  advertir(tipoMensaje, nivel) {
    // Algunos personajes tienen sus propias frases (por ejemplo, Maestro Musgo habla al revés)
    const frases = this.personaje.mensajes?.[tipoMensaje]?.[nivel] ?? MENSAJES[tipoMensaje][nivel];
    const texto = this.personaje.decorar(azar(frases), nivel);
    this.mostrar(texto, nivel);
    this.hablar(texto, nivel);
  }

  /** Frase propia del personaje (inicio, calma, ánimo). */
  frase(clave) { return azar(this.personaje.frases[clave]); }

  calma() { this.mostrar(this.frase("calma"), 0); }

  animar() {
    const texto = this.frase("animo");
    this.mostrar(texto, 0, { positivo: true });
    this.hablar(texto, 0);
  }

  /** Mueve la boca del vigilante mientras habla. */
  animarBoca(ms) {
    clearTimeout(this.finBoca);
    this.svg.classList.add("hablando");
    this.finBoca = setTimeout(() => this.svg.classList.remove("hablando"), ms);
  }

  /** Elige la voz del dispositivo que mejor le queda al personaje (prefiere las voces "naturales"). */
  elegirVoz() {
    const { genero } = this.personaje.voz;
    const filtro = genero === "f" ? VOCES_MUJER : genero === "m" ? VOCES_HOMBRE : null;
    if (this.personaje.vozAnterior) {
      // Forma anterior de elegir (el dueño prefiere cómo sonaban así algunos personajes)
      const mexicana = (v) => v.lang === "es-MX";
      return (filtro && (this.voces.find((v) => filtro.test(v.name) && mexicana(v)) ?? this.voces.find((v) => filtro.test(v.name))))
        ?? this.voces.find(mexicana) ?? this.voces[0] ?? null;
    }
    const puntos = (v) => (/natural|neural|online/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0)
      + (/es-(MX|US|419)/i.test(v.lang) ? 2 : 0) + (filtro && filtro.test(v.name) ? 3 : 0);
    return [...this.voces].sort((a, b) => puntos(b) - puntos(a))[0] ?? null;
  }

  /** Lee el mensaje en voz alta (más grave y lento si es severo). */
  hablar(texto, nivel) {
    if (!this.voz || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    clearTimeout(this.esperaVoz);
    callarVoz();
    // Primero su efecto de sonido (respiración, fuego, pitido…) y luego la voz
    const espera = this.personaje.efecto ? tocarEfecto(this.personaje.efecto) : 0;
    const turno = (this.turnoVoz = (this.turnoVoz ?? 0) + 1);   // si llega otro aviso, este se descarta
    this.esperaVoz = setTimeout(() => this.decir(texto, nivel, turno), espera);
  }

  async decir(texto, nivel, turno = this.turnoVoz) {
    // Personajes con voz grabada: se reproduce su mp3 (con efectos); si no existe, se usa la voz del navegador
    if (this.personaje.vozGrabada) {
      const archivo = (await indiceDe(this.personaje.id))[texto];
      if (turno !== this.turnoVoz) return;
      const dura = archivo ? await tocarVoz(`audio/voces/${this.personaje.id}/${archivo}`) : 0;
      if (dura) { this.animarBoca(dura); return; }
    }
    // Las palabras en MAYÚSCULAS se pasan a minúsculas para que la voz no las deletree
    const u = new SpeechSynthesisUtterance(texto.replace(/[A-ZÁÉÍÓÚÑÜ]{2,}/g, (p) => p.toLowerCase()));
    const voz = this.elegirVoz();
    u.lang = voz?.lang ?? "es-MX";
    if (voz) u.voice = voz;
    const { tono, velocidad } = this.personaje.voz;
    u.pitch = Math.max(0.1, Math.min(2, tono * (nivel >= 2 ? 0.9 : 1)));
    u.rate = velocidad * (nivel >= 3 ? 0.92 : 1);
    // La boca se mueve mientras habla (calculado por el largo de la frase, y se detiene al terminar)
    this.animarBoca(Math.max(1200, texto.length * 70 / u.rate));
    u.onend = () => this.svg.classList.remove("hablando");
    speechSynthesis.speak(u);
  }

  callar() {
    this.svg.classList.remove("hablando");
    this.turnoVoz = (this.turnoVoz ?? 0) + 1;
    clearTimeout(this.esperaVoz);
    callarVoz();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
}
