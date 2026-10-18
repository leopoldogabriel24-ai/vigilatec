// Comunicación con el servidor. Solo se envían números, nunca imágenes.

/** Identificador anónimo de este navegador (mientras no existan cuentas). */
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

async function pedir(ruta, opciones = {}) {
  const r = await fetch(ruta, { headers: { "Content-Type": "application/json" }, ...opciones });
  if (!r.ok) throw new Error(`Error del servidor (${r.status})`);
  return r.json();
}

export const paquetes = () => pedir("api/paquetes");
export const guardarSesion = (datos) => pedir("api/sesiones", { method: "POST", body: JSON.stringify(datos) });
export const historial = () => pedir(`api/sesiones?dispositivo_id=${encodeURIComponent(idDispositivo())}`);
export const informe = (id) => pedir(`api/sesiones/${id}?dispositivo_id=${encodeURIComponent(idDispositivo())}`);
