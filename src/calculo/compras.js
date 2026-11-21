import { FACTORES } from '../data/factores.js';
import { COMPRAS, buscar } from '../data/opciones.js';
import { redondear } from './util.js';

export function calcularCompras(compraId) {
  const opcion = buscar(COMPRAS, compraId);
  if (!opcion) return 0;
  const total = opcion.componentes.reduce((suma, [factor, cantidad]) => suma + FACTORES[factor].valor * cantidad, 0);
  return redondear(total);
}
