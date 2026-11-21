import { describe, it, expect, vi, afterEach } from 'vitest';
import { crearLimitador } from './limitador.js';
import { interpretarPhoton, textoDePhoton, urlPhoton } from './geocodificacion.js';
import { distanciaLineaRectaKm, distanciaEstimadaKm, interpretarOsrm } from './rutas.js';
import { EVENTO, SERVICIOS } from '../config/evento.js';

afterEach(() => vi.useRealTimers());

describe('limitador', () => {
  it('separa las solicitudes al menos el intervalo', async () => {
    vi.useFakeTimers();
    const inicios = [];
    const ejecutar = crearLimitador(1000);
    const tareas = [1, 2, 3].map((n) => ejecutar(async () => (inicios.push(Date.now()), n)));
    await vi.runAllTimersAsync();
    expect(await Promise.all(tareas)).toEqual([1, 2, 3]);
    expect(inicios[1] - inicios[0]).toBeGreaterThanOrEqual(1000);
    expect(inicios[2] - inicios[1]).toBeGreaterThanOrEqual(1000);
  });

  it('descarta tareas abortadas sin ejecutarlas', async () => {
    const ejecutar = crearLimitador(0);
    const control = new AbortController();
    control.abort();
    const tarea = vi.fn();
    await expect(ejecutar(tarea, control.signal)).rejects.toThrow('Cancelada');
    expect(tarea).not.toHaveBeenCalled();
  });

  it('un error no bloquea la cola', async () => {
    const ejecutar = crearLimitador(0);
    await expect(ejecutar(() => Promise.reject(new Error('x')))).rejects.toThrow('x');
    await expect(ejecutar(async () => 'ok')).resolves.toBe('ok');
  });
});

describe('geocodificación', () => {
  it('la URL de Photon lleva el sesgo hacia el Anfiteatro', () => {
    const url = new URL(urlPhoton('San Martín 123'));
    expect(url.searchParams.get('lat')).toBe(String(EVENTO.sede.lat));
    expect(url.searchParams.get('lon')).toBe(String(EVENTO.sede.lon));
    expect(url.searchParams.get('q')).toBe('San Martín 123');
  });

  it('arma textos legibles y prioriza la zona de Corrientes', () => {
    const json = {
      features: [
        { properties: { name: 'Lejos', city: 'Córdoba' }, geometry: { coordinates: [-64.18, -31.42] } },
        { properties: { street: 'Junín', housenumber: '1200', city: 'Corrientes' }, geometry: { coordinates: [-58.83, -27.47] } },
        { properties: { street: 'Junín', housenumber: '1200', city: 'Corrientes' }, geometry: { coordinates: [-58.83, -27.47] } },
        { properties: {}, geometry: { coordinates: [-58.8, -27.4] } },
      ],
    };
    const r = interpretarPhoton(json);
    expect(r.map((x) => x.texto)).toEqual(['Junín 1200, Corrientes', 'Lejos, Córdoba']);
    expect(textoDePhoton({ name: 'Corrientes', city: 'Corrientes', state: 'Corrientes' })).toBe('Corrientes');
  });
});

describe('rutas', () => {
  it('haversine: centro de Corrientes al Anfiteatro ≈ 2,4 km', () => {
    const centro = { lat: -27.4692, lon: -58.8306 };
    const km = distanciaLineaRectaKm(centro, EVENTO.sede);
    expect(km).toBeGreaterThan(2.2);
    expect(km).toBeLessThan(2.6);
    expect(distanciaEstimadaKm(centro, EVENTO.sede)).toBeCloseTo(km * SERVICIOS.factorDesvio, 6);
    expect(distanciaLineaRectaKm(EVENTO.sede, EVENTO.sede)).toBe(0);
  });

  it('interpreta OSRM y rechaza respuestas sin ruta', () => {
    const r = interpretarOsrm({
      code: 'Ok',
      routes: [{ distance: 5234, geometry: { coordinates: [[-58.8, -27.4], [-58.83, -27.49]] } }],
    });
    expect(r.km).toBeCloseTo(5.234, 6);
    expect(r.geometria[0]).toEqual([-27.4, -58.8]);
    expect(() => interpretarOsrm({ code: 'NoRoute' })).toThrow();
    expect(() => interpretarOsrm(null)).toThrow();
  });
});
