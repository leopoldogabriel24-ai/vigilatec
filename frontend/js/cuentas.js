// Pantallas de cuenta: registro (con privacidad y consentimiento), entrar y "Mi cuenta".
import * as api from "./api.js";
import { alMostrar, mostrar } from "./pantallas.js";
import { ponerUsuario, usuarioActual } from "./usuario.js";

const $ = (id) => document.getElementById(id);
const datosDe = (form) => Object.fromEntries(new FormData(form));
const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Muestra un error en el recuadro de error más cercano al formulario. */
function error(desde, texto) {
  let caja = desde;
  while (caja && !caja.querySelector("[data-error]")) caja = caja.parentElement;
  const el = caja?.querySelector("[data-error]");
  if (!el) return;
  el.textContent = texto ?? "";
  el.hidden = !texto;
}

/** Desactiva el botón mientras se espera al servidor (evita dobles envíos). */
async function enviando(form, accion) {
  const boton = form.querySelector("button[type=submit]");
  boton.disabled = true;
  error(form, "");
  try { await accion(); }
  catch (e) { error(form, e.message); }
  finally { boton.disabled = false; }
}

// ---------- Entrar ----------
$("form-entrar").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const d = datosDe(form);
  if (!d.correo || !d.contrasena) return error(form, "Escribe tu correo y tu contraseña.");
  enviando(form, async () => {
    ponerUsuario(await api.entrar(d));
    form.reset();
    mostrar("inicio");
  });
});

// ---------- Registro ----------
const formRegistro = $("form-registro");

function actualizarBloquesMenor() {
  const d = datosDe(formRegistro);
  $("bloque-menor").hidden = d.es_menor !== "si";
  $("bloque-tutor").hidden = d.consentimiento_tipo !== "tutor";
  $("bloque-escuela").hidden = d.consentimiento_tipo !== "escuela";
}
formRegistro.addEventListener("change", actualizarBloquesMenor);

/** Revisa el formulario antes de enviarlo, con mensajes claros. */
function revisarRegistro(d) {
  if ((d.nombre ?? "").trim().length < 2) return "Escribe tu nombre completo.";
  if ((d.apodo ?? "").trim().length < 2) return "Escribe un apodo de al menos 2 letras.";
  if (!CORREO.test(d.correo ?? "")) return "Escribe un correo válido.";
  if ((d.contrasena ?? "").length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (d.es_menor === "si") {
    if (d.consentimiento_tipo === "tutor") {
      if ((d.tutor_nombre ?? "").trim().length < 2) return "Escribe el nombre de tu madre, padre o tutor.";
      if (!CORREO.test(d.tutor_correo ?? "")) return "Escribe el correo de tu madre, padre o tutor.";
      if (!d.confirma_tutor) return "Confirma que tu madre, padre o tutor autoriza que uses VigilaTec.";
    } else if (!d.confirma_escuela) {
      return "Confirma que tu escuela autorizó tu participación.";
    }
  }
  if (!d.acepto_privacidad) return "Para crear tu cuenta debes leer y aceptar el aviso de privacidad.";
  return null;
}

formRegistro.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = datosDe(formRegistro);
  const problema = revisarRegistro(d);
  if (problema) return error(formRegistro, problema);
  const menor = d.es_menor === "si";
  enviando(formRegistro, async () => {
    ponerUsuario(await api.registrar({
      nombre: d.nombre, apodo: d.apodo, correo: d.correo, contrasena: d.contrasena,
      acepto_privacidad: true,
      es_menor: menor,
      consentimiento_tipo: menor ? d.consentimiento_tipo : null,
      consentimiento_confirmado: menor && !!(d.consentimiento_tipo === "tutor" ? d.confirma_tutor : d.confirma_escuela),
      tutor_nombre: menor && d.consentimiento_tipo === "tutor" ? d.tutor_nombre : null,
      tutor_correo: menor && d.consentimiento_tipo === "tutor" ? d.tutor_correo : null,
    }));
    formRegistro.reset();
    actualizarBloquesMenor();
    mostrar("cuenta");   // siguiente paso natural: unirse a su salón
  });
});

// ---------- Mi cuenta ----------
function pintarCuenta() {
  const u = usuarioActual();
  if (!u) return mostrar("entrar");
  $("cta-nombre").textContent = u.nombre;
  $("cta-correo").textContent = u.correo;
  $("form-apodo").apodo.value = u.apodo;
  $("cta-ranking").checked = u.mostrar_en_ranking;
  $("cta-con-salon").hidden = !u.salon;
  $("form-unirse").hidden = !!u.salon;
  if (u.salon) {
    $("cta-salon").textContent = u.salon.nombre;
    $("cta-escuela").textContent = u.salon.escuela;
  }
  document.querySelector("#pantalla-cuenta [data-mensaje]").textContent = "";
}
alMostrar("cuenta", pintarCuenta);

const avisar = (texto) => { document.querySelector("#pantalla-cuenta [data-mensaje]").textContent = texto; };

$("form-apodo").addEventListener("submit", (e) => {
  e.preventDefault();
  enviando(e.target, async () => {
    ponerUsuario(await api.cambiarCuenta({ apodo: e.target.apodo.value }));
    avisar("✅ Apodo guardado.");
  });
});

$("cta-ranking").addEventListener("change", async (e) => {
  try {
    ponerUsuario(await api.cambiarCuenta({ mostrar_en_ranking: e.target.checked }));
    avisar(e.target.checked ? "✅ Tu apodo aparecerá en el ranking." : "✅ Aparecerás como \"Estudiante anónimo\".");
  } catch (err) { avisar(err.message); }
});

$("form-unirse").addEventListener("submit", (e) => {
  e.preventDefault();
  enviando(e.target, async () => {
    ponerUsuario(await api.unirseSalon(e.target.codigo.value));
    e.target.reset();
    pintarCuenta();
    avisar("✅ ¡Listo! Ya estás en tu salón.");
  });
});

$("btn-salir-salon").addEventListener("click", async () => {
  if (!confirm("¿Seguro que quieres salir de tu salón?")) return;
  ponerUsuario(await api.salirSalon());
  pintarCuenta();
});

$("btn-salir").addEventListener("click", async () => {
  await api.salir().catch(() => {});
  ponerUsuario(null);
  mostrar("inicio");
});

$("form-borrar").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!confirm("Esto borrará tu cuenta y todas tus sesiones para siempre. ¿Continuar?")) return;
  enviando(e.target, async () => {
    await api.borrarCuenta(e.target.contrasena.value);
    e.target.reset();
    ponerUsuario(null);
    mostrar("inicio");
  });
});
