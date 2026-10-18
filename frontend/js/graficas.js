// Gráficas de columnas simples (SVG), sin librerías externas.
// Una sola serie por gráfica, con el azul del logo; el valor se ve al pasar el dedo o el ratón.

const SVG = "http://www.w3.org/2000/svg";
const nodo = (tipo, attrs = {}) => {
  const el = document.createElementNS(SVG, tipo);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

/** Redondea el máximo del eje a un número "limpio" (10, 20, 50, 100...). */
function maximoLimpio(valor) {
  if (valor <= 0) return 10;
  const paso = 10 ** Math.floor(Math.log10(valor));
  return [1, 2, 2.5, 5, 10].map((m) => m * paso).find((m) => m >= valor);
}

/** Columna con esquinas redondeadas arriba y base recta. */
function columna(x, y, ancho, alto) {
  const r = Math.min(4, ancho / 2, alto);
  return `M${x},${y + alto} V${y + r} Q${x},${y} ${x + r},${y} H${x + ancho - r} Q${x + ancho},${y} ${x + ancho},${y + r} V${y + alto} Z`;
}

/**
 * Dibuja una gráfica de columnas dentro de un <figure>.
 * datos: [{ etiqueta, valor, detalle }] · opciones: { titulo, formato(v), maximo }
 */
export function graficaColumnas(figura, datos, { titulo, formato = String, maximo } = {}) {
  const W = 360, H = 190, izq = 36, der = 8, arriba = 22, abajo = 26;
  const anchoPlot = W - izq - der, altoPlot = H - arriba - abajo;
  const tope = maximo ?? maximoLimpio(Math.max(...datos.map((d) => d.valor)));
  const banda = anchoPlot / datos.length;
  const anchoCol = Math.min(24, banda * 0.6);
  const yDe = (v) => arriba + altoPlot - (v / tope) * altoPlot;

  const svg = nodo("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": titulo });
  // Líneas guía (3) y sus valores
  for (const f of [0, 0.5, 1]) {
    const y = yDe(tope * f);
    svg.append(nodo("line", { x1: izq, x2: W - der, y1: y, y2: y, class: f === 0 ? "eje" : "guia" }));
    const t = nodo("text", { x: izq - 6, y: y + 4, class: "texto-eje", "text-anchor": "end" });
    t.textContent = formato(Math.round(tope * f));
    svg.append(t);
  }

  const globo = document.createElement("div");
  globo.className = "globo-grafica";
  globo.hidden = true;

  datos.forEach((d, i) => {
    const xCentro = izq + banda * i + banda / 2;
    const alto = Math.max(0, yDe(0) - yDe(d.valor));
    const grupo = nodo("g", { class: "barra-grafica", tabindex: 0 });
    // Zona sensible más grande que la columna: toda la franja
    grupo.append(nodo("rect", { x: izq + banda * i, y: arriba, width: banda, height: altoPlot, class: "zona" }));
    if (alto > 0) grupo.append(nodo("path", { d: columna(xCentro - anchoCol / 2, yDe(d.valor), anchoCol, alto), class: "columna" }));
    const etiqueta = nodo("text", { x: xCentro, y: H - 8, class: "texto-eje", "text-anchor": "middle" });
    etiqueta.textContent = d.etiqueta;
    grupo.append(etiqueta);
    // Solo la última semana lleva su valor escrito (las demás, al pasar el dedo)
    if (i === datos.length - 1 && d.valor > 0) {
      const v = nodo("text", { x: xCentro, y: yDe(d.valor) - 6, class: "texto-valor", "text-anchor": "middle" });
      v.textContent = formato(d.valor);
      grupo.append(v);
    }
    const mostrarGlobo = () => {
      globo.textContent = `${d.detalle}: ${formato(d.valor)}`;
      globo.hidden = false;
      globo.style.left = `${(xCentro / W) * 100}%`;
      globo.style.top = `${(yDe(d.valor) / H) * 100}%`;
      grupo.classList.add("activa");
    };
    const ocultar = () => { globo.hidden = true; grupo.classList.remove("activa"); };
    grupo.addEventListener("pointerenter", mostrarGlobo);
    grupo.addEventListener("pointerleave", ocultar);
    grupo.addEventListener("focus", mostrarGlobo);
    grupo.addEventListener("blur", ocultar);
    svg.append(grupo);
  });

  const caption = document.createElement("figcaption");
  caption.textContent = titulo;
  const lienzo = document.createElement("div");
  lienzo.className = "lienzo-grafica";
  lienzo.append(svg, globo);
  figura.replaceChildren(caption, lienzo);
}
