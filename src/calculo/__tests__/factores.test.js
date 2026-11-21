import { describe, it, expect } from 'vitest';
import { FACTORES } from '../../data/factores.js';
import { MEDIOS, COMIDAS, BEBIDAS, COMPRAS } from '../../data/opciones.js';
import { NIVELES } from '../../data/umbrales.js';

describe('factores.js', () => {
  it('cada factor tiene valor, unidad con CO₂e o kWh, fuente, año y bandera estimado', () => {
    for (const [clave, f] of Object.entries(FACTORES)) {
      expect(Number.isFinite(f.valor), clave).toBe(true);
      expect(f.valor, clave).toBeGreaterThanOrEqual(0);
      expect(f.unidad, clave).toMatch(/CO₂e|kWh|kg\/visitante/);
      expect(f.fuente?.nombre, clave).toBeTruthy();
      expect(typeof f.fuente.url, clave).toBe('string');
      expect(Number.isInteger(f.anio), clave).toBe(true);
      expect(typeof f.estimado, clave).toBe('boolean');
      expect(f.nombre, clave).toBeTruthy();
    }
  });

  it('las unidades de movilidad son todas g CO₂e/km', () => {
    for (const m of MEDIOS) expect(FACTORES[m.factor].unidad).toBe('g CO₂e/km');
  });

  it('todas las opciones apuntan a factores existentes', () => {
    for (const o of [...MEDIOS, ...COMIDAS, ...BEBIDAS]) if (o.factor) expect(FACTORES[o.factor], o.id).toBeDefined();
    for (const c of COMPRAS) for (const [f] of c.componentes) expect(FACTORES[f], c.id).toBeDefined();
  });

  it('el remis nunca es menor que el auto', () => {
    expect(FACTORES.remis.valor).toBeGreaterThanOrEqual(FACTORES.auto.valor);
  });

  it('la carne vacuna es el alimento de mayor impacto', () => {
    expect(FACTORES.carneVacuna.valor).toBeGreaterThan(FACTORES.carneBlanca.valor);
    expect(FACTORES.carneBlanca.valor).toBeGreaterThan(FACTORES.platoVegetariano.valor);
  });

  it('los umbrales son crecientes y el último es abierto', () => {
    for (let i = 1; i < NIVELES.length; i++) expect(NIVELES[i].hasta).toBeGreaterThan(NIVELES[i - 1].hasta);
    expect(NIVELES.at(-1).hasta).toBe(Infinity);
  });
});
