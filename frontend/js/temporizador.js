// Temporizador de la sesión. Usa el reloj real, así no se atrasa si cambias de pestaña.
export class Temporizador {
  constructor(segundosTotales) {
    this.total = segundosTotales;
    this.inicio = null;
  }

  iniciar() { this.inicio = Date.now(); }

  /** Segundos que han pasado (con decimales). */
  get transcurrido() {
    if (this.inicio === null) return 0;
    return Math.min((Date.now() - this.inicio) / 1000, this.total);
  }

  get restante() { return this.total - this.transcurrido; }
  get terminado() { return this.inicio !== null && this.restante <= 0; }
}

/** 125 -> "02:05"  ·  3725 -> "1:02:05" */
export function formatoReloj(seg) {
  seg = Math.max(0, Math.ceil(seg));
  const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60;
  const dos = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`;
}

/** 125 -> "2 min 5 s"  ·  3900 -> "1 h 5 min" */
export function formatoDuracion(seg) {
  seg = Math.round(seg);
  if (seg < 60) return `${seg} s`;
  const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60;
  if (h) return `${h} h ${m} min`;
  return s ? `${m} min ${s} s` : `${m} min`;
}
