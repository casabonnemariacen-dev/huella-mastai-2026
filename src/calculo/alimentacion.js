import { FACTORES } from '../data/factores.js';
import { COMIDAS, BEBIDAS, buscar } from '../data/opciones.js';
import { LIMITES } from '../config/evento.js';
import { enteroEnRango, redondear } from './util.js';

export function emisionComida(comidaId) {
  const comida = buscar(COMIDAS, comidaId);
  return comida?.factor ? FACTORES[comida.factor].valor : 0;
}

/** bebidas: array de ids. vasos: cantidad de vasos de cerveza (1..6). */
export function emisionBebidas(bebidas = [], vasos = 1) {
  const lista = Array.from(bebidas);
  if (lista.includes('ninguna')) return 0;
  let total = 0;
  for (const id of new Set(lista)) {
    const bebida = buscar(BEBIDAS, id);
    if (!bebida?.factor) continue;
    const cantidad = bebida.porVaso ? enteroEnRango(vasos, 1, LIMITES.vasosMax) : 1;
    total += FACTORES[bebida.factor].valor * cantidad;
  }
  return redondear(total);
}

export function calcularAlimentacion(alimentacion) {
  const comida = emisionComida(alimentacion?.comida);
  const bebidas = emisionBebidas(alimentacion?.bebidas, alimentacion?.vasosCerveza);
  return { comida, bebidas, total: redondear(comida + bebidas) };
}
