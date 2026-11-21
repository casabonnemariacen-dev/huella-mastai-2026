import { calcularCategorias } from './categorias.js';
import { esMotorizado } from './movilidad.js';
import { redondear } from './util.js';

/** Ahorro mínimo para mostrar una recomendación (kg CO₂e). */
export const AHORRO_MINIMO = 0.01;
/** Distancia (solo ida) hasta la cual se sugiere caminar o ir en bici. */
export const KM_CAMINABLES = 3;
const OCUPANTES_AUTO_LLENO = 4;

const clonar = (o) => structuredClone(o);

/** Aplica `cambio` a una copia de las respuestas y devuelve el nuevo total. */
function totalCon(respuestas, cambio) {
  const copia = clonar(respuestas);
  cambio(copia);
  return calcularCategorias(copia).total;
}

/** Todos los tramos (ida y vuelta) pasan a `medio`. */
function cambiarMedios(medio, ocupantes = 1) {
  return (r) => {
    r.movilidad.ida = { medio, ocupantes };
    if (!r.movilidad.idaYVuelta && r.movilidad.vuelta?.medio) r.movilidad.vuelta = { medio, ocupantes };
  };
}

/**
 * Recomendaciones contrafactuales: [{ id, ahorroKg }], ordenadas por ahorro.
 * Los textos se arman en la interfaz con src/textos/es-AR.js.
 */
export function calcularRecomendaciones(respuestas, totalActual) {
  const total = totalActual ?? calcularCategorias(respuestas).total;
  const candidatas = [];
  const agregar = (id, cambio) => candidatas.push({ id, ahorroKg: redondear(total - totalCon(respuestas, cambio)) });

  const mov = respuestas.movilidad;
  const medios = [mov?.ida?.medio, !mov?.idaYVuelta ? mov?.vuelta?.medio : null].filter(Boolean);
  const km = Number(mov?.distanciaKm) || 0;

  if (km > 0 && medios.some(esMotorizado)) {
    if (km <= KM_CAMINABLES) agregar('caminar', cambiarMedios('pie_bici'));
    if (medios.some((m) => m !== 'colectivo' && esMotorizado(m))) agregar('colectivo', cambiarMedios('colectivo'));
    const ida = mov.ida;
    if (ida.medio === 'auto' && (ida.ocupantes ?? 1) < OCUPANTES_AUTO_LLENO) {
      agregar('compartir_auto', (r) => {
        r.movilidad.ida.ocupantes = OCUPANTES_AUTO_LLENO;
        if (r.movilidad.vuelta?.medio === 'auto') r.movilidad.vuelta.ocupantes = OCUPANTES_AUTO_LLENO;
      });
    }
  }

  const comida = respuestas.alimentacion?.comida;
  if (comida === 'vacuna') agregar('carne_blanca', (r) => (r.alimentacion.comida = 'blanca'));
  if (comida === 'vacuna' || comida === 'blanca') agregar('vegetariano', (r) => (r.alimentacion.comida = 'vegetariana'));

  const bebidas = Array.from(respuestas.alimentacion?.bebidas ?? []);
  if (bebidas.includes('botella')) {
    agregar('vaso_reutilizable', (r) => {
      const nuevas = Array.from(r.alimentacion.bebidas).filter((b) => b !== 'botella');
      if (!nuevas.includes('reutilizable')) nuevas.push('reutilizable');
      r.alimentacion.bebidas = nuevas;
    });
  }

  if (respuestas.residuos === 'mismo_tacho' || respuestas.residuos === 'fuera') {
    agregar('separar', (r) => (r.residuos = 'separe'));
  }

  if (respuestas.compras === 'prenda' || respuestas.compras === 'varias') {
    agregar('compras', (r) => (r.compras = 'pequeno'));
  }

  return candidatas
    .filter((c) => c.ahorroKg > AHORRO_MINIMO)
    .sort((a, b) => b.ahorroKg - a.ahorroKg);
}
