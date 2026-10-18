// Pantalla del administrador: escuelas, salones, códigos de invitación y alumnos.
import * as api from "./api.js";
import { alMostrar, mostrar } from "./pantallas.js";
import { verRanking } from "./ranking.js";
import { usuarioActual } from "./usuario.js";

const $ = (id) => document.getElementById(id);
const crear = (etiqueta, props = {}, ...hijos) => {
  const el = Object.assign(document.createElement(etiqueta), props);
  el.append(...hijos);
  return el;
};

function error(texto) {
  const el = document.querySelector("#pantalla-admin [data-error]");
  el.textContent = texto ?? "";
  el.hidden = !texto;
}

/** Ejecuta una acción y vuelve a dibujar las escuelas con la respuesta. */
async function hacer(accion) {
  error("");
  try { pintar(await accion()); } catch (e) { error(e.message); }
}

async function mostrarAlumnos(salon, caja) {
  caja.replaceChildren(crear("p", { className: "nota", textContent: "Cargando…" }));
  try {
    const lista = await api.miembros(salon.id);
    if (!lista.length) return caja.replaceChildren(crear("p", { className: "nota", textContent: "Aún no hay alumnos. Comparte el código." }));
    caja.replaceChildren(crear("ul", { className: "lista-alumnos" }, ...lista.map((a) => {
      const quitar = crear("button", { className: "enlace-texto", textContent: "Quitar" });
      quitar.addEventListener("click", async () => {
        if (!confirm(`¿Quitar a ${a.nombre} del salón ${salon.nombre}?`)) return;
        await api.quitarMiembro(salon.id, a.id).catch((e) => error(e.message));
        mostrarAlumnos(salon, caja);
      });
      const extra = a.es_menor ? ` · menor (consentimiento: ${a.consentimiento_tipo === "escuela" ? "escuela" : "tutor"})` : "";
      return crear("li", {}, crear("span", { textContent: `${a.nombre} — "${a.apodo}"${extra}` }), quitar);
    })));
  } catch (e) { caja.replaceChildren(crear("p", { className: "error", textContent: e.message })); }
}

function filaSalon(salon) {
  const alumnos = crear("div", { className: "alumnos", hidden: true });
  const botones = [
    ["Copiar código", async () => {
      await navigator.clipboard?.writeText(salon.codigo).catch(() => {});
      botonCopiar.textContent = "¡Copiado!";
      setTimeout(() => { botonCopiar.textContent = "Copiar código"; }, 1500);
    }],
    ["Alumnos", () => { alumnos.hidden = !alumnos.hidden; if (!alumnos.hidden) mostrarAlumnos(salon, alumnos); }],
    ["Ranking", () => verRanking({ salonId: salon.id, vista: "salon" })],
    ["Nuevo código", () => {
      if (confirm(`El código ${salon.codigo} dejará de funcionar. ¿Crear uno nuevo?`)) hacer(() => api.nuevoCodigo(salon.id));
    }],
  ].map(([texto, fn]) => {
    const b = crear("button", { className: "boton secundario chico", textContent: texto });
    b.addEventListener("click", fn);
    return b;
  });
  const botonCopiar = botones[0];
  return crear("li", { className: "salon-admin" },
    crear("div", { className: "salon-cabecera" },
      crear("b", { textContent: salon.nombre }),
      crear("span", { className: "codigo", textContent: salon.codigo, title: "Código de invitación" }),
      crear("span", { className: "nota", textContent: `${salon.miembros} alumno${salon.miembros === 1 ? "" : "s"}` })),
    crear("div", { className: "botones-salon" }, ...botones),
    alumnos);
}

function pintar(escuelas) {
  const caja = $("adm-escuelas");
  caja.replaceChildren(...escuelas.map((esc) => {
    const form = crear("form", { className: "fila-form" },
      crear("label", { className: "campo" }, crear("span", { textContent: "Nuevo salón" }),
        crear("input", { name: "nombre", maxLength: 60, placeholder: "Ej. 3A", required: true })),
      crear("button", { className: "boton primario", type: "submit", textContent: "Agregar salón" }));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      hacer(() => api.crearSalon(esc.id, form.nombre.value));
    });
    const verEscuela = crear("button", { className: "boton secundario chico", textContent: "Ranking de salones" });
    verEscuela.addEventListener("click", () => verRanking({ escuelaId: esc.id, vista: "escuela" }));
    return crear("div", { className: "panel panel-ancho" },
      crear("div", { className: "escuela-cabecera" }, crear("h3", { textContent: esc.nombre }), verEscuela),
      esc.salones.length
        ? crear("ul", { className: "lista-salones" }, ...esc.salones.map(filaSalon))
        : crear("p", { className: "nota", textContent: "Todavía no hay salones. Agrega el primero." }),
      form);
  }));
}

alMostrar("admin", () => {
  if (usuarioActual()?.rol !== "admin") return mostrar("inicio");
  hacer(() => api.misEscuelas());
});

$("form-escuela").addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = e.target.nombre.value;
  e.target.reset();
  hacer(() => api.crearEscuela(nombre));
});
