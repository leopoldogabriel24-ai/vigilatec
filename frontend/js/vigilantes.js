// Apariencias del vigilante: dibujo, voz y forma de hablar de cada personaje.
// Todos los dibujos usan las mismas piezas (cejas, pupilas, boca) para que las
// expresiones de enojo funcionen igual en cualquier personaje.
import { MENSAJE_CALMA, ANIMO } from "./config.js";

// Piezas de dibujo que se repiten
const HALO = `<circle class="halo" cx="100" cy="100" r="92"/>`;
const HOMBROS = `<path class="relleno" d="M58 186 Q62 154 100 152 Q138 154 142 186 Z"/>`;

export const VIGILANTES = [
  {
    id: "vigilatec",
    nombre: "VigilaTec",
    descripcion: "El personaje del logo. Equilibrado.",
    voz: { tono: 1, velocidad: 1, genero: null },
    frases: {
      calma: MENSAJE_CALMA,
      animo: ANIMO,
      inicioExamen: "El examen comienza ahora. Mucha suerte.",
      inicioEstudio: "Comienza tu sesión de estudio. ¡A concentrarse!",
    },
    decorar: (texto) => texto,
    svg: `${HALO}
      <g class="cejas"><path class="ceja izq" d="M50 52 L82 52"/><path class="ceja der" d="M118 52 L150 52"/></g>
      <path class="trazo" d="M40 74 Q30 70 27 52 M160 74 Q170 70 173 52"/>
      <rect class="trazo lente" x="38" y="66" width="56" height="48" rx="10"/>
      <rect class="trazo lente" x="106" y="66" width="56" height="48" rx="10"/>
      <path class="trazo" d="M94 84 Q100 78 106 84"/>
      <g class="pupilas"><circle class="pupila" cx="66" cy="92" r="9"/><circle class="pupila" cx="134" cy="92" r="9"/>
        <circle class="blanco" cx="69" cy="89" r="3"/><circle class="blanco" cx="137" cy="89" r="3"/></g>
      <path class="trazo" d="M60 114 V140 H84 V176 H116 V140 H140 V114"/>
      <path class="boca" d="M90 122 Q100 130 110 122"/>
      <path class="relleno" d="M100 132 L94 142 L100 170 L106 142 Z"/>`,
  },
  {
    id: "profesor",
    nombre: "Profesor serio",
    descripcion: "Formal y exigente, como en el aula.",
    voz: { tono: 0.8, velocidad: 0.95, genero: "m" },
    frases: {
      calma: "Sigue trabajando. Te estoy observando.",
      animo: ["Buen ritmo de trabajo. Continúa.", "Así se estudia. Sigue."],
      inicioExamen: "Pueden comenzar. Tienen el tiempo indicado.",
      inicioEstudio: "Empecemos. Aprovecha bien el tiempo.",
    },
    decorar: (texto, nivel) => (nivel === 2 ? "Atención: " : nivel === 3 ? "Por última vez: " : "") + texto,
    svg: `${HALO}${HOMBROS}
      <path class="blanco" d="M88 154 L100 172 L112 154 Z"/><path class="relleno-oscuro" d="M97 160 L103 160 L105 182 L100 186 L95 182 Z"/>
      <circle class="piel" cx="53" cy="106" r="9"/><circle class="piel" cx="147" cy="106" r="9"/>
      <circle class="piel" cx="100" cy="104" r="48"/>
      <path class="pelo-gris" d="M52 96 Q48 46 100 42 Q152 46 148 96 Q142 68 100 66 Q58 68 52 96 Z"/>
      <g class="cejas"><path class="ceja izq" d="M66 84 L90 84"/><path class="ceja der" d="M110 84 L134 84"/></g>
      <rect class="trazo fino lente" x="63" y="90" width="32" height="22" rx="4"/>
      <rect class="trazo fino lente" x="105" y="90" width="32" height="22" rx="4"/>
      <path class="trazo fino" d="M95 100 L105 100"/>
      <g class="pupilas"><circle class="pupila" cx="79" cy="101" r="5"/><circle class="pupila" cx="121" cy="101" r="5"/></g>
      <path class="pelo-gris" d="M78 126 Q100 116 122 126 Q110 132 100 128 Q90 132 78 126 Z"/>
      <path class="boca" d="M88 138 Q100 141 112 138"/>`,
  },
  {
    id: "profesora",
    nombre: "Profesora amable",
    descripcion: "Te corrige con cariño y te anima.",
    voz: { tono: 1.15, velocidad: 0.95, genero: "f" },
    frases: {
      calma: "Vas bien, aquí estoy contigo.",
      animo: ["¡Qué bien lo estás haciendo!", "Me encanta tu concentración. ¡Sigue así!", "Estoy orgullosa de tu esfuerzo."],
      inicioExamen: "Respira hondo. El examen comienza ahora, ¡tú puedes!",
      inicioEstudio: "¡Empecemos! Vamos a aprovechar este tiempo juntos.",
    },
    decorar: (texto, nivel) => {
      if (nivel === 1) return `Oye, ${texto.charAt(0).toLowerCase()}${texto.slice(1)} ¡Tú puedes!`;
      if (nivel === 2) return `Con cariño te lo digo: ${texto}`;
      return `${texto} Sé que puedes hacerlo mejor.`;
    },
    svg: `${HALO}
      <path class="pelo-cafe" d="M50 110 Q44 56 100 56 Q156 56 150 110 Q152 142 140 152 L60 152 Q48 142 50 110 Z"/>
      <circle class="pelo-cafe" cx="100" cy="46" r="17"/>
      ${HOMBROS}<path class="blanco" d="M86 153 Q100 168 114 153 Z"/>
      <circle class="piel" cx="100" cy="104" r="46"/>
      <path class="pelo-cafe" d="M56 98 Q58 62 100 62 Q142 62 144 98 Q122 76 100 80 Q78 76 56 98 Z"/>
      <g class="cejas"><path class="ceja izq" d="M67 86 L88 83"/><path class="ceja der" d="M112 83 L133 86"/></g>
      <circle class="trazo fino lente" cx="78" cy="103" r="13"/><circle class="trazo fino lente" cx="122" cy="103" r="13"/>
      <path class="trazo fino" d="M91 103 L109 103"/>
      <g class="pupilas"><circle class="pupila" cx="78" cy="103" r="5"/><circle class="pupila" cx="122" cy="103" r="5"/></g>
      <circle class="mejilla" cx="68" cy="122" r="7"/><circle class="mejilla" cx="132" cy="122" r="7"/>
      <path class="boca" d="M84 128 Q100 142 116 128"/>`,
  },
  {
    id: "robot",
    nombre: "Robot",
    descripcion: "Preciso y sin emociones. Reporta todo.",
    voz: { tono: 1.6, velocidad: 1.05, genero: null },
    frases: {
      calma: "Sistema de vigilancia activo. Sin anomalías.",
      animo: ["Concentración óptima detectada.", "Rendimiento excelente. Continúe el proceso."],
      inicioExamen: "Iniciando simulacro de examen. Cronómetro activado.",
      inicioEstudio: "Iniciando sesión de estudio. Vigilancia activada.",
    },
    decorar: (texto, nivel) => `Alerta nivel ${nivel}. ${texto}`,
    svg: `${HALO}
      <path class="trazo" d="M100 44 V30"/><circle class="relleno" cx="100" cy="25" r="6"/>
      <rect class="metal" x="90" y="136" width="20" height="14"/>
      <rect class="relleno" x="66" y="148" width="68" height="36" rx="8"/>
      <rect class="relleno" x="40" y="78" width="12" height="30" rx="4"/><rect class="relleno" x="148" y="78" width="12" height="30" rx="4"/>
      <rect class="metal" x="50" y="44" width="100" height="96" rx="18"/>
      <g class="cejas"><path class="ceja izq" d="M64 68 L90 68"/><path class="ceja der" d="M110 68 L136 68"/></g>
      <rect class="pantalla" x="62" y="76" width="32" height="26" rx="6"/><rect class="pantalla" x="106" y="76" width="32" height="26" rx="6"/>
      <g class="pupilas"><rect class="pupila luz" x="72" y="83" width="12" height="12" rx="2"/><rect class="pupila luz" x="116" y="83" width="12" height="12" rx="2"/></g>
      <path class="boca" d="M76 120 Q100 128 124 120"/>`,
  },
  {
    id: "sargento",
    nombre: "Sargento estricto",
    descripcion: "Disciplina militar. No perdona nada.",
    voz: { tono: 0.7, velocidad: 1.1, genero: "m" },
    frases: {
      calma: "Ojos al frente. Te estoy vigilando.",
      animo: ["¡Así se hace, recluta!", "Disciplina impecable. ¡Sigue!"],
      inicioExamen: "¡Atención! El examen comienza. ¡Nada de distracciones!",
      inicioEstudio: "¡A estudiar, recluta! ¡Sin excusas!",
    },
    decorar: (texto, nivel) => (nivel >= 3 ? "¡Recluta! " : "") + (nivel >= 2 ? texto.toUpperCase() : texto),
    svg: `${HALO}${HOMBROS}
      <circle class="piel" cx="53" cy="110" r="9"/><circle class="piel" cx="147" cy="110" r="9"/>
      <circle class="piel" cx="100" cy="108" r="46"/>
      <path class="relleno" d="M48 86 Q50 44 100 40 Q150 44 152 86 Z"/>
      <rect class="relleno-oscuro" x="42" y="80" width="116" height="13" rx="6"/>
      <path class="dorado" d="M100 51 L104 60 L114 61 L106 67 L109 77 L100 71 L91 77 L94 67 L86 61 L96 60 Z"/>
      <g class="cejas"><path class="ceja gruesa izq" d="M64 102 L90 108"/><path class="ceja gruesa der" d="M110 108 L136 102"/></g>
      <g class="pupilas"><circle class="pupila" cx="77" cy="117" r="6"/><circle class="pupila" cx="123" cy="117" r="6"/></g>
      <path class="boca" d="M86 140 L114 140"/>`,
  },
  // ===================== PREMIUM (prototipo: inspirados en personajes famosos; NO publicar ni vender así) =====================
  {
    id: "penumbra",
    premium: true,
    vozGrabada: true,   // usa audio/voces/penumbra (herramientas/generar_voces.mjs)
    nombre: "Lord Penumbra",
    descripcion: "Señor oscuro de casco negro. Respira… y te vigila.",
    voz: { tono: 0.1, velocidad: 0.78, genero: "m" },
    efecto: "respiracion",
    frases: {
      calma: "Siento tu concentración. Impresionante… muy impresionante.",
      animo: ["El poder del estudio es fuerte en ti.", "Ahora eres tú el maestro."],
      inicioExamen: "El examen ha comenzado. No me decepciones de nuevo.",
      inicioEstudio: "Tu entrenamiento comienza ahora. Únete al lado de la concentración.",
    },
    decorar: (texto, nivel) =>
      (nivel === 2 ? "Encuentro perturbadora tu falta de concentración. " : nivel === 3 ? "No subestimes el poder del lado oscuro. " : "") + texto,
    svg: `${HALO}
      <path class="capa-negra" d="M28 196 Q34 120 62 104 L138 104 Q166 120 172 196 Z"/>
      <path class="gris-oscuro" d="M62 196 Q66 160 100 156 Q134 160 138 196 Z"/>
      <rect class="panel-pecho" x="82" y="166" width="36" height="20" rx="3"/>
      <circle class="boton-rojo" cx="90" cy="173" r="2.5"/><circle class="boton-verde" cx="98" cy="173" r="2.5"/><circle class="boton-azul" cx="106" cy="173" r="2.5"/>
      <path class="rejilla" d="M88 181 H112"/>
      <path class="casco-negro" d="M50 118 Q46 34 100 28 Q154 34 150 118 L168 158 Q150 152 134 148 L126 120 L74 120 L66 148 Q50 152 32 158 Z"/>
      <path class="brillo-casco" d="M68 50 Q100 34 124 44"/>
      <path class="mascara" d="M70 74 L130 74 L127 120 L114 142 L100 152 L86 142 L73 120 Z"/>
      <path class="gris-oscuro" d="M100 78 L94 118 L106 118 Z"/>
      <g class="cejas"><path class="ceja izq" d="M70 88 L96 92"/><path class="ceja der" d="M104 92 L130 88"/></g>
      <g class="pupilas"><path class="pupila lente" d="M72 93 L96 97 L92 111 L74 106 Z"/><path class="pupila lente" d="M128 93 L104 97 L108 111 L126 106 Z"/></g>
      <path class="triangulo-boca" d="M87 124 L113 124 L100 147 Z"/>
      <path class="rejilla" d="M94 129 V136 M100 129 V141 M106 129 V136"/>
      <path class="boca" d="M87 124 L113 124"/>`,
  },
  {
    id: "tirano",
    premium: true,
    vozGrabada: true,   // usa audio/voces/tirano (herramientas/generar_voces.mjs)
    nombre: "El Tirano de Hierro",
    descripcion: "Monarca de máscara de acero y capucha verde. Ordena, no pide.",
    voz: { tono: 0.3, velocidad: 0.8, genero: "m" },
    efecto: "metal",
    frases: {
      calma: "El Tirano observa. Continúa con tu deber.",
      animo: ["El Tirano reconoce tu disciplina.", "Ni siquiera el Tirano podría hacerlo mejor."],
      inicioExamen: "¡Por decreto del Tirano, el examen comienza!",
      inicioEstudio: "El Tirano ordena: hora de estudiar. ¡Arrodíllate ante el conocimiento!",
    },
    decorar: (texto, nivel) =>
      (nivel === 2 ? "El Tirano exige obediencia: " : nivel === 3 ? "¡Insolente! ¡El Tirano no tolera la distracción! " : "") + texto,
    svg: `${HALO}
      <path class="verde-capa" d="M34 196 Q32 120 50 96 Q48 44 100 36 Q152 44 150 96 Q168 120 166 196 Z"/>
      <path class="verde-oscuro" d="M58 142 Q56 62 100 56 Q144 62 142 142 Z"/>
      <path class="verde-oscuro" d="M70 196 L76 162 Q100 170 124 162 L130 196 Z"/>
      <path class="gris-metal" d="M50 178 Q60 158 78 158 L78 196 L50 196 Z"/><path class="gris-metal" d="M150 178 Q140 158 122 158 L122 196 L150 196 Z"/>
      <path class="mascara-acero" d="M66 70 Q100 62 134 70 L134 128 Q128 150 100 158 Q72 150 66 128 Z"/>
      <path class="trazo-metal" d="M68 90 Q100 84 132 90 M72 122 L84 132 M128 122 L116 132"/>
      <circle class="negro" cx="72" cy="78" r="2.2"/><circle class="negro" cx="128" cy="78" r="2.2"/><circle class="negro" cx="70" cy="116" r="2.2"/><circle class="negro" cx="130" cy="116" r="2.2"/><circle class="negro" cx="100" cy="72" r="2.2"/>
      <g class="cejas"><path class="ceja izq" d="M72 92 L94 96"/><path class="ceja der" d="M106 96 L128 92"/></g>
      <g class="pupilas"><rect class="pupila" x="76" y="98" width="18" height="6" rx="2"/><rect class="pupila" x="106" y="98" width="18" height="6" rx="2"/></g>
      <path class="boca" d="M84 136 L116 136"/>
      <path class="rejilla" d="M90 137 V145 M96 137 V147 M104 137 V147 M110 137 V145"/>`,
  },
  {
    id: "ares",
    premium: true,
    vozGrabada: true,   // usa audio/voces/ares (herramientas/generar_voces.mjs)
    nombre: "Ares, el Espartano",
    descripcion: "Guerrero de piel cenicienta y tatuaje rojo. Implacable.",
    voz: { tono: 0.25, velocidad: 0.85, genero: "m" },
    efecto: "tambor",
    frases: {
      calma: "Bien. Sigue así, muchacho.",
      animo: ["Fuerte. Como un verdadero guerrero.", "Lo has hecho bien, muchacho."],
      inicioExamen: "Esta es tu batalla. ¡No retrocedas!",
      inicioEstudio: "Hoy entrenamos, muchacho. Sin excusas.",
    },
    decorar: (texto, nivel) => (nivel >= 2 ? "¡Muchacho! " : "") + texto,
    svg: `${HALO}
      <path class="piel-ceniza" d="M46 196 Q52 150 100 146 Q148 150 154 196 Z"/>
      <path class="tela-roja" d="M48 196 Q54 164 72 156 L88 196 Z"/>
      <path class="correa" d="M72 158 L140 196"/>
      <circle class="piel-ceniza" cx="60" cy="104" r="8"/><circle class="piel-ceniza" cx="140" cy="104" r="8"/>
      <path class="piel-ceniza" d="M60 100 Q58 52 100 48 Q142 52 140 100 Q140 128 128 140 L72 140 Q60 128 60 100 Z"/>
      <path class="marca-roja" d="M96 49 Q114 60 116 86 Q118 110 112 132"/>
      <path class="cicatriz" d="M80 74 L88 84"/>
      <g class="cejas"><path class="ceja gruesa izq" d="M68 94 L92 101"/><path class="ceja gruesa der" d="M108 101 L132 94"/></g>
      <g class="pupilas"><circle class="pupila ambar" cx="80" cy="107" r="4.5"/><circle class="pupila ambar" cx="120" cy="107" r="4.5"/></g>
      <path class="barba" d="M76 120 Q78 158 100 166 Q122 158 124 120 Q112 134 100 134 Q88 134 76 120 Z"/>
      <path class="barba" d="M82 122 Q100 112 118 122 Q100 127 82 122 Z"/>
      <path class="boca" d="M92 142 L108 142"/>`,
  },
  {
    id: "buho",
    premium: true,
    vozGrabada: true,   // usa audio/voces/buho (herramientas/generar_voces.mjs)
    nombre: "El Vigilante Nocturno",
    descripcion: "Justiciero de capa y capucha con orejas de murciélago.",
    voz: { tono: 0.3, velocidad: 0.8, genero: "m" },
    efecto: "capa",
    frases: {
      calma: "Soy la sombra que vigila tu estudio.",
      animo: ["La ciudad está a salvo. Sigue así.", "Así se protege un futuro."],
      inicioExamen: "Esta noche, el examen es mi ciudad. Empieza.",
      inicioEstudio: "Cae la noche. Hora de estudiar en silencio.",
    },
    decorar: (texto, nivel) => (nivel === 1 ? `${texto}..` : nivel === 2 ? `Te estoy vigilando. ${texto}` : `Soy tu peor pesadilla, distracción. ${texto}`),
    svg: `${HALO}
      <path class="capa-negra" d="M30 196 Q36 130 64 112 L136 112 Q164 130 170 196 Z"/>
      <path class="gris-traje" d="M62 196 Q66 160 100 156 Q134 160 138 196 Z"/>
      <path class="negro" d="M78 182 Q86 172 92 178 L96 171 L100 176 L104 171 L108 178 Q114 172 122 182 Q110 179 106 188 Q100 183 94 188 Q90 179 78 182 Z"/>
      <path class="piel" d="M66 116 Q68 152 100 160 Q132 152 134 116 Q100 128 66 116 Z"/>
      <path class="capucha" d="M58 128 Q54 72 64 62 L60 22 L82 56 Q100 50 118 56 L140 22 L136 62 Q146 72 142 128 Q130 118 100 120 Q70 118 58 128 Z"/>
      <path class="gris-oscuro" d="M100 98 L95 117 L105 117 Z"/>
      <g class="cejas"><path class="ceja izq" d="M70 86 L95 94"/><path class="ceja der" d="M105 94 L130 86"/></g>
      <g class="pupilas"><path class="pupila ojo-blanco" d="M72 93 L94 99 L91 105 L74 101 Z"/><path class="pupila ojo-blanco" d="M128 93 L106 99 L109 105 L126 101 Z"/></g>
      <path class="boca" d="M88 142 Q100 138 112 142"/>`,
  },
  {
    id: "ojo",
    premium: true,
    vozGrabada: true,   // usa audio/voces/ojo (herramientas/generar_voces.mjs)
    nombre: "El Ojo Ardiente",
    descripcion: "Ojo de fuego en lo alto de una torre oscura. Todo lo ve.",
    voz: { tono: 0.1, velocidad: 0.7, genero: null },
    efecto: "fuego",
    frases: {
      calma: "Te veo… El Ojo todo lo ve.",
      animo: ["Tu concentración arde como el fuego.", "El Ojo está complacido."],
      inicioExamen: "El Ojo se abre. No hay escapatoria: el examen comienza.",
      inicioEstudio: "El Ojo despierta. Estudia… te estoy mirando.",
    },
    decorar: (texto, nivel) => (nivel === 2 ? "Te veo. " : nivel === 3 ? "No puedes ocultarte de mí. " : "") + texto,
    svg: `${HALO}
      <path class="torre" d="M58 196 L68 124 L50 66 L84 112 L100 156 L116 112 L150 66 L132 124 L142 196 Z"/>
      <path class="fuego" d="M100 36 C 62 52, 18 84, 26 104 C 34 126, 68 146, 100 148 C 132 146, 166 126, 174 104 C 182 84, 138 52, 100 36 Z"/>
      <path class="fuego" d="M60 62 L52 36 L74 54 Z M140 62 L148 36 L126 54 Z M100 40 L96 16 L108 38 Z"/>
      <path class="fuego-claro" d="M100 52 C 70 64, 40 86, 46 102 C 52 120, 76 134, 100 136 C 124 134, 148 120, 154 102 C 160 86, 130 64, 100 52 Z"/>
      <g class="cejas"><path class="ceja izq" d="M50 80 Q76 64 96 72"/><path class="ceja der" d="M104 72 Q124 64 150 80"/></g>
      <path class="ojo-fuego" d="M40 98 Q100 60 160 98 Q100 136 40 98 Z"/>
      <ellipse class="iris-fuego" cx="100" cy="98" rx="22" ry="30"/>
      <g class="pupilas"><ellipse class="pupila" cx="100" cy="98" rx="5" ry="30"/></g>`,
  },
  {
    id: "musgo",
    premium: true,
    nombre: "Maestro Musgo",
    descripcion: "Pequeño maestro verde de orejas largas. Habla al revés, sabio es.",
    voz: { tono: 2, velocidad: 0.85, genero: "m" },
    efecto: "campanita",
    frases: {
      calma: "Concentrado estás. Bien, eso es. Mmm.",
      animo: ["Grande tu disciplina es.", "Aprendiendo mucho estás, joven estudiante. Sí, mmm."],
      inicioExamen: "Hazlo o no lo hagas, pero intentarlo no hay. Comienza el examen.",
      inicioEstudio: "Estudiar ahora debemos. Paciencia tener hay que.",
    },
    decorar: (texto, nivel) => (nivel >= 2 ? `${texto} Mmm.` : texto),
    mensajes: {
      ausente: { 1: ["¿A dónde fuiste? Regresar debes."], 2: ["Vacía tu silla está. Volver pronto debes."], 3: ["¡Abandonar el examen no puedes! Regresa ya."] },
      mirada: { 1: ["En tu hoja, tus ojos deben estar."], 2: ["Hacia otro lado mirabas. Concentrarte debes."], 3: ["¡La última advertencia, esta es! Tu hoja mira."] },
      movimiento: { 1: ["Quieto estar debes."], 2: ["Mucho te mueves. Calma encontrar debes."], 3: ["¡Moverte tanto no debes! Siéntate."] },
      pestana: { 1: ["De la página saliste. Volver debes."], 2: ["Cambiar de ventana, distracción es."], 3: ["¡En un examen real, anulado estarías!"] },
      otra_persona: { 1: ["Alguien más veo. Individual el examen es."], 2: ["Acompañado estás. Solo estudiar debes."], 3: ["¡Ayudarte nadie puede! Retirarse debe."] },
      ruido: { 1: ["Mucho ruido hay. Silencio buscar debes."], 2: ["Concentrarse así, difícil es."], 3: ["¡Demasiado ruido! Silencio, en un examen hay."] },
      conversacion: { 1: ["Una plática escucho. En lo tuyo concentrarte debes."], 2: ["Conversaciones, no durante la sesión."], 3: ["¡Silencio! Hablar en un examen no se puede."] },
    },    svg: `${HALO}
      <path class="tunica" d="M44 196 Q50 150 100 146 Q150 150 156 196 Z"/>
      <path class="tunica-clara" d="M84 196 L92 150 L108 150 L116 196 Z"/>
      <path class="piel-verde" d="M66 100 L8 78 Q16 100 30 110 Q48 118 68 120 Z"/>
      <path class="piel-verde" d="M134 100 L192 78 Q184 100 170 110 Q152 118 132 120 Z"/>
      <path class="oreja-interior" d="M60 104 L22 88 Q30 104 44 110 Z M140 104 L178 88 Q170 104 156 110 Z"/>
      <path class="piel-verde" d="M60 108 Q58 66 100 62 Q142 66 140 108 Q140 140 100 148 Q60 140 60 108 Z"/>
      <path class="pelo-blanco" d="M80 66 Q72 54 66 56 M100 62 Q100 50 106 48 M120 66 Q128 54 134 56"/>
      <path class="arrugas-verdes" d="M78 80 Q100 72 122 80 M82 88 Q100 82 118 88 M70 116 Q74 124 80 126 M130 116 Q126 124 120 126"/>
      <g class="cejas"><path class="ceja izq" d="M74 94 L94 98"/><path class="ceja der" d="M106 98 L126 94"/></g>
      <ellipse class="ojo-yoda" cx="84" cy="106" rx="11" ry="8"/><ellipse class="ojo-yoda" cx="116" cy="106" rx="11" ry="8"/>
      <g class="pupilas"><circle class="pupila" cx="84" cy="106" r="5"/><circle class="pupila" cx="116" cy="106" r="5"/></g>
      <path class="arrugas-verdes" d="M97 114 Q100 122 105 117"/>
      <path class="boca" d="M88 130 Q100 134 112 130"/>`,
  },
  {
    id: "exo",
    premium: true,
    nombre: "Exo-Guardián",
    descripcion: "Genio en armadura roja y dorada. Rápido, brillante y sarcástico.",
    voz: { tono: 1, velocidad: 1.25, genero: "m" },
    efecto: "repulsor",
    frases: {
      calma: "Sistemas al cien por ciento. Tú también, ¿verdad?",
      animo: ["Nada mal. Casi tan bueno como yo.", "Eso, genio. Sigue así."],
      inicioExamen: "Armadura en línea. Examen iniciado. Demuéstrales quién manda.",
      inicioEstudio: "Protocolo de estudio activado. Hagamos algo increíble.",
    },
    decorar: (texto, nivel) => (nivel === 2 ? "Oye, genio, enfoque. " : nivel === 3 ? "En serio, ¿otra vez? " : "") + texto,
    svg: `${HALO}
      <path class="rojo-armadura" d="M50 196 Q56 152 100 148 Q144 152 150 196 Z"/>
      <path class="dorado-armadura" d="M70 196 L76 160 Q100 166 124 160 L130 196 Z"/>
      <circle class="reactor" cx="100" cy="176" r="10"/>
      <path class="rojo-armadura" d="M54 112 Q50 40 100 34 Q150 40 146 112 L140 150 Q100 166 60 150 Z"/>
      <path class="dorado-armadura" d="M68 72 Q100 62 132 72 L130 124 L120 142 Q100 150 80 142 L70 124 Z"/>
      <path class="trazo-dorado" d="M100 64 V86 M76 112 L84 126 M124 112 L116 126"/>
      <g class="cejas"><path class="ceja izq" d="M72 88 L95 92"/><path class="ceja der" d="M105 92 L128 88"/></g>
      <g class="pupilas"><path class="pupila luz-blanca" d="M74 95 L95 97 L93 103 L76 101 Z"/><path class="pupila luz-blanca" d="M126 95 L105 97 L107 103 L124 101 Z"/></g>
      <path class="boca" d="M86 132 L114 132"/>`,
  },
];

export const VIGILANTE_POR_ID = Object.fromEntries(VIGILANTES.map((v) => [v.id, v]));
