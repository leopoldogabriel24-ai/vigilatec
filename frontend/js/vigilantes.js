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
];

export const VIGILANTE_POR_ID = Object.fromEntries(VIGILANTES.map((v) => [v.id, v]));
