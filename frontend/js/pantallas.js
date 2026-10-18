// Navegación: muestra una pantalla a la vez y avisa a quien necesite cargar datos al abrirla.
const ganchos = {};
let actual = "inicio";
let anterior = "inicio";

/** Registra una función que se ejecuta cada vez que se abre esa pantalla. */
export function alMostrar(nombre, fn) {
  (ganchos[nombre] ??= []).push(fn);
}

export function mostrar(nombre) {
  if (nombre !== actual) { anterior = actual; actual = nombre; }
  document.querySelectorAll(".pantalla").forEach((p) => p.classList.toggle("activa", p.id === `pantalla-${nombre}`));
  window.scrollTo(0, 0);
  (ganchos[nombre] ?? []).forEach((fn) => fn());
}

export const pantallaActual = () => actual;

// Botones "Volver" regresan a la pantalla anterior
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-volver]")) mostrar(anterior);
});
