import { FACTORES, SUPUESTOS } from '../data/factores.js';
import { RESIDUOS, buscar } from '../data/opciones.js';
import { redondear } from './util.js';

/**
 * kg CO₂e de los residuos de la visita.
 * - Separa: una fracción se recicla y el resto va a relleno.
 * - No separa (incluye "dejé residuos fuera"): todo va a relleno.
 * El daño de la basura tirada al suelo o al agua NO se cuenta como CO₂e:
 * se informa aparte con `avisoBasura`.
 */
export function calcularResiduos(residuoId) {
  const opcion = buscar(RESIDUOS, residuoId);
  if (!opcion) return { total: 0, avisoBasura: false };
  const kg = FACTORES.residuosPorVisitante.valor;
  const relleno = FACTORES.residuoRelleno.valor;
  const reciclado = FACTORES.residuoReciclado.valor;
  const fraccion = opcion.separa ? SUPUESTOS.fraccionRecicladaSiSepara : 0;
  const total = kg * (fraccion * reciclado + (1 - fraccion) * relleno);
  return { total: redondear(total), avisoBasura: opcion.avisoBasura };
}
