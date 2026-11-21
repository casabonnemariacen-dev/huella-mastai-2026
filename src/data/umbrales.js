/**
 * Niveles de la huella de la visita (kg CO₂e).
 * Un nivel aplica si total < hasta. El último no tiene límite.
 *
 * Criterio: los umbrales surgen de combinaciones típicas de respuestas con los
 * factores de src/data/factores.js. NO comparan con otros visitantes.
 *  - Bajo (< 3): por ejemplo, 5 km en colectivo (ida y vuelta), plato
 *    vegetariano, un vaso de cerveza y residuos separados (~2,3 kg).
 *  - Medio (3 a 10): por ejemplo, 15 km en auto con una sola persona (ida y
 *    vuelta), carne blanca y dos vasos de cerveza (~8,2 kg).
 *  - Alto (≥ 10): por ejemplo, una porción de carne vacuna (~12 kg) sola ya
 *    supera este límite, igual que viajes largos en auto con una sola persona.
 */
export const NIVELES = [
  { id: 'bajo', hasta: 3 },
  { id: 'medio', hasta: 10 },
  { id: 'alto', hasta: Infinity },
];
