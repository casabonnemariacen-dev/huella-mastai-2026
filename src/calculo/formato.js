export const UNIDAD = 'kg CO₂e';

const formato2 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatoEntero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/** "1234,5" → "1.234,50". Valores no finitos se muestran como "0,00". */
export function formatearNumero(valor) {
  const n = Number(valor);
  return formato2.format(Number.isFinite(n) ? n : 0).replace(/^-(0,00)$/, '$1');
}

/** "1,80 kg CO₂e" */
export function formatearKg(valor) {
  return `${formatearNumero(valor)} ${UNIDAD}`;
}

export function formatearEntero(valor) {
  const n = Number(valor);
  return formatoEntero.format(Number.isFinite(n) ? Math.round(n) : 0);
}

/** Número con hasta 2 decimales (sin ceros forzados), para factores y km. */
export function formatearDecimal(valor, maximo = 2) {
  const n = Number(valor);
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: maximo }).format(Number.isFinite(n) ? n : 0);
}
