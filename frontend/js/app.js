// Archivo principal: maneja las pantallas y el flujo de la sesión.
import { MODOS, DETECCION, NOMBRES_TIPO } from "./config.js";
import { Detector } from "./detector.js";
import { Vigilancia } from "./vigilancia.js";
import { Vigilante } from "./vigilante.js";
import { Temporizador, formatoReloj, formatoDuracion } from "./temporizador.js";
import * as api from "./api.js";

const $ = (id) => document.getElementById(id);

// Estado de la app
let paquetes = [];     // catálogo que llega del servidor
let paquete = null;    // paquete elegido
let sesion = null;     // datos de la sesión en curso

const vigilante = new Vigilante($("vigilante"), $("mensaje"));

// ---------- Navegación entre pantallas ----------
function mostrar(nombre) {
  document.querySelectorAll(".pantalla").forEach((p) => p.classList.toggle("activa", p.id === `pantalla-${nombre}`));
  window.scrollTo(0, 0);
  if (nombre === "historial") cargarHistorial();
}

document.querySelectorAll("[data-ir]").forEach((b) =>
  b.addEventListener("click", () => {
    if (sesion && !confirm("¿Seguro que quieres terminar la sesión?")) return;
    if (sesion) return finalizar();
    mostrar(b.dataset.ir);
  })
);

// ---------- Paquetes ----------
async function cargarPaquetes() {
  const lista = $("lista-paquetes");
  try {
    paquetes = await api.paquetes();
  } catch {
    lista.innerHTML = "<p class='error'>No se pudieron cargar los paquetes. Revisa tu conexión y recarga la página.</p>";
    return;
  }
  lista.innerHTML = "";
  for (const p of paquetes) {
    const b = document.createElement("button");
    b.className = "tarjeta-modo";
    b.dataset.paquete = p.id;
    b.innerHTML = "<span class='icono'></span><h2></h2><p></p><span class='insignia-precio'></span>";
    b.querySelector(".icono").textContent = p.icono;
    b.querySelector("h2").textContent = p.nombre;
    b.querySelector("p").textContent = p.descripcion;
    const insignia = b.querySelector(".insignia-precio");
    if (p.disponible) {
      insignia.textContent = p.de_pago ? "Incluido en tu plan" : "Gratis";
    } else {
      // Futuro: paquetes de pago que el estudiante aún no tiene
      insignia.textContent = p.precio_mxn ? `De pago · $${p.precio_mxn} MXN` : "Próximamente";
      insignia.classList.add("pago");
      b.disabled = true;
    }
    b.addEventListener("click", () => elegirPaquete(p));
    lista.appendChild(b);
  }
}

function elegirPaquete(p) {
  paquete = p;
  $("config-titulo").textContent = p.nombre;
  $("config-descripcion").textContent = p.descripcion;
  $("config-error").hidden = true;

  // Duración: botones fijos o minutos libres
  const botones = $("cfg-duraciones");
  botones.innerHTML = "";
  botones.hidden = !p.duraciones;
  $("cfg-minutos-libre").hidden = !!p.duraciones;
  if (p.duraciones) {
    for (const min of p.duraciones) {
      const l = document.createElement("label");
      l.innerHTML = `<input type="radio" name="duracion" value="${min}"><span>${min} min</span>`;
      l.querySelector("input").checked = min === p.duracion_por_defecto;
      botones.appendChild(l);
    }
  } else {
    $("cfg-minutos").value = p.duracion_por_defecto;
  }

  // Severidad: algunos paquetes la fijan (el simulacro de examen siempre es estricto)
  document.querySelectorAll("input[name=severidad]").forEach((r) => {
    r.disabled = !!p.severidad_fija;
    if (p.severidad_fija) r.checked = r.value === p.severidad_fija;
  });
  $("cfg-severidad-nota").textContent = p.severidad_fija
    ? "En este paquete el vigilante siempre es estricto, como en un examen real."
    : "";
  mostrar("config");
}

cargarPaquetes();

// ---------- Comenzar sesión ----------
$("btn-comenzar").addEventListener("click", comenzar);

async function comenzar() {
  const minutos = paquete.duraciones
    ? Number(document.querySelector("input[name=duracion]:checked")?.value)
    : Math.round(Number($("cfg-minutos").value));
  if (!(minutos >= 1 && minutos <= 360)) return mostrarError("Escribe una duración entre 1 y 360 minutos.");

  const boton = $("btn-comenzar");
  boton.disabled = true;
  boton.textContent = "Preparando…";
  $("config-error").hidden = true;

  const detector = new Detector($("video"));
  try {
    await detector.encenderCamara();
    vigilante.mostrar("Cargando al vigilante…", 0);
    mostrar("sesion");
    await detector.cargarModelo();
  } catch (e) {
    detector.apagar();
    mostrar("config");
    mostrarError(explicarError(e));
    return;
  } finally {
    boton.disabled = false;
    boton.textContent = "Activar cámara y comenzar";
  }

  const severidad = document.querySelector("input[name=severidad]:checked").value;
  vigilante.voz = $("cfg-voz").checked;

  const modo = paquete.modo;
  sesion = {
    modo, paquete: paquete.id, severidad, minutos, detector,
    temporizador: new Temporizador(minutos * 60),
    vigilancia: new Vigilancia(modo, severidad, (tipo, nivel) => {
      vigilante.advertir(tipo, nivel);
      sesion.ultimoAviso = performance.now();
    }),
    calibInicio: null,        // cuándo empezó la calibración (con cara visible)
    ultimoAviso: 0,
    ultimoAnimo: 0,
    bloqueoPantalla: null,
  };
  $("sesion-modo").textContent = paquete.nombre;
  $("reloj").textContent = formatoReloj(minutos * 60);
  $("progreso").style.width = "0";
  $("pct-vivo").textContent = "—";
  $("num-vivo").textContent = "0";
  vigilante.mostrar("Mira al frente unos segundos. Estoy aprendiendo cómo te ves.", 0);
  mantenerPantallaEncendida();
  sesion.intervalo = setInterval(ciclo, DETECCION.cadaMs);
}

function mostrarError(texto) {
  $("config-error").textContent = texto;
  $("config-error").hidden = false;
}

// Explica en palabras simples por qué no se pudo abrir la cámara
function explicarError(e) {
  if (e.message === "inseguro") return "La cámara solo funciona en páginas seguras (https://). Abre la app desde su link oficial.";
  if (e.message === "sin-soporte") return "Este navegador no permite usar la cámara. Prueba con Chrome, Edge, Safari o Firefox actualizados.";
  if (e.name === "NotAllowedError") return "No diste permiso para usar la cámara. Toca el candado junto a la dirección de la página, permite la cámara y vuelve a intentarlo.";
  if (e.name === "NotFoundError") return "No encontramos ninguna cámara en este dispositivo.";
  if (e.name === "NotReadableError") return "Otra aplicación está usando la cámara. Ciérrala y vuelve a intentarlo.";
  return "No se pudo iniciar el vigilante. Recarga la página e inténtalo otra vez.";
}

// ---------- Ciclo principal (10 veces por segundo) ----------
function ciclo() {
  const s = sesion;
  if (!s) return;
  const obs = document.hidden ? null : s.detector.observar();

  // Fase 1: calibración (antes de que arranque el reloj)
  if (!s.detector.calibrado) {
    if (!obs) return;
    if (obs.caras === 0) {
      s.calibInicio = null;
      s.detector.reiniciarCalibracion();
      vigilante.mostrar("No te veo. Colócate frente a la cámara, con buena luz.", 1);
      return;
    }
    s.calibInicio ??= performance.now();
    vigilante.mostrar("Mira al frente unos segundos. Estoy aprendiendo cómo te ves.", 0);
    if (performance.now() - s.calibInicio >= DETECCION.calibracionSeg * 1000 && s.detector.terminarCalibracion()) {
      s.temporizador.iniciar();
      s.ultimoAnimo = performance.now();
      const texto = s.modo === "examen" ? "El examen comienza ahora. Mucha suerte." : "Comienza tu sesión de estudio. ¡A concentrarse!";
      vigilante.mostrar(texto, 0);
      vigilante.hablar(texto, 0);
    }
    return;
  }

  // Fase 2: vigilancia
  const seg = s.temporizador.transcurrido;
  s.vigilancia.actualizar(obs, document.hidden, seg);
  if (obs) actualizarIndicadores(obs);

  // Si todo va bien desde hace 4 s, el vigilante se calma
  const ahora = performance.now();
  if (!s.vigilancia.distraido && s.vigilancia.actual === null && ahora - s.ultimoAviso > 4000) {
    if (!$("vigilante").classList.contains("nivel-0")) vigilante.calma();
    const cada = MODOS[s.modo].animoCadaSeg;
    if (cada && ahora - s.ultimoAnimo > cada * 1000) {
      vigilante.animar();
      s.ultimoAnimo = ahora;
    }
  }
  if (s.vigilancia.actual) s.ultimoAnimo = ahora;  // el ánimo cuenta solo tiempo concentrado

  // Reloj y estadísticas en vivo
  $("reloj").textContent = formatoReloj(s.temporizador.restante);
  $("progreso").style.width = `${(100 * seg) / s.temporizador.total}%`;
  if (seg >= 1) {
    const pct = Math.max(0, 100 * (1 - s.vigilancia.segundosDistraido(seg) / seg));
    $("pct-vivo").textContent = `${Math.round(pct)}%`;
  }
  $("num-vivo").textContent = s.vigilancia.numero;

  if (s.temporizador.terminado) finalizar();
}

function actualizarIndicadores(obs) {
  const marcar = (id, mal, bien, malTexto) => {
    $(id).classList.toggle("mal", mal);
    $(id).textContent = mal ? malTexto : bien;
  };
  marcar("ind-presente", obs.caras === 0, obs.caras >= 2 ? "Presente (+1)" : "Presente", "Ausente");
  marcar("ind-mirada", obs.mirada, "Mirada", "Mira a otro lado");
  marcar("ind-movimiento", obs.movimiento, "Quietud", obs.alejado ? "Te alejaste" : "Movimiento");
}

// Evita que la pantalla se apague durante la sesión (si el navegador lo permite)
async function mantenerPantallaEncendida() {
  try { sesion.bloqueoPantalla = await navigator.wakeLock?.request("screen"); } catch { /* no disponible */ }
}
document.addEventListener("visibilitychange", () => {
  if (sesion && !document.hidden) mantenerPantallaEncendida();  // el navegador lo suelta al cambiar de pestaña
});

// Aviso si intenta cerrar la página a mitad de sesión
window.addEventListener("beforeunload", (e) => { if (sesion) e.preventDefault(); });

$("btn-terminar").addEventListener("click", () => {
  if (confirm("¿Seguro que quieres terminar la sesión?")) finalizar();
});

// ---------- Terminar sesión e informe ----------
async function finalizar() {
  const s = sesion;
  if (!s) return;
  sesion = null;
  clearInterval(s.intervalo);
  s.detector.apagar();
  vigilante.callar();
  s.bloqueoPantalla?.release?.().catch(() => {});

  const seg = Math.round(s.temporizador.transcurrido);
  const datos = {
    dispositivo_id: api.idDispositivo(),
    modo: s.modo,
    paquete: s.paquete,
    severidad: s.severidad,
    duracion_planeada: s.minutos * 60,
    duracion_real: seg,
    distracciones: s.vigilancia.terminar(seg),
  };

  let inf;
  try {
    inf = await api.guardarSesion(datos);
    $("inf-aviso").hidden = true;
  } catch {
    inf = informeLocal(datos);
    $("inf-aviso").textContent = "No se pudo guardar en el servidor (¿sin internet?). Este informe no quedará en tu historial.";
    $("inf-aviso").hidden = false;
  }
  pintarInforme(inf);
  mostrar("informe");
}

// Mismo cálculo que el servidor, por si no hay conexión
function informeLocal(d) {
  const distraido = Math.min(d.distracciones.reduce((s, x) => s + x.duracion, 0), d.duracion_real);
  const concentrado = d.duracion_real - distraido;
  const pct = d.duracion_real ? Math.round((1000 * concentrado) / d.duracion_real) / 10 : 0;
  const porTipo = {}, tiempoTipo = {};
  for (const x of d.distracciones) {
    porTipo[x.tipo] = (porTipo[x.tipo] ?? 0) + 1;
    tiempoTipo[x.tipo] = (tiempoTipo[x.tipo] ?? 0) + x.duracion;
  }
  return {
    paquete: d.paquete, duracion_real: d.duracion_real, tiempo_concentrado: concentrado, porcentaje_concentracion: pct,
    numero_distracciones: d.distracciones.length, distracciones_por_tipo: porTipo, tiempo_por_tipo: tiempoTipo,
    distraccion_mas_larga: Math.max(0, ...d.distracciones.map((x) => x.duracion)),
    mensaje: pct >= 75 ? "Buen trabajo." : "Sigue practicando, cada sesión cuenta.",
  };
}

const nombrePaquete = (id) => paquetes.find((p) => p.id === id)?.nombre ?? (id === "examen" ? "Examen" : "Estudio");

function pintarInforme(inf) {
  $("inf-paquete").textContent = inf.paquete ? nombrePaquete(inf.paquete) : "";
  $("inf-mensaje").textContent = inf.mensaje;
  $("inf-pct").textContent = `${Math.round(inf.porcentaje_concentracion)}%`;
  $("inf-anillo").style.setProperty("--pct", inf.porcentaje_concentracion);
  $("inf-total").textContent = formatoDuracion(inf.duracion_real);
  $("inf-concentrado").textContent = formatoDuracion(inf.tiempo_concentrado);
  $("inf-num").textContent = inf.numero_distracciones;
  $("inf-larga").textContent = inf.distraccion_mas_larga ? formatoDuracion(inf.distraccion_mas_larga) : "—";

  const lista = $("inf-tipos");
  lista.innerHTML = "";
  const tipos = Object.entries(inf.distracciones_por_tipo);
  if (!tipos.length) {
    lista.innerHTML = "<li>¡Ninguna distracción! 🏅</li>";
    return;
  }
  const maximo = Math.max(...tipos.map(([, n]) => n));
  for (const [tipo, n] of tipos.sort((a, b) => b[1] - a[1])) {
    const li = document.createElement("li");
    li.innerHTML = `<span></span><div class="barrita" style="width:${(100 * n) / maximo}%"></div><span></span>`;
    li.children[0].textContent = NOMBRES_TIPO[tipo] ?? tipo;
    li.children[2].textContent = `${n} · ${formatoDuracion(inf.tiempo_por_tipo[tipo] ?? 0)}`;
    lista.appendChild(li);
  }
}

// ---------- Historial ----------
async function cargarHistorial() {
  const filas = $("hist-filas");
  filas.innerHTML = "<tr><td colspan='5'>Cargando…</td></tr>";
  try {
    const lista = await api.historial();
    filas.innerHTML = "";
    $("hist-vacio").hidden = lista.length > 0;
    for (const s of lista) {
      const tr = document.createElement("tr");
      const celdas = [
        new Date(s.fecha).toLocaleString("es", { dateStyle: "short", timeStyle: "short" }),
        nombrePaquete(s.paquete ?? s.modo),
        formatoDuracion(s.duracion_real),
        s.numero_distracciones,
        `${Math.round(s.porcentaje_concentracion)}%`,
      ];
      for (const c of celdas) tr.insertCell().textContent = c;
      tr.addEventListener("click", async () => {
        try {
          pintarInforme(await api.informe(s.id));
          $("inf-aviso").hidden = true;
          mostrar("informe");
        } catch { /* si falla, se queda en el historial */ }
      });
      filas.appendChild(tr);
    }
  } catch {
    filas.innerHTML = "<tr><td colspan='5'>No se pudo cargar el historial. Revisa tu conexión.</td></tr>";
  }
}
