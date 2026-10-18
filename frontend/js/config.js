// Ajustes de VigilaTec: modos, sensibilidad y mensajes del vigilante.

// Segundos que debe durar una conducta para contarla como distracción.
// null = en ese modo no se vigila esa conducta.
export const MODOS = {
  examen: {
    nombre: "Modo Examen",
    minutos: 60,
    umbrales: { ausente: 2, mirada: 1.5, movimiento: 2, pestana: 0, otra_persona: 1 },
    nivelMinimo: 2,          // en examen el primer aviso ya es firme
    animoCadaSeg: null,      // en examen no hay mensajes de ánimo
  },
  estudio: {
    nombre: "Modo Estudio",
    minutos: 25,
    umbrales: { ausente: 5, mirada: 4, movimiento: 4, pestana: 3, otra_persona: null },
    nivelMinimo: 1,
    animoCadaSeg: 300,       // cada 5 minutos concentrado, un mensaje de ánimo
  },
};

// Multiplica los umbrales: "suave" tolera más, "estricto" tolera menos.
export const SEVERIDAD = { suave: 1.6, normal: 1, estricto: 0.6 };

// Sensibilidad de la detección por cámara.
export const DETECCION = {
  calibracionSeg: 3,       // tiempo para aprender cómo te ves "mirando al frente"
  giroMax: 0.13,           // cuánto puede girar la cabeza hacia un lado
  ojosLadoMax: 0.6,        // cuánto pueden mirar los ojos de lado (0 a 1)
  ojosArribaMax: 0.65,     // cuánto pueden mirar los ojos hacia arriba (0 a 1)
  movimientoMax: 0.8,      // velocidad máxima de la cabeza (en "anchos de cara" por segundo)
  ventanaMovSeg: 1.5,      // segundos que se usan para medir el movimiento
  alejadoMin: 0.55,        // si la cara se ve menor a 55% de lo normal, te alejaste o te paraste
  graciaSeg: 1,            // segundos "bien" necesarios para dar por terminada una distracción
  repetirAvisoSeg: 8,      // si la distracción sigue, se repite el aviso cada 8 s (más fuerte)
  cadaMs: 100,             // analizar la cámara 10 veces por segundo
};

// Nombres para mostrar en el informe
export const NOMBRES_TIPO = {
  ausente: "No estabas",
  mirada: "Mirada desviada",
  movimiento: "Mucho movimiento",
  pestana: "Saliste de la página",
  otra_persona: "Otra persona",
};

// Mensajes del vigilante por tipo y nivel (1 = suave, 2 = firme, 3 = severo)
export const MENSAJES = {
  ausente: {
    1: ["¿A dónde fuiste? Regresa a tu lugar.", "No te veo. Vuelve frente a la cámara."],
    2: ["Vuelve a tu asiento, el tiempo sigue corriendo.", "Te levantaste. Regresa ya."],
    3: ["¡Regresa ahora! En un examen real esto sería abandono."],
  },
  mirada: {
    1: ["Mantén la vista en tu hoja.", "Ojos en tu trabajo, por favor."],
    2: ["Te vi mirando hacia otro lado. Concéntrate.", "No voltees. Mantén la vista en tu hoja."],
    3: ["Última advertencia: la vista en tu hoja.", "¡Deja de voltear! Te estoy observando."],
  },
  movimiento: {
    1: ["Trata de no moverte tanto.", "Siéntate bien y quédate en tu lugar."],
    2: ["Te estás moviendo demasiado. Quédate quieto.", "Tranquilo, quédate en tu lugar."],
    3: ["¡Deja de moverte! Siéntate y concéntrate."],
  },
  pestana: {
    1: ["Saliste de la página. Vuelve a lo tuyo."],
    2: ["No cambies de ventana durante la sesión."],
    3: ["¡Cambiar de ventana en un examen real es motivo de anulación!"],
  },
  otra_persona: {
    1: ["Veo a alguien más. El examen es individual."],
    2: ["Hay otra persona contigo. El examen es individual."],
    3: ["¡Nadie puede ayudarte! Pide que se retire."],
  },
};

export const ANIMO = ["Muy bien, sigue así.", "Excelente concentración.", "Vas muy bien, no te detengas."];
export const MENSAJE_CALMA = "Te estoy observando. Concéntrate.";
