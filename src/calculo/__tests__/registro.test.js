import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { armarRegistro } from '../registro.js';
import { compararConPromedio, MARGEN_SIMILAR_PCT } from '../comparacion.js';
import { calcularHuella } from '../total.js';
import { crearEstadoInicial } from '../../estado/respuestas.js';
import { MEDIOS, COMIDAS, BEBIDAS, RESIDUOS, COMPRAS } from '../../data/opciones.js';

const ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const TOKEN = 'a'.repeat(64);
const SQL = readFileSync(resolve(process.cwd(), 'supabase/migrations/002_acceso_solo_por_funciones.sql'), 'utf8');
const SQL_001 = readFileSync(resolve(process.cwd(), 'supabase/migrations/001_resultados_anonimos.sql'), 'utf8');

const respuestas = (cambios = {}) => {
  const r = crearEstadoInicial();
  r.movilidad = {
    ...r.movilidad,
    origen: { texto: 'Junín 1200, Corrientes', lat: -27.4677, lon: -58.8355 },
    distanciaKm: 7.6,
    fuenteDistancia: 'ruta',
    ida: { medio: 'auto', ocupantes: 3 },
  };
  r.alimentacion = { comida: 'blanca', bebidas: ['alcohol', 'botella'], vasosCerveza: 2 };
  r.residuos = 'separe';
  r.compras = 'pequeno';
  return { ...r, ...cambios };
};
const registro = (r = respuestas()) => armarRegistro(r, calcularHuella(r), ID, TOKEN);

describe('armarRegistro', () => {
  it('tiene exactamente los campos que acepta registrar_resultado()', () => {
    const permitidos = SQL.match(/v_claves\s+text\[\]\s*:=\s*array\[([\s\S]*?)\]/)[1].match(/'([a-z_]+)'/g).map((s) => s.slice(1, -1));
    expect(Object.keys(registro()).sort()).toEqual([...permitidos].sort());
  });

  it('incluye el token secreto de la visita (la base guarda solo su hash)', () => {
    expect(registro().token).toBe(TOKEN);
  });

  it('no incluye origen, coordenadas ni ningún dato personal', () => {
    const texto = JSON.stringify(registro());
    expect(texto).not.toMatch(/Junín|origen|lat|lon|-27\.4|-58\.8/);
  });

  it('redondea la distancia a 1 km y guarda los totales con 3 decimales', () => {
    const reg = registro();
    expect(reg.distancia_km).toBe(8);
    for (const k of ['total', 'movilidad', 'alimentacion', 'residuos_kg', 'compras_kg']) {
      expect(Number.isFinite(reg[k])).toBe(true);
      expect(Math.round(reg[k] * 1000) / 1000).toBe(reg[k]);
    }
  });

  it('el total es la suma de las categorías (regla total_coherente de la base)', () => {
    const reg = registro();
    expect(Math.abs(reg.total - (reg.movilidad + reg.alimentacion + reg.residuos_kg + reg.compras_kg))).toBeLessThan(0.0005);
    expect(Math.abs(reg.total - calcularHuella(respuestas()).total)).toBeLessThan(0.005);
  });

  it('ocupantes solo para auto y moto; sin medio de vuelta si es ida y vuelta', () => {
    expect(registro()).toMatchObject({ medio_ida: 'auto', ocupantes_ida: 3, ida_y_vuelta: true, medio_vuelta: null, ocupantes_vuelta: null });
    const r = respuestas();
    r.movilidad = { ...r.movilidad, ida: { medio: 'colectivo', ocupantes: 1 }, idaYVuelta: false, vuelta: { medio: 'moto', ocupantes: 2 } };
    expect(registro(r)).toMatchObject({ ocupantes_ida: null, ida_y_vuelta: false, medio_vuelta: 'moto', ocupantes_vuelta: 2 });
  });

  it('vasos solo si hay bebidas alcohólicas, y sin bebidas repetidas', () => {
    expect(registro().vasos).toBe(2);
    const r = respuestas();
    r.alimentacion = { comida: 'ninguna', bebidas: ['ninguna'], vasosCerveza: 4 };
    expect(registro(r)).toMatchObject({ bebidas: ['ninguna'], vasos: null });
    r.alimentacion = { comida: 'ninguna', bebidas: ['botella', 'botella'], vasosCerveza: 1 };
    expect(registro(r).bebidas).toEqual(['botella']);
  });

  it('devuelve null si faltan respuestas o el id', () => {
    expect(registro(crearEstadoInicial())).toBeNull();
    expect(armarRegistro(respuestas(), calcularHuella(respuestas()), '', TOKEN)).toBeNull();
    expect(armarRegistro(respuestas(), calcularHuella(respuestas()), ID, '')).toBeNull();
    const r = respuestas();
    r.movilidad = { ...r.movilidad, idaYVuelta: false, vuelta: { medio: null, ocupantes: 1 } };
    expect(registro(r)).toBeNull();
  });

  it('las opciones de la app coinciden con los CHECK de la tabla', () => {
    const lista = (columna) =>
      SQL_001.match(new RegExp(`${columna}\\s+text[^\\n]*check \\(${columna} in \\(([^)]*)\\)`))[1].match(/'([a-z_]+)'/g).map((s) => s.slice(1, -1));
    expect(lista('medio_ida')).toEqual(MEDIOS.map((m) => m.id));
    expect(lista('comida')).toEqual(COMIDAS.map((m) => m.id));
    expect(lista('residuos')).toEqual(RESIDUOS.map((m) => m.id));
    expect(lista('compras')).toEqual(COMPRAS.map((m) => m.id));
    const bebidas = SQL_001.match(/bebidas <@ array\[([^\]]*)\]/)[1].match(/'([a-z_]+)'/g).map((s) => s.slice(1, -1));
    expect(bebidas).toEqual(BEBIDAS.map((b) => b.id));
  });
});

describe('compararConPromedio', () => {
  it('pide un mínimo de visitas', () => {
    expect(compararConPromedio(5, { cantidad: 12, promedio_total: 6 }, 30)).toEqual({ estado: 'pocos', cantidad: 12, minimo: 30 });
  });

  it('calcula la diferencia porcentual y el sentido', () => {
    expect(compararConPromedio(4, { cantidad: 30, promedio_total: 8 }, 30)).toMatchObject({ estado: 'comparacion', diferenciaPct: -50, sentido: 'debajo' });
    expect(compararConPromedio(12, { cantidad: 31, promedio_total: 8 }, 30)).toMatchObject({ diferenciaPct: 50, sentido: 'encima' });
    expect(compararConPromedio(8.2, { cantidad: 40, promedio_total: 8 }, 30).sentido).toBe('similar');
    expect(MARGEN_SIMILAR_PCT).toBe(5);
  });

  it('sin datos válidos no compara', () => {
    expect(compararConPromedio(5, null)).toBeNull();
    expect(compararConPromedio(5, { cantidad: 50, promedio_total: 0 }, 30)).toBeNull();
    expect(compararConPromedio(5, { cantidad: 50, promedio_total: null }, 30)).toBeNull();
    expect(compararConPromedio(5, { cantidad: 'x' })).toBeNull();
  });
});
