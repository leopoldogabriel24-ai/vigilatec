// Comunicación con el servidor. Solo se envían números, nunca imágenes.

/** Identificador anónimo de este navegador (para usar la app sin cuenta). */
export function idDispositivo() {
  const nuevo = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^a-z0-9-]/gi, "").slice(0, 40);
  try {
    let id = localStorage.getItem("vigilatec_id");
    if (!id) { id = nuevo(); localStorage.setItem("vigilatec_id", id); }
    return id;
  } catch {
    // Navegación privada: usamos un id temporal
    idDispositivo.temporal ??= nuevo();
    return idDispositivo.temporal;
  }
}

/** Convierte los errores del servidor en un mensaje entendible. */
function explicar(detalle, estado) {
  if (Array.isArray(detalle)) {
    const msg = detalle[0]?.msg ?? "";
    if (msg.startsWith("Value error, ")) return msg.slice(13);
    return "Revisa los datos: hay un campo vacío, muy corto o con un formato incorrecto.";
  }
  if (typeof detalle === "string") return detalle;
  return estado >= 500 ? "El servidor tuvo un problema. Inténtalo en un momento." : `Error del servidor (${estado})`;
}

async function pedir(ruta, opciones = {}) {
  let r;
  try {
    r = await fetch(ruta, { headers: { "Content-Type": "application/json" }, credentials: "same-origin", ...opciones });
  } catch {
    throw Object.assign(new Error("Sin conexión con el servidor. Revisa tu internet."), { estado: 0 });
  }
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw Object.assign(new Error(explicar(datos?.detail, r.status)), { estado: r.status });
  return datos;
}

const enviar = (metodo) => (ruta, datos) => pedir(ruta, { method: metodo, body: JSON.stringify(datos ?? {}) });
const post = enviar("POST"), patch = enviar("PATCH"), borrar = enviar("DELETE");
const dispositivo = () => `dispositivo_id=${encodeURIComponent(idDispositivo())}`;

// Paquetes y sesiones
export const paquetes = () => pedir("api/paquetes");
export const iniciarSesion = () => post("api/sesiones/iniciar");
export const guardarSesion = (datos) => post("api/sesiones", datos);
export const historial = () => pedir(`api/sesiones?${dispositivo()}`);
export const informe = (id) => pedir(`api/sesiones/${id}?${dispositivo()}`);
export const progreso = (semanas = 8) => pedir(`api/progreso?semanas=${semanas}&${dispositivo()}`);

// Cuentas
export const yo = () => pedir("api/cuentas/yo");
export const registrar = (datos) => post("api/cuentas/registro", { ...datos, dispositivo_id: idDispositivo() });
export const entrar = (datos) => post("api/cuentas/entrar", { ...datos, dispositivo_id: idDispositivo() });
export const salir = () => post("api/cuentas/salir");
export const cambiarCuenta = (datos) => patch("api/cuentas/yo", datos);
export const borrarCuenta = (contrasena) => borrar("api/cuentas/yo", { contrasena });

// Escuelas y salones
export const unirseSalon = (codigo) => post("api/salones/unirse", { codigo });
export const salirSalon = () => post("api/salones/salir");
export const misEscuelas = () => pedir("api/escuelas");
export const crearEscuela = (nombre) => post("api/escuelas", { nombre });
export const crearSalon = (escuelaId, nombre) => post(`api/escuelas/${escuelaId}/salones`, { nombre });
export const nuevoCodigo = (salonId) => post(`api/salones/${salonId}/nuevo-codigo`);
export const miembros = (salonId) => pedir(`api/salones/${salonId}/miembros`);
export const quitarMiembro = (salonId, usuarioId) => borrar(`api/salones/${salonId}/miembros/${usuarioId}`);

// Ranking
export const rankingSalon = (periodo, salonId) => pedir(`api/ranking/salon?periodo=${periodo}${salonId ? `&salon_id=${salonId}` : ""}`);
export const rankingEscuela = (periodo, escuelaId) => pedir(`api/ranking/escuela?periodo=${periodo}${escuelaId ? `&escuela_id=${escuelaId}` : ""}`);

// Asistente académico (IA)
export const asistenteDisponible = () => pedir("api/asistente/disponible");
export const asistenteEstado = () => pedir("api/asistente/estado");
export const preguntarAsistente = (datos) => post("api/asistente/preguntar", datos);
export const preguntasPractica = (tema, cantidad = 5) => post("api/asistente/practica", { tema, cantidad });
