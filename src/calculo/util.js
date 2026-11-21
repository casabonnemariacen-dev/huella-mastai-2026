/** Convierte a número finito y no negativo; cualquier otro valor da 0. */
export function numeroSeguro(valor) {
  const n = typeof valor === 'string' ? Number(valor.replace(',', '.')) : Number(valor);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Entero dentro de [min, max]; si no es válido, devuelve min. */
export function enteroEnRango(valor, min, max) {
  const n = Math.floor(Number(valor));
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

/** Redondeo a n decimales para evitar ruido de coma flotante en resultados. */
export function redondear(valor, decimales = 4) {
  const f = 10 ** decimales;
  return Math.round((valor + Number.EPSILON) * f) / f;
}
