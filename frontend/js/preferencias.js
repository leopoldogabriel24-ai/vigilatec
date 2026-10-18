// Preferencias del estudiante: se guardan en este navegador para la próxima vez.
// Cuando existan cuentas, se podrán guardar también en el servidor.

const CLAVE = "vigilatec_preferencias";

const PREDETERMINADAS = {
  apariencia: "vigilatec",
  severidad: "normal",
  voz: true,
  microfono: false,
  hoja: true,           // estudio con hoja o libro
  minutos: {},          // última duración usada en cada paquete, por ejemplo { estudio: 25 }
};

export function cargarPreferencias() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE) ?? "{}");
    return { ...PREDETERMINADAS, ...guardadas, minutos: { ...(guardadas.minutos ?? {}) } };
  } catch {
    return { ...PREDETERMINADAS, minutos: {} };   // navegación privada o datos dañados
  }
}

export function guardarPreferencias(cambios) {
  const nuevas = { ...cargarPreferencias(), ...cambios };
  try { localStorage.setItem(CLAVE, JSON.stringify(nuevas)); } catch { /* sin almacenamiento: no pasa nada */ }
  return nuevas;
}
