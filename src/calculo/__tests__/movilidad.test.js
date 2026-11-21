import { describe, it, expect } from 'vitest';
import { FACTORES } from '../../data/factores.js';
import { emisionTramo, calcularMovilidad, esMotorizado } from '../movilidad.js';

const mov = (extra = {}) => ({
  distanciaKm: 10,
  ida: { medio: 'auto', ocupantes: 1 },
  idaYVuelta: true,
  vuelta: { medio: null, ocupantes: 1 },
  ...extra,
});

describe('emisionTramo', () => {
  it('auto con una persona: km × factor', () => {
    expect(emisionTramo(10, 'auto', 1)).toBeCloseTo((10 * FACTORES.auto.valor) / 1000, 6);
  });

  it('divide entre ocupantes en auto y moto', () => {
    expect(emisionTramo(10, 'auto', 4)).toBeCloseTo(emisionTramo(10, 'auto', 1) / 4, 4);
    expect(emisionTramo(10, 'moto', 2)).toBeCloseTo(emisionTramo(10, 'moto', 1) / 2, 4);
  });

  it('no divide en colectivo ni remis', () => {
    expect(emisionTramo(10, 'colectivo', 5)).toBe(emisionTramo(10, 'colectivo', 1));
    expect(emisionTramo(10, 'remis', 3)).toBe(emisionTramo(10, 'remis', 1));
  });

  it('a pie / bici es 0', () => {
    expect(emisionTramo(25, 'pie_bici')).toBe(0);
    expect(esMotorizado('pie_bici')).toBe(false);
  });

  it('remis emite al menos lo mismo que un auto con una persona', () => {
    expect(emisionTramo(10, 'remis')).toBeGreaterThanOrEqual(emisionTramo(10, 'auto', 1));
  });

  it('casos límite: distancia 0, negativa, NaN, texto con coma, ocupantes inválidos', () => {
    expect(emisionTramo(0, 'auto')).toBe(0);
    expect(emisionTramo(-5, 'auto')).toBe(0);
    expect(emisionTramo(NaN, 'auto')).toBe(0);
    expect(emisionTramo('2,5', 'auto', 1)).toBeCloseTo((2.5 * FACTORES.auto.valor) / 1000, 6);
    expect(emisionTramo(10, 'auto', 0)).toBe(emisionTramo(10, 'auto', 1));
    expect(emisionTramo(10, 'auto', -3)).toBe(emisionTramo(10, 'auto', 1));
    expect(emisionTramo(10, 'medio_inexistente')).toBe(0);
  });
});

describe('calcularMovilidad', () => {
  it('ida y vuelta duplica la distancia', () => {
    const r = calcularMovilidad(mov());
    expect(r.vuelta).toBe(r.ida);
    expect(r.total).toBeCloseTo(2 * r.ida, 6);
    expect(r.kmTotales).toBe(20);
  });

  it('solo ida cuando se desactiva y no hay medio de vuelta', () => {
    const r = calcularMovilidad(mov({ idaYVuelta: false }));
    expect(r.vuelta).toBe(0);
    expect(r.total).toBe(r.ida);
    expect(r.kmTotales).toBe(10);
  });

  it('medio distinto para la vuelta', () => {
    const r = calcularMovilidad(mov({ idaYVuelta: false, vuelta: { medio: 'colectivo', ocupantes: 1 } }));
    expect(r.ida).toBeCloseTo((10 * FACTORES.auto.valor) / 1000, 6);
    expect(r.vuelta).toBeCloseTo((10 * FACTORES.colectivo.valor) / 1000, 6);
  });

  it('ocupantes distintos en la vuelta', () => {
    const r = calcularMovilidad(mov({ idaYVuelta: false, vuelta: { medio: 'auto', ocupantes: 2 } }));
    expect(r.vuelta).toBeCloseTo(r.ida / 2, 4);
  });

  it('la vuelta se ignora si ida y vuelta está activado', () => {
    const r = calcularMovilidad(mov({ vuelta: { medio: 'remis', ocupantes: 1 } }));
    expect(r.vuelta).toBe(r.ida);
  });

  it('sin medio elegido o sin datos da 0', () => {
    expect(calcularMovilidad(mov({ ida: { medio: null, ocupantes: 1 } })).total).toBe(0);
    expect(calcularMovilidad(undefined).total).toBe(0);
  });
});
