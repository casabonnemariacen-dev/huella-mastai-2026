import { FACTORES } from '../data/factores.js';
import { numeroSeguro } from './util.js';

/** kg CO₂e por carga de celular (red argentina). */
export const kgPorCargaCelular = () => FACTORES.cargaCelular.valor * FACTORES.redElectricaAR.valor;

/** Equivalencias de un total en kg CO₂e. */
export function calcularEquivalencias(totalKg) {
  const total = numeroSeguro(totalKg);
  return {
    cargasCelular: total / kgPorCargaCelular(),
    kmAuto: total / (FACTORES.auto.valor / 1000),
  };
}
