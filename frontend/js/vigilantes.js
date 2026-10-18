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
  // ===================== PREMIUM (de pago en el futuro; hoy gratis) =====================
  {
    id: "penumbra",
    premium: true,
    nombre: "Lord Penumbra",
    descripcion: "Caballero de la penumbra. Respira… y te vigila.",
    voz: { tono: 0.3, velocidad: 0.8, genero: "m" },
    efecto: "respiracion",
    frases: {
      calma: "Siento tu concentración. Bien… muy bien.",
      animo: ["Tu poder de estudio crece.", "Impresionante. Muy impresionante."],
      inicioExamen: "El examen ha comenzado. No me decepciones.",
      inicioEstudio: "Comienza tu entrenamiento. El lado oscuro de la distracción te acecha.",
    },
    decorar: (texto, nivel) =>
      (nivel === 2 ? "Tu falta de concentración me perturba. " : nivel === 3 ? "No subestimes el poder del estudio. " : "") + texto,
    svg: `${HALO}
      <path class="capa-violeta" d="M40 190 Q44 128 70 112 L130 112 Q156 128 160 190 Z"/>
      <path class="negro" d="M58 120 Q54 46 100 40 Q146 46 142 120 Q140 152 100 158 Q60 152 58 120 Z"/>
      <path class="trazo-violeta" d="M100 42 V86"/>
      <rect class="visor-violeta" x="64" y="88" width="72" height="22" rx="11"/>
      <g class="cejas"><path class="ceja izq" d="M68 82 L96 86"/><path class="ceja der" d="M104 86 L132 82"/></g>
      <g class="pupilas"><ellipse class="pupila violeta" cx="84" cy="99" rx="9" ry="4"/><ellipse class="pupila violeta" cx="116" cy="99" rx="9" ry="4"/></g>
      <path class="boca" d="M88 124 L112 124"/>
      <circle class="gris-oscuro" cx="100" cy="138" r="10"/>
      <path class="rejilla" d="M93 135 H107 M93 141 H107"/>`,
  },
  {
    id: "tirano",
    premium: true,
    nombre: "El Tirano de Hierro",
    descripcion: "Monarca de máscara de bronce. Ordena, no pide.",
    voz: { tono: 0.45, velocidad: 0.85, genero: "m" },
    efecto: "metal",
    frases: {
      calma: "El Tirano observa. Continúa con tu deber.",
      animo: ["El Tirano aprueba tu disciplina.", "Así se estudia en mi reino."],
      inicioExamen: "¡Por orden del Tirano, el examen comienza!",
      inicioEstudio: "El Tirano decreta: hora de estudiar.",
    },
    decorar: (texto, nivel) =>
      (nivel === 2 ? "El Tirano ordena: " : nivel === 3 ? "¡El Tirano no tolera la insolencia! " : "") + texto,
    svg: `${HALO}
      <path class="capa-granate" d="M40 150 Q36 54 100 42 Q164 54 160 150 L142 188 L58 188 Z"/>
      <path class="granate-oscuro" d="M58 188 L70 150 Q100 162 130 150 L142 188 Z"/>
      <path class="bronce" d="M64 66 Q100 56 136 66 L132 140 Q100 156 68 140 Z"/>
      <path class="dorado" d="M72 64 L78 44 L90 58 L100 38 L110 58 L122 44 L128 64 Q100 56 72 64 Z"/>
      <circle class="rubi" cx="100" cy="52" r="3.5"/>
      <g class="cejas"><path class="ceja izq" d="M70 88 L94 94"/><path class="ceja der" d="M106 94 L130 88"/></g>
      <g class="pupilas"><rect class="pupila" x="74" y="98" width="20" height="7" rx="3"/><rect class="pupila" x="106" y="98" width="20" height="7" rx="3"/></g>
      <path class="boca" d="M86 128 Q100 134 114 128"/>`,
  },
  {
    id: "ares",
    premium: true,
    nombre: "Ares, el Espartano",
    descripcion: "Soldado espartano. Pocas palabras, mucha disciplina.",
    voz: { tono: 0.5, velocidad: 0.95, genero: "m" },
    efecto: "tambor",
    frases: {
      calma: "Bien. Sigue luchando.",
      animo: ["Fuerte. Como un verdadero guerrero.", "La batalla se gana así."],
      inicioExamen: "¡A la batalla! El examen comienza.",
      inicioEstudio: "Hoy entrenamos. Sin descanso.",
    },
    decorar: (texto, nivel) => (nivel >= 2 ? "¡Guerrero! " : "") + texto,
    svg: `${HALO}
      <path class="capa-roja" d="M50 190 Q56 150 100 148 Q144 150 150 190 Z"/>
      <path class="cresta" d="M58 70 Q100 2 142 70 Q122 42 100 42 Q78 42 58 70 Z"/>
      <path class="bronce" d="M56 128 Q52 54 100 48 Q148 54 144 128 L132 152 L68 152 Z"/>
      <path class="piel" d="M70 90 H130 V112 H108 V150 H92 V112 H70 Z"/>
      <g class="cejas"><path class="ceja gruesa izq" d="M72 94 L94 98"/><path class="ceja gruesa der" d="M106 98 L128 94"/></g>
      <g class="pupilas"><circle class="pupila ambar" cx="84" cy="104" r="4.5"/><circle class="pupila ambar" cx="116" cy="104" r="4.5"/></g>
      <path class="barba" d="M92 132 Q92 150 100 154 Q108 150 108 132 Q104 138 100 138 Q96 138 92 132 Z"/>
      <path class="boca" d="M95 127 L105 127"/>`,
  },
  {
    id: "buho",
    premium: true,
    nombre: "El Búho Nocturno",
    descripcion: "Vigilante enmascarado de la noche. Lo ve todo en la oscuridad.",
    voz: { tono: 0.6, velocidad: 0.85, genero: "m" },
    efecto: "ulular",
    frases: {
      calma: "Desde las sombras, te observo.",
      animo: ["La noche premia a quien no se distrae.", "Bien hecho. La ciudad está a salvo."],
      inicioExamen: "Es de noche en la ciudad del examen. Empieza.",
      inicioEstudio: "Cae la noche. Hora de estudiar en silencio.",
    },
    decorar: (texto, nivel) => (nivel === 1 ? `${texto}..` : nivel === 2 ? `Te estoy vigilando. ${texto}` : `Nadie escapa del Búho. ${texto}`),
    svg: `${HALO}
      <path class="capucha-noche" d="M38 190 Q40 122 60 94 L50 38 L82 70 Q100 62 118 70 L150 38 L140 94 Q160 122 162 190 Z"/>
      <path class="piel" d="M70 116 Q72 154 100 160 Q128 154 130 116 Q100 128 70 116 Z"/>
      <g class="cejas"><path class="ceja izq" d="M60 76 L94 88"/><path class="ceja der" d="M106 88 L140 76"/></g>
      <circle class="ojo-buho" cx="80" cy="98" r="16"/><circle class="ojo-buho" cx="120" cy="98" r="16"/>
      <g class="pupilas"><circle class="pupila" cx="80" cy="98" r="7"/><circle class="pupila" cx="120" cy="98" r="7"/></g>
      <path class="pico" d="M95 110 L105 110 L100 121 Z"/>
      <path class="boca" d="M88 140 Q100 136 112 140"/>`,
  },
  {
    id: "ojo",
    premium: true,
    nombre: "El Ojo Ardiente",
    descripcion: "Un ojo de fuego que todo lo ve. Nada escapa a su mirada.",
    voz: { tono: 0.2, velocidad: 0.75, genero: null },
    efecto: "fuego",
    frases: {
      calma: "El Ojo todo lo ve. Sigue así.",
      animo: ["El fuego de tu concentración arde fuerte.", "Ni una distracción. El Ojo está complacido."],
      inicioExamen: "El Ojo se abre. Que comience el examen.",
      inicioEstudio: "El Ojo despierta. Estudia… te estoy mirando.",
    },
    decorar: (texto, nivel) => (nivel >= 2 ? "Nada escapa a mi mirada. " : "") + texto,
    svg: `${HALO}
      <path class="fuego" d="M100 18 C 68 58, 38 80, 44 122 C 48 162, 80 182, 100 182 C 120 182, 152 162, 156 122 C 162 80, 132 58, 100 18 Z"/>
      <path class="fuego-claro" d="M100 46 C 80 74, 62 90, 66 120 C 70 150, 88 164, 100 164 C 112 164, 130 150, 134 120 C 138 90, 120 74, 100 46 Z"/>
      <g class="cejas"><path class="ceja izq" d="M54 78 Q76 64 96 74"/><path class="ceja der" d="M104 74 Q124 64 146 78"/></g>
      <path class="ojo-fuego" d="M44 106 Q100 56 156 106 Q100 156 44 106 Z"/>
      <g class="pupilas"><circle class="iris-fuego" cx="100" cy="106" r="20"/><circle class="pupila" cx="100" cy="106" r="10"/><circle class="blanco" cx="105" cy="101" r="3"/></g>`,
  },
  {
    id: "musgo",
    premium: true,
    nombre: "Maestro Musgo",
    descripcion: "Pequeño sabio anciano. Habla al revés, sabio es.",
    voz: { tono: 1.7, velocidad: 0.8, genero: "m" },
    efecto: "campanita",
    frases: {
      calma: "Concentrado estás. Bien, eso es.",
      animo: ["Grande tu disciplina es.", "Aprendiendo mucho estás, joven estudiante."],
      inicioExamen: "Comenzar el examen debes. Confía en lo que estudiaste.",
      inicioEstudio: "Estudiar ahora debemos. Paciencia tener hay que.",
    },
    decorar: (texto) => texto,
    // Sus propias frases, con el orden de las palabras al revés
    mensajes: {
      ausente: { 1: ["¿A dónde fuiste? Regresar debes."], 2: ["Vacía tu silla está. Volver pronto debes."], 3: ["¡Abandonar el examen no puedes! Regresa ya."] },
      mirada: { 1: ["En tu hoja, tus ojos deben estar."], 2: ["Hacia otro lado mirabas. Concentrarte debes."], 3: ["¡La última advertencia, esta es! Tu hoja mira."] },
      movimiento: { 1: ["Quieto estar debes."], 2: ["Mucho te mueves. Calma encontrar debes."], 3: ["¡Moverte tanto no debes! Siéntate."] },
      pestana: { 1: ["De la página saliste. Volver debes."], 2: ["Cambiar de ventana, distracción es."], 3: ["¡En un examen real, anulado estarías!"] },
      otra_persona: { 1: ["Alguien más veo. Individual el examen es."], 2: ["Acompañado estás. Solo estudiar debes."], 3: ["¡Ayudarte nadie puede! Retirarse debe."] },
      ruido: { 1: ["Mucho ruido hay. Silencio buscar debes."], 2: ["Concentrarse así, difícil es."], 3: ["¡Demasiado ruido! Silencio, en un examen hay."] },
      conversacion: { 1: ["Una plática escucho. En lo tuyo concentrarte debes."], 2: ["Conversaciones, no durante la sesión."], 3: ["¡Silencio! Hablar en un examen no se puede."] },
    },
    svg: `${HALO}
      <path class="baston" d="M160 66 L160 188"/><circle class="musgo" cx="160" cy="64" r="7"/>
      <path class="musgo" d="M42 142 Q40 58 100 48 Q160 58 158 142 L150 190 L50 190 Z"/>
      <circle class="piel-anciano" cx="100" cy="110" r="40"/>
      <path class="arrugas" d="M76 96 Q86 92 94 96 M106 96 Q114 92 124 96 M84 124 Q88 128 92 124 M108 124 Q112 128 116 124"/>
      <g class="cejas"><path class="ceja gruesa izq" d="M72 100 L94 104"/><path class="ceja gruesa der" d="M106 104 L128 100"/></g>
      <g class="pupilas"><circle class="pupila" cx="86" cy="112" r="4"/><circle class="pupila" cx="114" cy="112" r="4"/></g>
      <path class="barba-blanca" d="M70 122 Q72 176 100 184 Q128 176 130 122 Q114 140 100 140 Q86 140 70 122 Z"/>
      <path class="boca" d="M92 134 Q100 138 108 134"/>`,
  },
  {
    id: "exo",
    premium: true,
    nombre: "Exo-Guardián",
    descripcion: "Armadura futurista con sensores. Rápido, preciso y seguro.",
    voz: { tono: 1.1, velocidad: 1.15, genero: "m" },
    efecto: "pitido",
    frases: {
      calma: "Sensores en verde. Todo bajo control.",
      animo: ["Rendimiento al cien por ciento.", "Sistemas de concentración: óptimos."],
      inicioExamen: "Armadura en línea. Examen iniciado.",
      inicioEstudio: "Protocolo de estudio activado. Vamos.",
    },
    decorar: (texto, nivel) => (nivel === 3 ? "Alerta de sistema: " : nivel === 2 ? "Escaneo completo: " : "") + texto,
    svg: `${HALO}
      <path class="plata" d="M52 190 Q58 152 100 150 Q142 152 148 190 Z"/>
      <path class="hexagono" d="M100 162 L110 168 L110 180 L100 186 L90 180 L90 168 Z"/>
      <rect class="plata" x="44" y="84" width="10" height="30" rx="4"/><rect class="plata" x="146" y="84" width="10" height="30" rx="4"/>
      <path class="plata" d="M54 120 Q50 48 100 40 Q150 48 146 120 L136 154 Q100 168 64 154 Z"/>
      <path class="trazo-azul" d="M100 44 V82"/>
      <rect class="visor" x="62" y="88" width="76" height="26" rx="13"/>
      <g class="cejas"><path class="ceja izq" d="M66 82 L94 88"/><path class="ceja der" d="M106 88 L134 82"/></g>
      <g class="pupilas"><rect class="pupila luz" x="72" y="96" width="20" height="9" rx="4"/><rect class="pupila luz" x="108" y="96" width="20" height="9" rx="4"/></g>
      <path class="boca" d="M84 136 L116 136"/>`,
  },
];

export const VIGILANTE_POR_ID = Object.fromEntries(VIGILANTES.map((v) => [v.id, v]));
