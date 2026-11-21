import { describe, it, expect } from 'vitest';
import { FACTORES } from '../../data/factores.js';
import { calcularHuella, nivelDe } from '../total.js';
import { calcularEquivalencias, kgPorCargaCelular } from '../equivalencias.js';
import { calcularRecomendaciones } from '../recomendaciones.js';
import { segmentosAnillo, barrasCategorias } from '../grafico.js';
import { formatearKg, formatearNumero } from '../formato.js';
import { crearEstadoInicial } from '../../estado/respuestas.js';

const respuestas = (cambios = {}) => {
  const r = crearEstadoInicial();
  r.movilidad = { ...r.movilidad, distanciaKm: 10, ida: { medio: 'auto', ocupantes: 1 } };
  r.alimentacion = { comida: 'vacuna', bebidas: ['alcohol', 'botella'], vasosCerveza: 2 };
  r.residuos = 'mismo_tacho';
  r.compras = 'prenda';
  return { ...r, ...cambios };
};

const visitaCero = () => {
  const r = crearEstadoInicial();
  r.movilidad.ida.medio = 'pie_bici';
  r.alimentacion = { comida: 'ninguna', bebidas: ['ninguna'], vasosCerveza: 1 };
  r.compras = 'nada';
  return r; // residuos sin responder → 0
};

describe('calcularHuella', () => {
  it('el total es la suma de las categorías', () => {
    const h = calcularHuella(respuestas());
    const suma = Object.values(h.porCategoria).reduce((a, b) => a + b, 0);
    expect(h.total).toBeCloseTo(suma, 6);
    expect(h.total).toBeGreaterThan(0);
  });

  it('visita sin emisiones da total 0, nivel bajo y sin recomendaciones', () => {
    const h = calcularHuella(visitaCero());
    expect(h.total).toBe(0);
    expect(h.nivel).toBe('bajo');
    expect(h.recomendaciones).toEqual([]);
  });

  it('el aviso de basura pasa al resultado', () => {
    expect(calcularHuella(respuestas({ residuos: 'fuera' })).avisoBasura).toBe(true);
  });
});

describe('niveles', () => {
  it('usa los umbrales de la configuración', () => {
    expect(nivelDe(0)).toBe('bajo');
    expect(nivelDe(2.99)).toBe('bajo');
    expect(nivelDe(3)).toBe('medio');
    expect(nivelDe(9.99)).toBe('medio');
    expect(nivelDe(10)).toBe('alto');
    expect(nivelDe(1e6)).toBe('alto');
  });
});

describe('equivalencias', () => {
  it('cargas de celular y km en auto', () => {
    const e = calcularEquivalencias(1);
    expect(e.cargasCelular).toBeCloseTo(1 / (FACTORES.cargaCelular.valor * FACTORES.redElectricaAR.valor), 6);
    expect(e.kmAuto).toBeCloseTo(1000 / FACTORES.auto.valor, 6);
    expect(kgPorCargaCelular()).toBeGreaterThan(0);
  });

  it('total 0 o inválido da 0', () => {
    expect(calcularEquivalencias(0)).toEqual({ cargasCelular: 0, kmAuto: 0 });
    expect(calcularEquivalencias(NaN)).toEqual({ cargasCelular: 0, kmAuto: 0 });
  });
});

describe('recomendaciones', () => {
  it('sugiere colectivo con el ahorro exacto', () => {
    const r = respuestas();
    const rec = calcularRecomendaciones(r).find((x) => x.id === 'colectivo');
    const esperado = (20 * (FACTORES.auto.valor - FACTORES.colectivo.valor)) / 1000;
    expect(rec.ahorroKg).toBeCloseTo(esperado, 3);
  });

  it('sugiere compartir el auto, cambiar la comida, separar, vaso reutilizable y comprar menos', () => {
    const ids = calcularRecomendaciones(respuestas()).map((x) => x.id);
    for (const id of ['compartir_auto', 'carne_blanca', 'vegetariano', 'separar', 'vaso_reutilizable', 'compras']) {
      expect(ids).toContain(id);
    }
  });

  it('sugiere caminar solo en distancias cortas', () => {
    const corta = respuestas();
    corta.movilidad = { ...corta.movilidad, distanciaKm: 2 };
    expect(calcularRecomendaciones(corta).map((x) => x.id)).toContain('caminar');
    expect(calcularRecomendaciones(respuestas()).map((x) => x.id)).not.toContain('caminar');
  });

  it('no sugiere colectivo a quien ya viene en colectivo ni compartir un auto lleno', () => {
    const r = respuestas();
    r.movilidad = { ...r.movilidad, ida: { medio: 'colectivo', ocupantes: 1 } };
    expect(calcularRecomendaciones(r).map((x) => x.id)).not.toContain('colectivo');
    const lleno = respuestas();
    lleno.movilidad = { ...lleno.movilidad, ida: { medio: 'auto', ocupantes: 4 } };
    expect(calcularRecomendaciones(lleno).map((x) => x.id)).not.toContain('compartir_auto');
  });

  it('están ordenadas por ahorro descendente y todas ahorran algo', () => {
    const recs = calcularRecomendaciones(respuestas());
    for (let i = 1; i < recs.length; i++) expect(recs[i - 1].ahorroKg).toBeGreaterThanOrEqual(recs[i].ahorroKg);
    for (const x of recs) expect(x.ahorroKg).toBeGreaterThan(0.01);
  });

  it('no modifica las respuestas originales', () => {
    const r = respuestas();
    const copia = structuredClone(r);
    calcularRecomendaciones(r);
    expect(r).toEqual(copia);
  });
});

describe('gráfico', () => {
  it('con total 0 no hay segmentos ni barras con ancho', () => {
    const cero = { movilidad: 0, alimentacion: 0, residuos: 0, compras: 0 };
    expect(segmentosAnillo(cero)).toEqual([]);
    expect(barrasCategorias(cero).every((b) => b.relativo === 0)).toBe(true);
  });

  it('omite categorías en 0 y cubre el anillo completo', () => {
    const s = segmentosAnillo({ movilidad: 3, alimentacion: 1, residuos: 0, compras: 0 });
    expect(s.map((x) => x.id)).toEqual(['movilidad', 'alimentacion']);
    expect(s[0].inicio).toBe(0);
    expect(s.at(-1).fin).toBeCloseTo(1, 10);
  });

  it('ignora valores negativos o inválidos', () => {
    expect(segmentosAnillo({ movilidad: -2, alimentacion: NaN })).toEqual([]);
  });
});

describe('formato es-AR', () => {
  it('dos decimales con coma y la unidad', () => {
    expect(formatearKg(1.8)).toBe('1,80 kg CO₂e');
    expect(formatearNumero(1234.567)).toBe('1.234,57');
    expect(formatearNumero(0)).toBe('0,00');
    expect(formatearNumero(NaN)).toBe('0,00');
    expect(formatearNumero(-0.001)).toBe('0,00');
  });
});
