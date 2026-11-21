import { NIVELES } from '../data/umbrales.js';
import { calcularCategorias } from './categorias.js';
import { calcularEquivalencias } from './equivalencias.js';
import { calcularRecomendaciones } from './recomendaciones.js';

export { calcularCategorias };

/** Nivel para un total en kg CO₂e. */
export function nivelDe(totalKg) {
  return (NIVELES.find((n) => totalKg < n.hasta) ?? NIVELES[NIVELES.length - 1]).id;
}

/** Resultado completo de la huella de la visita. */
export function calcularHuella(respuestas) {
  const base = calcularCategorias(respuestas);
  return {
    ...base,
    nivel: nivelDe(base.total),
    equivalencias: calcularEquivalencias(base.total),
    recomendaciones: calcularRecomendaciones(respuestas, base.total),
  };
}
