import { describe, it, expect } from 'vitest';
import {
  armarContenidoPdf,
  textoPdfSeguro,
  fechaLegible,
  fechaArchivo,
  nombreArchivo,
  resumenRespuestas,
} from '../pdfContenido.js';
import { calcularHuella } from '../total.js';
import { crearEstadoInicial } from '../../estado/respuestas.js';
import { TEXTOS } from '../../textos/es-AR.js';
import { COLORES } from '../../estilos/colores.js';

const URL_APP = 'https://casabonnemariacen-dev.github.io/huella-mastai-2026/';
// 22/11/2026 01:30 UTC = 21/11/2026 22:30 en Argentina (UTC−3)
const FECHA = new Date('2026-11-22T01:30:00Z');

const completa = () => {
  const r = crearEstadoInicial();
  r.movilidad = {
    ...r.movilidad,
    origen: { texto: 'Junín 1200, Corrientes', lat: -27.46, lon: -58.83 },
    distanciaKm: 7.5,
    fuenteDistancia: 'ruta',
    ida: { medio: 'auto', ocupantes: 2 },
    idaYVuelta: false,
    vuelta: { medio: 'remis', ocupantes: 1 },
  };
  r.alimentacion = { comida: 'vacuna', bebidas: ['alcohol', 'botella'], vasosCerveza: 3 };
  r.residuos = 'fuera';
  r.compras = 'varias';
  return r;
};

const cero = () => {
  const r = crearEstadoInicial();
  r.movilidad.ida.medio = 'pie_bici';
  r.alimentacion = { comida: 'ninguna', bebidas: ['ninguna'], vasosCerveza: 1 };
  r.compras = 'nada';
  return r;
};

/** Todas las cadenas de un objeto. */
const cadenas = (o, acc = []) => {
  if (typeof o === 'string') acc.push(o);
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => cadenas(v, acc));
  return acc;
};

describe('nombre y fecha', () => {
  it('usa la fecha argentina en el nombre del archivo', () => {
    expect(fechaArchivo(FECHA)).toBe('2026-11-21');
    expect(nombreArchivo(FECHA, 'pdf')).toBe('huella-mastai-2026-11-21.pdf');
    expect(nombreArchivo(FECHA, 'csv')).toBe('huella-mastai-2026-11-21.csv');
  });

  it('fecha y hora legibles en es-AR', () => {
    expect(fechaLegible(FECHA)).toBe('21 de noviembre de 2026, 22:30 h');
  });
});

describe('textoPdfSeguro', () => {
  it('conserva español, la unidad y la puntuación habitual', () => {
    const t = '¿Cuánto? Ñandú – «hola» … kg CO₂e • 1.234,56';
    expect(textoPdfSeguro(t)).toBe(t);
  });

  it('quita lo que la fuente no puede dibujar', () => {
    expect(textoPdfSeguro('📍 Av. Ŝarmiento → 2650')).toBe('Av. Sarmiento 2650');
    expect(textoPdfSeguro(null)).toBe('');
  });
});

describe('resumenRespuestas', () => {
  it('incluye medio, ocupantes, origen, distancia, vuelta, comida, bebidas con vasos, residuos y compras', () => {
    const filas = Object.fromEntries(resumenRespuestas(completa()));
    const E = TEXTOS.pdf.respuestas;
    expect(filas[E.medio]).toBe('Auto');
    expect(filas[E.ocupantes]).toBe('2');
    expect(filas[E.origen]).toBe('Junín 1200, Corrientes');
    expect(filas[E.distancia]).toBe('7,5 km (calculada por calle)');
    expect(filas[E.idaYVuelta]).toBe('No');
    expect(filas[E.medioVuelta]).toBe('Remis / taxi');
    expect(filas[E.ocupantesVuelta]).toBeUndefined(); // el remis no divide
    expect(filas[E.comida]).toBe('Carne vacuna / roja');
    expect(filas[E.bebidas]).toBe('Bebidas alcohólicas (cerveza): 3 vasos; Gaseosa o agua embotellada');
    expect(filas[E.residuos]).toBe('Dejé residuos fuera de los tachos');
    expect(filas[E.compras]).toBe('Varias cosas');
  });

  it('sin auto ni moto no muestra ocupantes; respuestas vacías dicen "Sin respuesta"', () => {
    const filas = Object.fromEntries(resumenRespuestas(crearEstadoInicial()));
    expect(filas[TEXTOS.pdf.respuestas.ocupantes]).toBeUndefined();
    expect(filas[TEXTOS.pdf.respuestas.comida]).toBe(TEXTOS.pdf.sinRespuesta);
    expect(filas[TEXTOS.pdf.respuestas.idaYVuelta]).toBe('Sí');
  });
});

describe('armarContenidoPdf', () => {
  it('arma encabezado, total, nivel, equivalencias, desglose, recomendaciones y pie', () => {
    const r = completa();
    const h = calcularHuella(r);
    const c = armarContenidoPdf(r, h, FECHA, URL_APP);
    expect(c.nombreArchivo).toBe('huella-mastai-2026-11-21.pdf');
    expect(c.encabezado).toBe('IANES / UCP – Mastai – Fiesta de la Cerveza del NEA Argentino, Corrientes 2026');
    expect(c.fecha).toBe('Calculado el 21 de noviembre de 2026, 22:30 h');
    expect(c.total.valor).toMatch(/^\d+,\d{2} kg CO₂e$/);
    expect(c.nivel).toMatchObject({ id: 'alto', texto: 'Nivel: Alto' });
    expect(c.equivalencias).toHaveLength(2);
    expect(c.desglose.categorias.map((x) => x.id)).toEqual(['movilidad', 'alimentacion', 'residuos', 'compras']);
    expect(c.desglose.categorias.map((x) => x.color)).toEqual(Object.values(COLORES.categorias));
    expect(Math.max(...c.desglose.categorias.map((x) => x.relativo))).toBe(1);
    expect(c.recomendaciones.items[0]).toMatch(/^Si hubieras .*, tu huella habría sido \d+,\d{2} kg CO₂e menor\.$/);
    expect(c.pie[1]).toContain(URL_APP);
  });

  it('huella 0: sin equivalencias, barras vacías y mensaje sin recomendaciones', () => {
    const r = cero();
    const c = armarContenidoPdf(r, calcularHuella(r), FECHA, URL_APP);
    expect(c.total.valor).toBe('0,00 kg CO₂e');
    expect(c.equivalencias).toEqual([]);
    expect(c.desglose.categorias.every((x) => x.relativo === 0)).toBe(true);
    expect(c.recomendaciones.items).toEqual([TEXTOS.resultados.sinRecomendaciones]);
  });

  it('todos los textos se pueden dibujar con la fuente del PDF', () => {
    const r = completa();
    r.movilidad.origen.texto = '📍 Calle con emoji 🍺';
    const c = armarContenidoPdf(r, calcularHuella(r), FECHA, URL_APP);
    for (const t of cadenas(c)) expect(textoPdfSeguro(t), t).toBe(t);
  });
});
