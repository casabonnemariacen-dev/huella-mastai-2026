import { describe, it, expect } from 'vitest';
import { FACTORES, SUPUESTOS } from '../../data/factores.js';
import { calcularResiduos } from '../residuos.js';
import { calcularCompras } from '../compras.js';

describe('residuos', () => {
  const kg = FACTORES.residuosPorVisitante.valor;

  it('todo al mismo tacho: todo a relleno', () => {
    expect(calcularResiduos('mismo_tacho').total).toBeCloseTo(kg * FACTORES.residuoRelleno.valor, 4);
  });

  it('separar emite menos que no separar', () => {
    const f = SUPUESTOS.fraccionRecicladaSiSepara;
    const esperado = kg * (f * FACTORES.residuoReciclado.valor + (1 - f) * FACTORES.residuoRelleno.valor);
    expect(calcularResiduos('separe').total).toBeCloseTo(esperado, 4);
    expect(calcularResiduos('separe').total).toBeLessThan(calcularResiduos('mismo_tacho').total);
  });

  it('dejar basura fuera NO suma CO₂e extra, pero activa el aviso', () => {
    const fuera = calcularResiduos('fuera');
    expect(fuera.total).toBe(calcularResiduos('mismo_tacho').total);
    expect(fuera.avisoBasura).toBe(true);
    expect(calcularResiduos('separe').avisoBasura).toBe(false);
  });

  it('sin respuesta da 0', () => {
    expect(calcularResiduos(null)).toEqual({ total: 0, avisoBasura: false });
  });
});

describe('compras', () => {
  it('valores por opción', () => {
    expect(calcularCompras('nada')).toBe(0);
    expect(calcularCompras('pequeno')).toBe(FACTORES.compraPequena.valor);
    expect(calcularCompras('prenda')).toBe(FACTORES.prenda.valor);
    expect(calcularCompras('varias')).toBe(FACTORES.prenda.valor + 2 * FACTORES.compraPequena.valor);
    expect(calcularCompras(undefined)).toBe(0);
  });

  it('orden creciente de impacto', () => {
    expect(calcularCompras('pequeno')).toBeLessThan(calcularCompras('prenda'));
    expect(calcularCompras('prenda')).toBeLessThan(calcularCompras('varias'));
  });
});
