// Usuario con sesión iniciada (o null si usa la app sin cuenta).
import * as api from "./api.js";

let usuario = null;
const oyentes = [];

export const usuarioActual = () => usuario;
export const alCambiarUsuario = (fn) => oyentes.push(fn);

export function ponerUsuario(u) {
  usuario = u;
  // Muestra u oculta los botones del menú según haya cuenta y sea administrador
  document.querySelectorAll("[data-solo-cuenta]").forEach((el) => { el.hidden = !u; });
  document.querySelectorAll("[data-sin-cuenta]").forEach((el) => { el.hidden = !!u; });
  document.querySelectorAll("[data-solo-admin]").forEach((el) => { el.hidden = u?.rol !== "admin"; });
  document.getElementById("menu-apodo").textContent = u ? u.apodo : "Mi cuenta";
  oyentes.forEach((fn) => fn(u));
}

/** Al abrir la página: ¿hay una sesión iniciada en este navegador? */
export async function cargarUsuario() {
  try { ponerUsuario(await api.yo()); } catch { ponerUsuario(null); }
}
