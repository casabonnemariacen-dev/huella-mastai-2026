import { describe, it, expect } from 'vitest';
import { armarExportacion, aCsv } from '../exportar.js';
import { calcularHuella } from '../total.js';
import { crearEstadoInicial } from '../../estado/respuestas.js';

const respuestas = () => {
  const r = crearEstadoInicial();
  r.movilidad = { ...r.movilidad, origen: { texto: 'Junín 1200; "Centro"', lat: -27.4, lon: -58.8 }, distanciaKm: 2.5, ida: { medio: 'auto', ocupantes: 2 } };
  r.alimentacion = { comida: 'blanca', bebidas: ['alcohol', 'botella'], vasosCerveza: 2 };
  r.residuos = 'separe';
  r.compras = 'nada';
  return r;
};

describe('exportación', () => {
  it('incluye respuestas y resultados, sin coordenadas', () => {
    const r = respuestas();
    const datos = armarExportacion(r, calcularHuella(r), new Date('2026-11-21T20:00:00Z'));
    expect(datos.fecha).toBe('2026-11-21T20:00:00.000Z');
    expect(datos.unidad).toBe('kg CO₂e');
    expect(datos.respuestas.movilidad.origen).toBe('Junín 1200; "Centro"');
    expect(JSON.stringify(datos)).not.toContain('-27.4');
    expect(datos.resultados.total).toBeGreaterThan(0);
  });

  it('CSV con BOM, ";" como separador, coma decimal y comillas escapadas', () => {
    const r = respuestas();
    const csv = aCsv(armarExportacion(r, calcularHuella(r)));
    expect(csv.startsWith('﻿campo;valor\r\n')).toBe(true);
    expect(csv).toContain('respuestas.movilidad.distanciaIdaKm;2,5');
    expect(csv).toContain('respuestas.movilidad.origen;"Junín 1200; ""Centro"""');
    expect(csv).toContain('respuestas.alimentacion.bebidas;alcohol | botella');
    expect(csv).toMatch(/resultados\.recomendaciones\.0\.id;\w+/);
  });
});
