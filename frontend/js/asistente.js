// Asistente académico: chat con la IA y preguntas de práctica.
// La conversación vive solo en esta pestaña (no se guarda en ningún lado).
import * as api from "./api.js";
import { alMostrar } from "./pantallas.js";
import { alCambiarUsuario, usuarioActual } from "./usuario.js";

const $ = (id) => document.getElementById(id);
let conversacion = [];   // [{ rol: "user" | "assistant", texto }]

// El asistente es opcional: si no hay clave de la API configurada, todo lo relacionado se oculta
export let iaDisponible = false;
api.asistenteDisponible().then((r) => {
  iaDisponible = r.disponible;
  document.querySelectorAll("[data-solo-ia]").forEach((el) => { el.hidden = !iaDisponible; });
}).catch(() => {});

// ---------- Formato de las respuestas (Markdown sencillo, seguro) ----------
const escapar = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const enLinea = (t) => escapar(t)
  .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>");

/** Convierte el texto de la IA (títulos, listas, negritas) en HTML. Todo se escapa primero. */
export function formatear(texto) {
  const html = [];
  let lista = null;   // "ul" u "ol" abierta
  const cerrarLista = () => { if (lista) { html.push(`</${lista}>`); lista = null; } };
  for (const linea of texto.split("\n")) {
    const l = linea.trim();
    let m;
    if (!l) { cerrarLista(); continue; }
    if ((m = l.match(/^#{1,4}\s+(.*)/))) { cerrarLista(); html.push(`<h4>${enLinea(m[1])}</h4>`); continue; }
    if ((m = l.match(/^[-*•]\s+(.*)/)) || (m = l.match(/^\d+[.)]\s+(.*)/))) {
      const tipo = /^\d/.test(l) ? "ol" : "ul";
      if (lista !== tipo) { cerrarLista(); html.push(`<${tipo}>`); lista = tipo; }
      html.push(`<li>${enLinea(m[1])}</li>`);
      continue;
    }
    cerrarLista();
    html.push(`<p>${enLinea(l)}</p>`);
  }
  cerrarLista();
  return html.join("");
}

// ---------- Contador de preguntas ----------
function pintarEstado(e) {
  const c = $("as-contador");
  if (!e.disponible) { c.textContent = "Asistente no configurado todavía"; c.className = "contador-ia agotado"; return; }
  c.textContent = `Te quedan ${e.restantes} de ${e.limite_diario} preguntas hoy`;
  c.className = `contador-ia${e.restantes === 0 ? " agotado" : ""}`;
}

async function abrir() {
  const hay = !!usuarioActual();
  $("as-sin-cuenta").hidden = hay;
  $("as-con-cuenta").hidden = !hay;
  if (hay) api.asistenteEstado().then(pintarEstado).catch(() => {});
}
alMostrar("asistente", abrir);
alCambiarUsuario(() => { conversacion = []; limpiarChat(); });

// ---------- Chat ----------
function burbuja(rol, contenido, fuentes = []) {
  const div = document.createElement("div");
  div.className = `burbuja ${rol}`;
  if (rol === "assistant") div.innerHTML = formatear(contenido);
  else div.textContent = contenido;
  const validas = fuentes.filter((f) => /^https?:\/\//.test(f.url));
  if (validas.length) {
    const caja = document.createElement("div");
    caja.className = "fuentes";
    caja.append(Object.assign(document.createElement("b"), { textContent: "Fuentes:" }));
    const ul = document.createElement("ul");
    for (const f of validas) {
      const a = Object.assign(document.createElement("a"), { href: f.url, textContent: f.titulo, target: "_blank", rel: "noopener noreferrer" });
      ul.append(Object.assign(document.createElement("li"), {}));
      ul.lastChild.append(a);
    }
    caja.append(ul);
    div.append(caja);
  }
  $("as-mensajes").append(div);
  div.scrollIntoView({ behavior: "smooth", block: "nearest" });
  return div;
}

function limpiarChat() {
  $("as-mensajes").replaceChildren($("as-bienvenida") ?? "");
  $("as-bienvenida").hidden = false;
}

function errorEn(form, texto) {
  const el = form.parentElement.querySelector("[data-error]") ?? form.querySelector("[data-error]");
  el.textContent = texto ?? "";
  el.hidden = !texto;
}

$("form-asistente").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const pregunta = form.pregunta.value.trim();
  if (pregunta.length < 2) return;
  errorEn(form, "");
  $("as-bienvenida").hidden = true;
  const enviada = burbuja("user", pregunta);
  const pensando = burbuja("assistant", "Pensando…");
  pensando.classList.add("pensando");
  const boton = form.querySelector("button[type=submit]");
  boton.disabled = true;
  try {
    const r = await api.preguntarAsistente({
      pregunta, buscar_web: form.buscar_web.checked,
      historial: conversacion.slice(-6).map((m) => ({ rol: m.rol, texto: m.texto.slice(0, 4000) })),
    });
    pensando.remove();
    burbuja("assistant", r.respuesta + (r.recortada ? "\n\n*(La respuesta se cortó por largo. Pide que continúe o haz una pregunta más concreta.)*" : ""), r.fuentes);
    conversacion.push({ rol: "user", texto: pregunta }, { rol: "assistant", texto: r.respuesta });
    pintarEstado(r.estado);
    form.pregunta.value = "";
  } catch (err) {
    pensando.remove();
    enviada.remove();   // la pregunta sigue en la caja de texto para intentarlo después
    errorEn(form, err.message);
    api.asistenteEstado().then(pintarEstado).catch(() => {});
  } finally {
    boton.disabled = false;
  }
});

// Enter envía, Shift+Enter hace salto de línea
$("form-asistente").pregunta.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.target.form.requestSubmit(); }
});

$("btn-nueva-conversacion").addEventListener("click", () => { conversacion = []; limpiarChat(); });

// ---------- Preguntas de práctica ----------
/** Pide preguntas de práctica y las muestra en `contenedor` (respuestas ocultas hasta que el estudiante quiera verlas). */
export async function generarPractica(tema, contenedor, boton) {
  if (!usuarioActual()) {
    contenedor.innerHTML = "<p class='nota'>Inicia sesión para generar preguntas de práctica.</p>";
    return;
  }
  boton.disabled = true;
  const textoBoton = boton.textContent;
  boton.textContent = "Generando…";
  contenedor.replaceChildren();
  try {
    const r = await api.preguntasPractica(tema);
    const ol = document.createElement("ol");
    ol.className = "lista-practica";
    for (const p of r.preguntas) {
      const li = document.createElement("li");
      const det = document.createElement("details");
      det.append(Object.assign(document.createElement("summary"), { textContent: "Ver respuesta" }));
      det.append(Object.assign(document.createElement("p"), { textContent: p.respuesta }));
      li.append(Object.assign(document.createElement("p"), { textContent: p.pregunta }), det);
      ol.append(li);
    }
    contenedor.append(ol, Object.assign(document.createElement("p"), {
      className: "nota", textContent: `Te quedan ${r.estado.restantes} de ${r.estado.limite_diario} usos del asistente hoy.`,
    }));
  } catch (err) {
    contenedor.append(Object.assign(document.createElement("p"), { className: "error", textContent: err.message }));
  } finally {
    boton.disabled = false;
    boton.textContent = textoBoton;
  }
}

$("form-practica").addEventListener("submit", (e) => {
  e.preventDefault();
  generarPractica(e.target.tema.value.trim(), $("practica-asistente-lista"), e.target.querySelector("button"));
});
