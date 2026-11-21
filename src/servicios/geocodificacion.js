/**
 * Búsqueda de direcciones (datos de OpenStreetMap).
 * - Autocompletado: Photon (la política de Nominatim prohíbe autocompletar).
 * - Geocodificación inversa: Nominatim.
 * Ambos pasan por un limitador de 1 solicitud por segundo y una caché.
 */
import { BUSQUEDA, SERVICIOS } from '../config/evento.js';
import { crearLimitador } from './limitador.js';

const limitarPhoton = crearLimitador(1000 / SERVICIOS.solicitudesPorSegundo);
const limitarNominatim = crearLimitador(1000 / SERVICIOS.solicitudesPorSegundo);
const cache = new Map();

export class ErrorServicio extends Error {}

const dentroDeCaja = ({ lat, lon }) => {
  const [oeste, sur, este, norte] = BUSQUEDA.caja;
  return lon >= oeste && lon <= este && lat >= sur && lat <= norte;
};

/** Texto legible a partir de las propiedades de Photon. */
export function textoDePhoton(p = {}) {
  const calle = p.street ? [p.street, p.housenumber].filter(Boolean).join(' ') : null;
  const partes = [p.name, calle, p.district, p.city ?? p.locality ?? p.county, p.state];
  return [...new Set(partes.filter(Boolean))].join(', ');
}

/** Convierte la respuesta GeoJSON de Photon a [{ texto, lat, lon }]. Primero, lo de la zona. */
export function interpretarPhoton(json) {
  const vistos = new Set();
  const lista = (json?.features ?? [])
    .map((f) => ({
      texto: textoDePhoton(f.properties),
      lon: f.geometry?.coordinates?.[0],
      lat: f.geometry?.coordinates?.[1],
    }))
    .filter((r) => r.texto && Number.isFinite(r.lat) && Number.isFinite(r.lon))
    .filter((r) => (vistos.has(r.texto) ? false : vistos.add(r.texto)));
  // Orden estable: primero los resultados dentro de la caja de Corrientes.
  return [...lista.filter(dentroDeCaja), ...lista.filter((r) => !dentroDeCaja(r))];
}

export function urlPhoton(texto) {
  const p = new URLSearchParams({
    q: texto,
    limit: String(BUSQUEDA.maximoResultados + 4),
    lat: String(BUSQUEDA.centro.lat),
    lon: String(BUSQUEDA.centro.lon),
    zoom: String(BUSQUEDA.zoomSesgo),
    location_bias_scale: String(BUSQUEDA.escalaSesgo),
  });
  return `${SERVICIOS.photon}?${p}`;
}

async function obtenerJson(url, signal) {
  let res;
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ErrorServicio('red');
  }
  if (!res.ok) throw new ErrorServicio(`http ${res.status}`);
  return res.json();
}

/** Sugerencias para un texto. Devuelve [] si el texto es corto. */
export async function buscarDirecciones(texto, signal) {
  const q = texto.trim();
  if (q.length < BUSQUEDA.minimoCaracteres) return [];
  const clave = `p:${q.toLowerCase()}`;
  if (cache.has(clave)) return cache.get(clave);
  const json = await limitarPhoton(() => obtenerJson(urlPhoton(q), signal), signal);
  const resultado = interpretarPhoton(json).slice(0, BUSQUEDA.maximoResultados);
  cache.set(clave, resultado);
  return resultado;
}

/** Dirección aproximada para unas coordenadas (o null si no se encuentra). */
export async function direccionDesdeCoordenadas(lat, lon, signal) {
  const clave = `n:${lat.toFixed(5)},${lon.toFixed(5)}`;
  if (cache.has(clave)) return cache.get(clave);
  const p = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'jsonv2',
    zoom: '18',
    'accept-language': BUSQUEDA.idioma,
  });
  const json = await limitarNominatim(() => obtenerJson(`${SERVICIOS.nominatim}/reverse?${p}`, signal), signal);
  const a = json?.address ?? {};
  const calle = a.road ? [a.road, a.house_number].filter(Boolean).join(' ') : null;
  const texto = [calle, a.suburb ?? a.neighbourhood, a.city ?? a.town ?? a.village].filter(Boolean).join(', ') || json?.display_name || null;
  cache.set(clave, texto);
  return texto;
}
