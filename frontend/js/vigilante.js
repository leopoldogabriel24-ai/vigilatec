// Vigilante: el personaje en pantalla, sus expresiones, mensajes y voz.
import { MENSAJES, MENSAJE_CALMA, ANIMO } from "./config.js";

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

export class Vigilante {
  constructor(svg, globo) {
    this.svg = svg;
    this.globo = globo;
    this.voz = true;
    this.vozEspanol = null;
    // Las voces del navegador cargan un poco después
    if ("speechSynthesis" in window) {
      const elegir = () => {
        const voces = speechSynthesis.getVoices();
        this.vozEspanol = voces.find((v) => v.lang === "es-MX") ?? voces.find((v) => v.lang.startsWith("es")) ?? null;
      };
      elegir();
      speechSynthesis.addEventListener?.("voiceschanged", elegir);
    }
  }

  /** Cambia la expresión (0 = tranquilo, 3 = muy serio) y el texto del globo. */
  mostrar(texto, nivel, { positivo = false } = {}) {
    this.svg.setAttribute("class", `vigilante nivel-${nivel}`);
    this.globo.className = `globo nivel-${nivel}${positivo ? " positivo" : ""}`;
    this.globo.textContent = texto;
  }

  /** Advertencia por una distracción. */
  advertir(tipo, nivel) {
    const texto = azar(MENSAJES[tipo][nivel]);
    this.mostrar(texto, nivel);
    this.hablar(texto, nivel);
  }

  calma() { this.mostrar(MENSAJE_CALMA, 0); }

  animar() {
    const texto = azar(ANIMO);
    this.mostrar(texto, 0, { positivo: true });
    this.hablar(texto, 0);
  }

  /** Lee el mensaje en voz alta (más grave y lento si es severo). */
  hablar(texto, nivel) {
    if (!this.voz || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = this.vozEspanol?.lang ?? "es-MX";
    if (this.vozEspanol) u.voice = this.vozEspanol;
    u.rate = nivel >= 3 ? 0.9 : 1;
    u.pitch = nivel >= 2 ? 0.8 : 1;
    speechSynthesis.speak(u);
  }

  callar() { if ("speechSynthesis" in window) speechSynthesis.cancel(); }
}
