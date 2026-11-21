import { CATEGORIAS } from '../data/opciones.js';

/**
 * Segmentos del gráfico de anillo: solo categorías con valor > 0.
 * Con total 0 devuelve [] para no dibujar arcos residuales.
 */
export function segmentosAnillo(porCategoria) {
  const valores = CATEGORIAS.map((id) => ({ id, valor: Math.max(0, Number(porCategoria?.[id]) || 0) }));
  const total = valores.reduce((s, v) => s + v.valor, 0);
  if (total <= 0) return [];
  let acumulado = 0;
  return valores
    .filter((v) => v.valor > 0)
    .map((v) => {
      const inicio = acumulado / total;
      acumulado += v.valor;
      return { ...v, proporcion: v.valor / total, inicio, fin: acumulado / total };
    });
}

/** Barras: ancho relativo al máximo (0..1). Con total 0, todas en 0. */
export function barrasCategorias(porCategoria) {
  const valores = CATEGORIAS.map((id) => ({ id, valor: Math.max(0, Number(porCategoria?.[id]) || 0) }));
  const maximo = Math.max(...valores.map((v) => v.valor));
  return valores.map((v) => ({ ...v, relativo: maximo > 0 ? v.valor / maximo : 0 }));
}
