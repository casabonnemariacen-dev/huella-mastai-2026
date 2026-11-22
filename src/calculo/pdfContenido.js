/**
 * Contenido del PDF de resultados (función pura, sin jsPDF).
 * El dibujo está en src/servicios/pdf.js.
 */
import { TEXTOS } from '../textos/es-AR.js';
import { EVENTO, LIMITES } from '../config/evento.js';
import { MEDIOS, buscar } from '../data/opciones.js';
import { COLORES } from '../estilos/colores.js';
import { barrasCategorias } from './grafico.js';
import { formatearKg, formatearEntero, formatearNumero, formatearDecimal } from './formato.js';

const T = TEXTOS.pdf;
const R = TEXTOS.resultados;
const O = TEXTOS.opciones;

// Caracteres que la fuente estándar del PDF (Helvetica, WinAnsi) puede dibujar.
// "₂" se permite porque el dibujo lo reemplaza por un "2" en subíndice.
const WIN_ANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ₂';

/** Reemplaza caracteres que la fuente del PDF no puede dibujar. */
export function textoPdfSeguro(texto) {
  return Array.from(String(texto ?? ''))
    .map((c) => {
      const n = c.codePointAt(0);
      if ((n >= 0x20 && n <= 0x7e) || (n >= 0xa0 && n <= 0xff) || WIN_ANSI_EXTRA.includes(c)) return c;
      if (c === '\n') return c;
      const sinTilde = c.normalize('NFD').replace(/[̀-ͯ]/g, '');
      return /^[\x20-\x7e]$/.test(sinTilde) ? sinTilde : '';
    })
    .join('')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Fecha y hora legibles en Argentina: "21 de noviembre de 2026, 21:40 h". */
export function fechaLegible(fecha) {
  const dia = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeZone: EVENTO.zonaHoraria }).format(fecha);
  const hora = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: EVENTO.zonaHoraria,
  }).format(fecha);
  return `${dia}, ${hora} h`;
}

/** AAAA-MM-DD en hora argentina. */
export function fechaArchivo(fecha) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: EVENTO.zonaHoraria,
  }).format(fecha);
}

export const nombreArchivo = (fecha, extension) => `${EVENTO.prefijoArchivos}-${fechaArchivo(fecha)}.${extension}`;

/** Resumen de respuestas como pares [etiqueta, valor]. */
export function resumenRespuestas(respuestas) {
  const m = respuestas.movilidad;
  const a = respuestas.alimentacion;
  const E = T.respuestas;
  const nombreMedio = (id) => O.medios[id] ?? T.sinRespuesta;
  const filas = [];

  filas.push([E.medio, nombreMedio(m.ida.medio)]);
  if (buscar(MEDIOS, m.ida.medio)?.divideOcupantes) filas.push([E.ocupantes, String(m.ida.ocupantes)]);
  if (m.origen?.texto) filas.push([E.origen, m.origen.texto]);
  filas.push([E.distancia, T.km(formatearDecimal(m.distanciaKm, 1), m.fuenteDistancia)]);
  filas.push([E.idaYVuelta, m.idaYVuelta ? T.si : T.no]);
  if (!m.idaYVuelta && m.vuelta?.medio) {
    filas.push([E.medioVuelta, nombreMedio(m.vuelta.medio)]);
    if (buscar(MEDIOS, m.vuelta.medio)?.divideOcupantes) filas.push([E.ocupantesVuelta, String(m.vuelta.ocupantes)]);
  }

  filas.push([E.comida, O.comidas[a.comida] ?? T.sinRespuesta]);
  const bebidas = a.bebidas.map((b) =>
    b === 'alcohol' ? `${O.bebidas[b]}: ${T.vasos(a.vasosCerveza, LIMITES.vasosMax)}` : O.bebidas[b],
  );
  filas.push([E.bebidas, bebidas.length ? bebidas.join('; ') : T.sinRespuesta]);
  filas.push([E.residuos, O.residuos[respuestas.residuos] ?? T.sinRespuesta]);
  filas.push([E.compras, O.compras[respuestas.compras] ?? T.sinRespuesta]);

  return filas.map(([e, v]) => [textoPdfSeguro(e), textoPdfSeguro(v)]);
}

/**
 * Todo lo que va en el PDF, ya formateado (es-AR) y con textos seguros.
 * @param {object} respuestas  estado de respuestas
 * @param {object} huella      resultado de calcularHuella
 * @param {Date}   fecha       momento del cálculo
 * @param {string} urlApp      dirección pública de la app
 */
export function armarContenidoPdf(respuestas, huella, fecha, urlApp) {
  const nivel = R.niveles[huella.nivel];
  const equivalencias =
    huella.total > 0
      ? [
          R.equivalenciaCelular(formatearEntero(huella.equivalencias.cargasCelular)),
          R.equivalenciaAuto(formatearNumero(huella.equivalencias.kmAuto)),
        ]
      : [];

  return {
    nombreArchivo: nombreArchivo(fecha, 'pdf'),
    encabezado: textoPdfSeguro(T.encabezado),
    titulo: textoPdfSeguro(T.titulo),
    fecha: textoPdfSeguro(T.fecha(fechaLegible(fecha))),
    total: {
      etiqueta: textoPdfSeguro(T.total),
      valor: textoPdfSeguro(formatearKg(huella.total)),
    },
    nivel: {
      id: huella.nivel,
      texto: textoPdfSeguro(T.nivel(nivel.nombre)),
      descripcion: textoPdfSeguro(nivel.descripcion),
    },
    equivalencias: equivalencias.map(textoPdfSeguro),
    desglose: {
      titulo: textoPdfSeguro(T.desgloseTitulo),
      categorias: barrasCategorias(huella.porCategoria).map((b) => ({
        id: b.id,
        nombre: textoPdfSeguro(R.categorias[b.id]),
        valor: textoPdfSeguro(formatearKg(b.valor)),
        relativo: b.relativo,
        color: COLORES.categorias[b.id],
      })),
    },
    respuestas: { titulo: textoPdfSeguro(T.respuestasTitulo), filas: resumenRespuestas(respuestas) },
    recomendaciones: {
      titulo: textoPdfSeguro(T.recomendacionesTitulo),
      items: (huella.recomendaciones.length
        ? huella.recomendaciones.map((r) => TEXTOS.recomendaciones[r.id](formatearKg(r.ahorroKg)))
        : [R.sinRecomendaciones]
      ).map(textoPdfSeguro),
    },
    pie: [T.pieAviso, T.pieMetodologia(urlApp)].map(textoPdfSeguro),
    colores: COLORES,
  };
}
