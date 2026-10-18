// Vigilancia: convierte lo que ve la cámara en distracciones con nivel de severidad.
import { MODOS, SEVERIDAD, DETECCION } from "./config.js";

export class Vigilancia {
  /**
   * @param {"examen"|"estudio"} modo
   * @param {"suave"|"normal"|"estricto"} severidad
   * @param {(tipo:string, nivel:number) => void} alAvisar  se llama cuando el vigilante debe hablar
   */
  constructor(modo, severidad, alAvisar) {
    this.config = MODOS[modo];
    this.severidad = SEVERIDAD[severidad];
    this.alAvisar = alAvisar;
    this.distracciones = [];   // distracciones ya terminadas
    this.actual = null;        // conducta que está pasando ahora {tipo, desde, contada, ultimoAviso, nivel}
    this.bienDesde = null;     // desde cuándo todo está bien otra vez
    this.conteo = {};          // cuántas veces ocurrió cada tipo (para subir el nivel)
  }

  /** Decide qué conducta hay ahora (la más grave primero). */
  conductaActual(obs, pestanaOculta) {
    if (pestanaOculta) return "pestana";
    if (obs.caras >= 2 && this.config.umbrales.otra_persona !== null) return "otra_persona";
    if (obs.caras === 0) return "ausente";
    if (obs.movimiento) return "movimiento";
    if (obs.mirada) return "mirada";
    if (obs.ruido) return "ruido";     // solo si el micrófono está activado
    return null;
  }

  /** Se llama muchas veces por segundo. `seg` = segundos transcurridos de la sesión. */
  actualizar(obs, pestanaOculta, seg) {
    if (!obs && !pestanaOculta) return;   // sin imagen nueva de la cámara: no cambia nada
    const tipo = this.conductaActual(obs, pestanaOculta);

    // Todo bien: esperamos un momento antes de cerrar la distracción
    if (tipo === null) {
      if (this.actual) {
        this.bienDesde ??= seg;
        if (seg - this.bienDesde >= DETECCION.graciaSeg) this.cerrar(this.bienDesde);
      }
      return;
    }
    this.bienDesde = null;

    // Cambió el tipo de conducta: cerramos la anterior y empezamos otra
    if (this.actual && this.actual.tipo !== tipo) this.cerrar(seg);
    if (!this.actual) this.actual = { tipo, desde: seg, contada: false, ultimoAviso: 0, nivel: 0 };

    const a = this.actual;
    const umbral = this.config.umbrales[tipo];
    if (umbral === null || umbral === undefined) return;
    const duracion = seg - a.desde;

    // Primera vez que pasa el límite: cuenta como distracción y se avisa
    if (!a.contada && duracion >= umbral * this.severidad.factor) {
      a.contada = true;
      this.conteo[tipo] = (this.conteo[tipo] ?? 0) + 1;
      a.nivel = this.nivelPara(tipo);
      a.ultimoAviso = seg;
      this.alAvisar(tipo, a.nivel);
    } else if (a.contada && seg - a.ultimoAviso >= this.severidad.repetirSeg) {
      // Sigue distraído: el aviso se repite y sube de nivel
      a.nivel = Math.min(3, a.nivel + 1);
      a.ultimoAviso = seg;
      this.alAvisar(tipo, a.nivel);
    }
  }

  /** Nivel del aviso: sube con las veces que se repite la misma distracción. */
  nivelPara(tipo) {
    const n = this.conteo[tipo];
    const base = n <= 1 ? 1 : n <= 3 ? 2 : 3;
    const nivel = Math.min(3, Math.max(1, base + this.severidad.ajusteNivel));  // la severidad sube o baja el tono
    return Math.max(nivel, this.config.nivelMinimo);
  }

  /** Cierra la conducta actual; si duró lo suficiente, se guarda como distracción. */
  cerrar(fin) {
    const a = this.actual;
    if (a?.contada) {
      this.distracciones.push({
        tipo: a.tipo,
        inicio: Math.floor(a.desde),
        duracion: Math.max(1, Math.round(fin - a.desde)),
        nivel: a.nivel,
      });
    }
    this.actual = null;
    this.bienDesde = null;
  }

  /** ¿Hay ahora mismo una distracción contada? */
  get distraido() { return !!this.actual?.contada; }

  /** Segundos distraído hasta ahora (incluye la distracción en curso). */
  segundosDistraido(seg) {
    let total = this.distracciones.reduce((s, d) => s + d.duracion, 0);
    if (this.actual?.contada) total += seg - this.actual.desde;
    return total;
  }

  get numero() { return this.distracciones.length + (this.actual?.contada ? 1 : 0); }

  /** Termina la vigilancia y devuelve todas las distracciones. */
  terminar(seg) {
    if (this.actual) this.cerrar(seg);
    return this.distracciones;
  }
}
