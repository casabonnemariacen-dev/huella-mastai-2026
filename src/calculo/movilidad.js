import { FACTORES } from '../data/factores.js';
import { MEDIOS, buscar } from '../data/opciones.js';
import { LIMITES } from '../config/evento.js';
import { numeroSeguro, enteroEnRango, redondear } from './util.js';

/** Factor del medio en g CO₂e/km (0 si el medio no existe). */
export function factorMedio(medioId) {
  const medio = buscar(MEDIOS, medioId);
  return medio ? FACTORES[medio.factor].valor : 0;
}

export function esMotorizado(medioId) {
  return Boolean(buscar(MEDIOS, medioId)?.motorizado);
}

export function divideOcupantes(medioId) {
  return Boolean(buscar(MEDIOS, medioId)?.divideOcupantes);
}

/**
 * Emisión de un tramo en kg CO₂e.
 * km × factor (g/km) ÷ 1000, dividido entre ocupantes solo para auto y moto.
 */
export function emisionTramo(km, medioId, ocupantes = 1) {
  const distancia = Math.min(numeroSeguro(km), LIMITES.distanciaMaxKm);
  const factorG = factorMedio(medioId);
  const personas = divideOcupantes(medioId) ? enteroEnRango(ocupantes, 1, LIMITES.ocupantesMax) : 1;
  return redondear((distancia * factorG) / 1000 / personas);
}

/**
 * Medio y ocupantes efectivos de la vuelta.
 * - Ida y vuelta activado: misma configuración que la ida.
 * - Desactivado con medio de vuelta elegido: ese medio.
 * - Desactivado sin medio de vuelta: no hay tramo de vuelta.
 */
export function tramoVuelta(movilidad) {
  if (movilidad.idaYVuelta) return movilidad.ida;
  return movilidad.vuelta?.medio ? movilidad.vuelta : null;
}

/** Emisiones de movilidad: { ida, vuelta, total, kmTotales } en kg CO₂e y km. */
export function calcularMovilidad(movilidad) {
  if (!movilidad?.ida?.medio) return { ida: 0, vuelta: 0, total: 0, kmTotales: 0 };
  const km = Math.min(numeroSeguro(movilidad.distanciaKm), LIMITES.distanciaMaxKm);
  const ida = emisionTramo(km, movilidad.ida.medio, movilidad.ida.ocupantes);
  const v = tramoVuelta(movilidad);
  const vuelta = v ? emisionTramo(km, v.medio, v.ocupantes) : 0;
  return {
    ida,
    vuelta,
    total: redondear(ida + vuelta),
    kmTotales: v ? km * 2 : km,
  };
}
