import { describe, it, expect } from 'vitest';
import { FACTORES } from '../../data/factores.js';
import { calcularAlimentacion, emisionBebidas, emisionComida } from '../alimentacion.js';

describe('alimentación', () => {
  it('comida por porción', () => {
    expect(emisionComida('vacuna')).toBe(FACTORES.carneVacuna.valor);
    expect(emisionComida('blanca')).toBe(FACTORES.carneBlanca.valor);
    expect(emisionComida('vegetariana')).toBe(FACTORES.platoVegetariano.valor);
    expect(emisionComida('ninguna')).toBe(0);
    expect(emisionComida(null)).toBe(0);
  });

  it('la porción de carne vacuna no se subestima (> 5 kg CO₂e)', () => {
    expect(FACTORES.carneVacuna.valor).toBeGreaterThan(5);
  });

  it('cerveza escala con la cantidad de vasos', () => {
    expect(emisionBebidas(['alcohol'], 1)).toBeCloseTo(FACTORES.cerveza.valor, 6);
    expect(emisionBebidas(['alcohol'], 3)).toBeCloseTo(3 * FACTORES.cerveza.valor, 6);
  });

  it('vasos fuera de rango se acotan a 1..6', () => {
    expect(emisionBebidas(['alcohol'], 0)).toBeCloseTo(FACTORES.cerveza.valor, 6);
    expect(emisionBebidas(['alcohol'], 99)).toBeCloseTo(6 * FACTORES.cerveza.valor, 6);
  });

  it('suma varias bebidas', () => {
    const esperado = 2 * FACTORES.cerveza.valor + FACTORES.bebidaBotella.valor + FACTORES.bebidaReutilizable.valor;
    expect(emisionBebidas(['alcohol', 'botella', 'reutilizable'], 2)).toBeCloseTo(esperado, 6);
  });

  it('"ninguna" anula las demás y no hay duplicados', () => {
    expect(emisionBebidas(['ninguna', 'alcohol'], 3)).toBe(0);
    expect(emisionBebidas(['botella', 'botella'])).toBe(FACTORES.bebidaBotella.valor);
  });

  it('total = comida + bebidas', () => {
    const r = calcularAlimentacion({ comida: 'vacuna', bebidas: ['alcohol'], vasosCerveza: 2 });
    expect(r.total).toBeCloseTo(FACTORES.carneVacuna.valor + 2 * FACTORES.cerveza.valor, 6);
    expect(calcularAlimentacion(undefined).total).toBe(0);
  });
});
