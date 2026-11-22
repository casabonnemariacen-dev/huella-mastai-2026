/**
 * Comparación de la huella con el promedio de la Fiesta (función pura).
 * Solo se compara si hay suficientes visitas registradas.
 */
import { SUPABASE } from '../config/evento.js';

/** Diferencias menores a este porcentaje se consideran "similar al promedio". */
export const MARGEN_SIMILAR_PCT = 5;

/**
 * @param {number} total      huella de la persona (kg CO₂e)
 * @param {object|null} resumen  respuesta de resumen_publico()
 * @returns {null | {estado:'pocos', cantidad, minimo} | {estado:'comparacion', promedio, cantidad, diferenciaPct, sentido}}
 */
export function compararConPromedio(total, resumen, minimo = SUPABASE.minimoParaPromedio) {
  const cantidad = Number(resumen?.cantidad);
  if (!Number.isFinite(cantidad) || cantidad < 0) return null;
  if (cantidad < minimo) return { estado: 'pocos', cantidad, minimo };

  const promedio = Number(resumen.promedio_total);
  if (!Number.isFinite(promedio) || promedio <= 0) return null;

  const diferenciaPct = ((Number(total) - promedio) / promedio) * 100;
  let sentido = 'similar';
  if (diferenciaPct <= -MARGEN_SIMILAR_PCT) sentido = 'debajo';
  else if (diferenciaPct >= MARGEN_SIMILAR_PCT) sentido = 'encima';

  return { estado: 'comparacion', promedio, cantidad, diferenciaPct, sentido };
}
