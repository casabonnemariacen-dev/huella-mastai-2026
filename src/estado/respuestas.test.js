import { describe, it, expect } from 'vitest';
import { reducer, crearEstadoInicial, alternarBebida, validarPaso, normalizar, PASOS } from './respuestas.js';

const paso = (nombre) => PASOS.indexOf(nombre);

describe('bebidas: "No tomé nada" es excluyente', () => {
  it('marcar "ninguna" desmarca las demás', () => {
    expect(alternarBebida(['alcohol', 'botella'], 'ninguna')).toEqual(['ninguna']);
  });
  it('marcar otra desmarca "ninguna"', () => {
    expect(alternarBebida(['ninguna'], 'alcohol')).toEqual(['alcohol']);
  });
  it('volver a marcar una opción la desmarca', () => {
    expect(alternarBebida(['alcohol', 'botella'], 'alcohol')).toEqual(['botella']);
  });
});

describe('reducer', () => {
  it('cambiar de auto a moto acota los ocupantes a 2', () => {
    let s = crearEstadoInicial();
    s = reducer(s, { type: 'medio', tramo: 'ida', medio: 'auto' });
    s = reducer(s, { type: 'ocupantes', tramo: 'ida', ocupantes: 5 });
    expect(s.movilidad.ida.ocupantes).toBe(5);
    s = reducer(s, { type: 'medio', tramo: 'ida', medio: 'moto' });
    expect(s.movilidad.ida.ocupantes).toBe(2);
  });

  it('distancia inválida queda en 0 y se registra la fuente', () => {
    let s = reducer(crearEstadoInicial(), { type: 'distancia', km: -4 });
    expect(s.movilidad.distanciaKm).toBe(0);
    s = reducer(s, { type: 'distancia', km: 12.3, fuente: 'ruta' });
    expect(s.movilidad).toMatchObject({ distanciaKm: 12.3, fuenteDistancia: 'ruta' });
  });

  it('reiniciar vuelve al estado inicial sin compartir referencias', () => {
    const s = reducer(crearEstadoInicial(), { type: 'compras', valor: 'nada' });
    const r = reducer(s, { type: 'reiniciar' });
    expect(r).toEqual(crearEstadoInicial());
    r.alimentacion.bebidas.push('x');
    expect(crearEstadoInicial().alimentacion.bebidas).toEqual([]);
  });

  it('normalizar tolera datos corruptos', () => {
    expect(normalizar(null)).toEqual(crearEstadoInicial());
    const n = normalizar({ movilidad: { distanciaKm: 'abc' }, alimentacion: { bebidas: 'x' } });
    expect(n.movilidad.distanciaKm).toBe(0);
    expect(n.alimentacion.bebidas).toEqual([]);
  });
});

describe('validarPaso', () => {
  it('movilidad: exige medio', () => {
    expect(validarPaso(paso('movilidad'), crearEstadoInicial())).toContain('sinMedio');
  });

  it('movilidad: medio motorizado con distancia 0 no avanza', () => {
    const s = reducer(crearEstadoInicial(), { type: 'medio', tramo: 'ida', medio: 'colectivo' });
    expect(validarPaso(paso('movilidad'), s)).toEqual(['distanciaCero']);
    const ok = reducer(s, { type: 'distancia', km: 3 });
    expect(validarPaso(paso('movilidad'), ok)).toEqual([]);
  });

  it('movilidad: a pie con distancia 0 sí avanza', () => {
    const s = reducer(crearEstadoInicial(), { type: 'medio', tramo: 'ida', medio: 'pie_bici' });
    expect(validarPaso(paso('movilidad'), s)).toEqual([]);
  });

  it('movilidad: vuelta motorizada con distancia 0 no avanza', () => {
    let s = reducer(crearEstadoInicial(), { type: 'medio', tramo: 'ida', medio: 'pie_bici' });
    s = reducer(s, { type: 'idaYVuelta', valor: false });
    expect(validarPaso(paso('movilidad'), s)).toEqual(['sinMedioVuelta']);
    s = reducer(s, { type: 'medio', tramo: 'vuelta', medio: 'remis' });
    expect(validarPaso(paso('movilidad'), s)).toEqual(['distanciaCero']);
  });

  it('alimentación, residuos y compras exigen respuesta', () => {
    const s = crearEstadoInicial();
    expect(validarPaso(paso('alimentacion'), s)).toEqual(['sinComida', 'sinBebida']);
    expect(validarPaso(paso('residuos'), s)).toEqual(['sinResiduos']);
    expect(validarPaso(paso('compras'), s)).toEqual(['sinCompras']);
    expect(validarPaso(paso('bienvenida'), s)).toEqual([]);
  });
});
