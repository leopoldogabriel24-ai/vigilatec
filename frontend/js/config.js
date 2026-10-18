// Ajustes de VigilaTec: modos, sensibilidad y mensajes del vigilante.

// Segundos que debe durar una conducta para contarla como distracción.
// null = en ese modo no se vigila esa conducta.
export const MODOS = {
  examen: {
    nombre: "Modo Examen",
    minutos: 60,
    umbrales: { ausente: 2, mirada: 1.5, movimiento: 2, pestana: 0, otra_persona: 1, ruido: 3 },
    nivelMinimo: 2,          // en examen el primer aviso ya es firme
    animoCadaSeg: null,      // en examen no hay mensajes de ánimo
  },
  estudio: {
    nombre: "Modo Estudio",
    minutos: 25,
    umbrales: { ausente: 5, mirada: 4, movimiento: 4, pestana: 3, otra_persona: null, ruido: 6 },
    nivelMinimo: 1,
    animoCadaSeg: 300,       // cada 5 minutos concentrado, un mensaje de ánimo
  },
};

// Severidad del vigilante: cambia la frecuencia y el tono de los avisos.
//   factor:     multiplica los segundos de tolerancia (más alto = tolera más)
//   repetirSeg: cada cuántos segundos repite el aviso si sigues distraído
//   ajusteNivel: sube o baja el tono del mensaje (1 = suave, 3 = severo)
export const SEVERIDAD = {
  suave: {
    factor: 1.6, repetirSeg: 12, ajusteNivel: -1,
    descripcion: "Te da más tiempo antes de avisarte, repite poco y habla con calma.",
  },
  normal: {
    factor: 1, repetirSeg: 8, ajusteNivel: 0,
    descripcion: "Avisos equilibrados: ni muy pacientes ni muy duros.",
  },
  estricto: {
    factor: 0.6, repetirSeg: 5, ajusteNivel: 1,
    descripcion: "Avisa enseguida, repite seguido y con tono firme.",
  },
};

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
  cadaMs: 100,             // analizar la cámara 10 veces por segundo
  // Micrófono (solo volumen)
  ruidoMargenDb: 15,       // cuántos decibeles más fuerte que lo normal del lugar se considera ruido
  ruidoMinimoDb: -50,      // en un cuarto muy silencioso, no avisar por sonidos muy bajitos
  ventanaRuidoSeg: 1.5,    // promedio de 1.5 s para no reaccionar a un golpe o un estornudo
  partVozConversacion: 0.65, // si más del 65% del sonido está en el rango de la voz, es plática
};

// Nombres para mostrar en el informe
export const NOMBRES_TIPO = {
  ausente: "No estabas",
  mirada: "Mirada desviada",
  movimiento: "Mucho movimiento",
  pestana: "Saliste de la página",
  otra_persona: "Otra persona",
  ruido: "Ruido o plática",
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

// Micrófono: "ruido" se guarda como un solo tipo; el mensaje cambia si suena a conversación
MENSAJES.ruido = {
  1: ["Hay mucho ruido. Busca un lugar más tranquilo."],
  2: ["Sigue habiendo mucho ruido. Así es difícil concentrarse."],
  3: ["¡Demasiado ruido! En un examen real te pedirían silencio."],
};
MENSAJES.conversacion = {
  1: ["Escucho una plática. Concéntrate en lo tuyo."],
  2: ["Nada de conversaciones durante la sesión."],
  3: ["¡Silencio! En un examen no se puede hablar."],
};

export const ANIMO = ["Muy bien, sigue así.", "Excelente concentración.", "Vas muy bien, no te detengas."];
export const MENSAJE_CALMA = "Te estoy observando. Concéntrate.";
