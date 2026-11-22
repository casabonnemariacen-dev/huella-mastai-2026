/**
 * Dibujo y descarga del PDF de resultados (una página A4).
 * jsPDF se importa de forma diferida: solo se descarga al tocar "Descargar PDF".
 * El contenido sale de armarContenidoPdf (src/calculo/pdfContenido.js).
 */

const PAGINA = { ancho: 210, alto: 297 };
const M = 15; // margen (mm)
const ANCHO = PAGINA.ancho - 2 * M;
const LIMITE_CONTENIDO = 268; // debajo va el pie

// ── Texto con "CO₂" ─────────────────────────────────────────────────────────
// La fuente estándar (Helvetica, WinAnsi) no tiene "₂". Las líneas con "CO₂"
// se escriben como UN solo bloque de texto PDF y el "2" usa el operador de
// subíndice (Ts): así el visor avanza el texto con sus propias medidas y no se
// encima ni se separa, sea cual sea el visor (Chrome, iPhone, Acrobat…).
const SUB = 'CO2';
const paraMedir = (t) => t.replaceAll('₂', '2');

// Caracteres de WinAnsi fuera de Latin-1 → byte del PDF.
const WIN_ANSI = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89,
  'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95,
  '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

/** Cadena literal de PDF: bytes WinAnsi con ( ) \ escapados. */
export function cadenaPdf(texto) {
  const bytes = Array.from(texto, (c) => {
    const n = c.codePointAt(0);
    return String.fromCharCode(n <= 0xff ? n : (WIN_ANSI[c] ?? 0x3f));
  }).join('');
  return `(${bytes.replace(/[\\()]/g, '\\$&')})`;
}

const num = (n) => Number(n.toFixed(3)).toString();

function colorRelleno(hex) {
  const h = String(hex).replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return `${num(r)} ${num(g)} ${num(b)} rg`;
}

function lineaConSubindice(doc, texto, x, y) {
  const k = doc.internal.scaleFactor;
  const alto = doc.internal.pageSize.getHeight();
  const tam = doc.getFontSize();
  const fuenteId = doc.internal.getFont().id;
  const normal = `/${fuenteId} ${num(tam)} Tf 0 Ts`;
  const sub = `/${fuenteId} ${num(tam * 0.7)} Tf ${num(-tam * 0.22)} Ts`;
  const ops = [];
  texto.split(SUB).forEach((parte, i) => {
    if (i > 0) ops.push(`${cadenaPdf('CO')} Tj ${sub} (2) Tj ${normal}`);
    if (parte) ops.push(`${cadenaPdf(parte)} Tj`);
  });
  doc.internal.write(
    `BT ${colorRelleno(doc.getTextColor())} ${normal} ${num(x * k)} ${num((alto - y) * k)} Td ${ops.join(' ')} ET`,
  );
}

function linea(doc, texto, x, y, alineacion = 'left') {
  const t = paraMedir(texto);
  if (!t.includes(SUB)) {
    doc.text(t, x, y, { align: alineacion });
    return;
  }
  // Para alinear a la derecha o al centro alcanza una medida aproximada
  // (solo se usa en textos cortos, como los valores de las barras).
  const ancho = doc.getTextWidth(t);
  const x0 = alineacion === 'right' ? x - ancho : alineacion === 'center' ? x - ancho / 2 : x;
  lineaConSubindice(doc, t, x0, y);
}

/** Párrafo con ajuste de línea. Devuelve la y siguiente. */
function parrafo(doc, texto, x, y, ancho, interlineado) {
  const lineas = doc.splitTextToSize(paraMedir(texto), ancho);
  lineas.forEach((l, i) => linea(doc, l, x, y + i * interlineado));
  return y + lineas.length * interlineado;
}

const lineasDe = (doc, texto, ancho) => doc.splitTextToSize(paraMedir(texto), ancho).length;

function fuente(doc, tam, estilo = 'normal', color = '#000000') {
  doc.setFont('helvetica', estilo);
  doc.setFontSize(tam);
  doc.setTextColor(color);
}

function titulo(doc, texto, y, c) {
  fuente(doc, 12, 'bold', c.acento);
  linea(doc, texto, M, y);
  doc.setDrawColor(c.borde);
  doc.setLineWidth(0.3);
  doc.line(M, y + 2, M + ANCHO, y + 2);
  return y + 8;
}

/** Dibuja el contenido en un documento jsPDF nuevo y lo devuelve. */
export function dibujarPdf(jsPDF, contenido, logo) {
  const c = contenido.colores;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.setProperties({ title: contenido.titulo, subject: contenido.encabezado, creator: 'IANES / UCP' });

  // Encabezado
  doc.setFillColor(c.acento);
  doc.rect(0, 0, PAGINA.ancho, 30, 'F');
  const xTexto = logo ? M + 25 : M;
  if (logo) {
    doc.setFillColor('#ffffff');
    doc.roundedRect(M, 5, 20, 20, 2.5, 2.5, 'F');
    doc.addImage(logo, 'PNG', M + 2, 7, 16, 16, 'logo', 'FAST');
  }
  fuente(doc, 9, 'bold', '#ffffff');
  const yTitulo = parrafo(doc, contenido.encabezado, xTexto, 11, PAGINA.ancho - M - xTexto, 4) + 3;
  fuente(doc, 16, 'bold', '#ffffff');
  linea(doc, contenido.titulo, xTexto, Math.min(yTitulo + 2, 25));

  // Fecha
  fuente(doc, 9, 'normal', c.textoSuave);
  linea(doc, contenido.fecha, M, 38);

  // Total, nivel y equivalencias
  let y = 42;
  fuente(doc, 9, 'normal');
  const lineasEq = contenido.equivalencias.reduce((s, e) => s + lineasDe(doc, `• ${e}`, ANCHO - 10), 0);
  const lineasNivel = lineasDe(doc, contenido.nivel.descripcion, 72);
  const altoCaja = Math.max(30, 14 + lineasNivel * 4.2) + (lineasEq ? lineasEq * 4.4 + 3 : 0);
  doc.setFillColor(c.acentoClaro);
  doc.roundedRect(M, y, ANCHO, altoCaja, 3, 3, 'F');

  fuente(doc, 10, 'normal', c.textoSuave);
  linea(doc, contenido.total.etiqueta, M + 5, y + 8);
  fuente(doc, 26, 'bold', c.acento);
  linea(doc, contenido.total.valor, M + 5, y + 21);

  const colorNivel = { bajo: c.acento, medio: c.avisoBorde, alto: c.error }[contenido.nivel.id] ?? c.texto;
  doc.setFillColor(colorNivel);
  doc.rect(M + 100, y + 4, 1.2, Math.max(22, 6 + lineasNivel * 4.2), 'F');
  fuente(doc, 11, 'bold', colorNivel);
  linea(doc, contenido.nivel.texto, M + 104, y + 9);
  fuente(doc, 9, 'normal', c.texto);
  parrafo(doc, contenido.nivel.descripcion, M + 104, y + 14, 72, 4.2);

  let yEq = y + Math.max(30, 14 + lineasNivel * 4.2);
  fuente(doc, 9, 'normal', c.texto);
  for (const e of contenido.equivalencias) yEq = parrafo(doc, `• ${e}`, M + 5, yEq, ANCHO - 10, 4.4);
  y += altoCaja + 9;

  // Desglose con barras
  y = titulo(doc, contenido.desglose.titulo, y, c);
  const xBarra = M + 42;
  const anchoBarra = ANCHO - 42 - 32;
  for (const cat of contenido.desglose.categorias) {
    fuente(doc, 10, 'normal', c.texto);
    linea(doc, cat.nombre, M, y + 3.6);
    doc.setFillColor('#f1f4f1');
    doc.roundedRect(xBarra, y, anchoBarra, 5, 1, 1, 'F');
    if (cat.relativo > 0) {
      doc.setFillColor(cat.color);
      doc.roundedRect(xBarra, y, Math.max(anchoBarra * cat.relativo, 1.5), 5, 1, 1, 'F');
    }
    fuente(doc, 10, 'bold', c.texto);
    linea(doc, cat.valor, M + ANCHO, y + 3.6, 'right');
    y += 8;
  }
  y += 4;

  // Respuestas
  y = titulo(doc, contenido.respuestas.titulo, y, c);
  const xValor = M + 48;
  for (const [etiqueta, valor] of contenido.respuestas.filas) {
    fuente(doc, 9, 'bold', c.textoSuave);
    linea(doc, etiqueta, M, y);
    fuente(doc, 9, 'normal', c.texto);
    y = parrafo(doc, valor, xValor, y, ANCHO - 48, 4.1) + 1;
  }
  y += 4;

  // Recomendaciones (sin pasar al pie: si no entran, se corta con "…")
  y = titulo(doc, contenido.recomendaciones.titulo, y, c);
  fuente(doc, 9.5, 'normal', c.texto);
  for (const r of contenido.recomendaciones.items) {
    const alto = lineasDe(doc, r, ANCHO - 6) * 4.4;
    if (y + alto > LIMITE_CONTENIDO) {
      linea(doc, '…', M + 6, y);
      break;
    }
    linea(doc, '•', M + 1, y);
    y = parrafo(doc, r, M + 6, y, ANCHO - 6, 4.4) + 1.2;
  }

  // Pie
  doc.setDrawColor(c.borde);
  doc.setLineWidth(0.3);
  doc.line(M, 274, M + ANCHO, 274);
  fuente(doc, 8, 'normal', c.textoSuave);
  let yPie = 279;
  for (const p of contenido.pie) yPie = parrafo(doc, p, M, yPie, ANCHO, 3.6) + 0.6;

  return doc;
}

/** Logo como data URL (o null si no se puede cargar: el PDF sale igual). */
async function cargarLogo() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}ucp.png`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((ok, mal) => {
      const lector = new FileReader();
      lector.onload = () => ok(lector.result);
      lector.onerror = mal;
      lector.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Genera y descarga el PDF. Carga jsPDF y el logo solo en este momento. */
export async function descargarPdf(contenido) {
  const [{ jsPDF }, logo] = await Promise.all([import('jspdf'), cargarLogo()]);
  const doc = dibujarPdf(jsPDF, contenido, logo);
  // save() descarga en Android y abre la vista previa con opción de guardar en iPhone.
  doc.save(contenido.nombreArchivo);
}
