import { calcularMovilidad } from './movilidad.js';
import { calcularAlimentacion } from './alimentacion.js';
import { calcularResiduos } from './residuos.js';
import { calcularCompras } from './compras.js';
import { redondear } from './util.js';

/** Totales por categoría en kg CO₂e. */
export function calcularCategorias(respuestas) {
  const movilidad = calcularMovilidad(respuestas?.movilidad);
  const alimentacion = calcularAlimentacion(respuestas?.alimentacion);
  const residuos = calcularResiduos(respuestas?.residuos);
  const compras = calcularCompras(respuestas?.compras);
  const porCategoria = {
    movilidad: movilidad.total,
    alimentacion: alimentacion.total,
    residuos: residuos.total,
    compras,
  };
  const total = redondear(Object.values(porCategoria).reduce((a, b) => a + b, 0));
  return { total, porCategoria, detalle: { movilidad, alimentacion }, avisoBasura: residuos.avisoBasura };
}
