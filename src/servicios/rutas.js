/**
 * Cálculo de rutas con una API compatible con OSRM.
 * Si falla, la app usa `distanciaEstimadaKm` (línea recta × factor de desvío)
 * y la persona puede ajustar la distancia a mano.
 */
import { SERVICIOS } from '../config/evento.js';
import { crearLimitador } from './limitador.js';
import { ErrorServicio } from './geocodificacion.js';

const limitar = crearLimitador(1000 / SERVICIOS.solicitudesPorSegundo);
const cache = new Map();
const claveDe = (o, d) => `${o.lat.toFixed(5)},${o.lon.toFixed(5)}>${d.lat.toFixed(5)},${d.lon.toFixed(5)}`;

/** Distancia en línea recta (haversine), en km. */
export function distanciaLineaRectaKm(a, b) {
  const R = 6371.0088;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function distanciaEstimadaKm(a, b) {
  return distanciaLineaRectaKm(a, b) * SERVICIOS.factorDesvio;
}

/** Interpreta la respuesta de OSRM: { km, geometria: [[lat, lon], ...] }. */
export function interpretarOsrm(json) {
  const ruta = json?.code === 'Ok' ? json.routes?.[0] : null;
  if (!ruta || !Number.isFinite(ruta.distance)) throw new ErrorServicio('sin ruta');
  const geometria = (ruta.geometry?.coordinates ?? []).map(([lon, lat]) => [lat, lon]);
  return { km: ruta.distance / 1000, geometria };
}

/** Ruta en caché (para volver al paso sin repetir la solicitud). */
export const rutaEnCache = (origen, destino) => cache.get(claveDe(origen, destino)) ?? null;

export async function calcularRuta(origen, destino, signal) {
  const clave = claveDe(origen, destino);
  if (cache.has(clave)) return cache.get(clave);

  const url =
    `${SERVICIOS.rutas.replace(/\/$/, '')}/route/v1/${SERVICIOS.perfilRutas}/` +
    `${origen.lon},${origen.lat};${destino.lon},${destino.lat}?overview=simplified&geometries=geojson`;

  const control = new AbortController();
  const cortar = () => control.abort();
  signal?.addEventListener('abort', cortar);
  const temporizador = setTimeout(cortar, SERVICIOS.tiempoLimiteMs);
  try {
    const json = await limitar(async () => {
      const res = await fetch(url, { signal: control.signal });
      if (!res.ok) throw new ErrorServicio(`http ${res.status}`);
      return res.json();
    }, control.signal);
    const resultado = interpretarOsrm(json);
    cache.set(clave, resultado);
    return resultado;
  } catch (e) {
    if (signal?.aborted) throw e;
    throw e instanceof ErrorServicio ? e : new ErrorServicio(e.name === 'AbortError' ? 'tiempo agotado' : 'red');
  } finally {
    clearTimeout(temporizador);
    signal?.removeEventListener('abort', cortar);
  }
}
