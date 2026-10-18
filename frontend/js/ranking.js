// Pantalla de ranking: dentro del salón y entre salones de la escuela.
import * as api from "./api.js";
import { alMostrar, mostrar } from "./pantallas.js";
import { usuarioActual } from "./usuario.js";

const $ = (id) => document.getElementById(id);
const valor = (nombre) => document.querySelector(`input[name=${nombre}]:checked`).value;
const NOMBRE_PERIODO = { semana: "esta semana", mes: "este mes", total: "desde siempre" };
let elegido = { salonId: null, escuelaId: null };   // el administrador puede ver cualquier salón de su escuela

/** El administrador abre el ranking de un salón o escuela específicos. */
export function verRanking({ salonId = null, escuelaId = null, vista = "salon" }) {
  elegido = { salonId, escuelaId };
  document.querySelector(`input[name=rk-vista][value=${vista}]`).checked = true;
  mostrar("ranking");
}

function celda(fila, texto, clase) {
  const td = fila.insertCell();
  td.textContent = texto;
  if (clase) td.className = clase;
}

function tabla(encabezados, filas, pintarFila) {
  const t = document.createElement("table");
  t.className = "tabla tabla-ranking";
  t.createTHead().insertRow().append(...encabezados.map((h) => Object.assign(document.createElement("th"), { textContent: h })));
  const cuerpo = t.createTBody();
  for (const f of filas) pintarFila(cuerpo.insertRow(), f);
  return t;
}

const medalla = (p) => ({ 1: "🥇", 2: "🥈", 3: "🥉" })[p] ?? p;

async function cargar() {
  const caja = $("rk-contenido");
  if (!usuarioActual()) {
    caja.innerHTML = "<p>Inicia sesión para ver el ranking de tu salón.</p>";
    return;
  }
  caja.innerHTML = "<p class='nota'>Cargando…</p>";
  const periodo = valor("rk-periodo");
  try {
    if (valor("rk-vista") === "salon") {
      const r = await api.rankingSalon(periodo, elegido.salonId);
      $("rk-sub").textContent = `${r.salon} · ${r.escuela} · ${NOMBRE_PERIODO[periodo]}`;
      caja.replaceChildren(tabla(["#", "Apodo", "Min. concentrado", "Distracciones", "Puntos"], r.filas, (tr, f) => {
        if (f.es_tu) tr.className = "es-tu";
        celda(tr, medalla(f.posicion), "posicion");
        celda(tr, f.es_tu ? `${f.apodo} (tú)` : f.apodo);
        celda(tr, f.minutos_concentrados, "num");
        celda(tr, `${f.distracciones} (${f.distracciones_por_hora}/h)`, "num");
        celda(tr, f.puntos, "num fuerte");
      }));
    } else {
      const r = await api.rankingEscuela(periodo, elegido.escuelaId);
      $("rk-sub").textContent = `${r.escuela} · ${NOMBRE_PERIODO[periodo]}`;
      caja.replaceChildren(tabla(["#", "Salón", "Alumnos activos", "Min. concentrado", "Puntos promedio"], r.filas, (tr, f) => {
        if (f.es_tu_salon) tr.className = "es-tu";
        celda(tr, medalla(f.posicion), "posicion");
        celda(tr, f.es_tu_salon ? `${f.salon} (tu salón)` : f.salon);
        celda(tr, `${f.activos} de ${f.estudiantes}`, "num");
        celda(tr, f.minutos_concentrados, "num");
        celda(tr, f.puntos_promedio, "num fuerte");
      }));
    }
    if (!caja.querySelector("tbody tr")) caja.innerHTML = "<p>Aún no hay nadie en este ranking.</p>";
  } catch (e) {
    $("rk-sub").textContent = "";
    caja.innerHTML = "";
    const p = Object.assign(document.createElement("p"), { textContent: e.message });
    caja.append(p);
    if (e.estado === 404 && !elegido.salonId && !elegido.escuelaId) {
      const b = Object.assign(document.createElement("button"), { className: "boton primario", textContent: "Unirme a un salón" });
      b.addEventListener("click", () => mostrar("cuenta"));
      caja.append(b);
    }
  }
}

alMostrar("ranking", cargar);
document.querySelectorAll("input[name=rk-vista], input[name=rk-periodo]").forEach((r) => r.addEventListener("change", cargar));
// Si el estudiante entra al ranking desde el menú, ve el suyo (no el que eligió antes el administrador)
document.querySelectorAll("[data-ir=ranking]").forEach((b) => b.addEventListener("click", () => { elegido = { salonId: null, escuelaId: null }; }, true));
