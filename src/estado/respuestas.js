import { MEDIOS, buscar } from '../data/opciones.js';
import { LIMITES } from '../config/evento.js';
import { esMotorizado } from '../calculo/movilidad.js';
import { numeroSeguro, enteroEnRango } from '../calculo/util.js';

export const PASOS = ['bienvenida', 'movilidad', 'alimentacion', 'residuos', 'compras', 'resultados'];

export const estadoInicial = Object.freeze({
  movilidad: {
    origen: null, // { texto, lat, lon }
    distanciaKm: 0, // solo ida
    fuenteDistancia: 'manual', // 'ruta' | 'estimada' | 'manual'
    ida: { medio: null, ocupantes: 1 },
    idaYVuelta: true,
    vuelta: { medio: null, ocupantes: 1 },
  },
  alimentacion: { comida: null, bebidas: [], vasosCerveza: 1 },
  residuos: null,
  compras: null,
});

export const crearEstadoInicial = () => structuredClone(estadoInicial);

function ocupantesValidos(medio, ocupantes) {
  const max = buscar(MEDIOS, medio)?.ocupantesMax ?? LIMITES.ocupantesMax;
  return enteroEnRango(ocupantes, 1, max);
}

/** Alterna una bebida respetando que "ninguna" es excluyente. */
export function alternarBebida(bebidas, id) {
  const actuales = Array.from(bebidas ?? []);
  if (actuales.includes(id)) return actuales.filter((b) => b !== id);
  if (id === 'ninguna') return ['ninguna'];
  return [...actuales.filter((b) => b !== 'ninguna'), id];
}

export function reducer(estado, accion) {
  const m = estado.movilidad;
  switch (accion.type) {
    case 'medio': {
      // accion.tramo: 'ida' | 'vuelta'
      const tramo = m[accion.tramo];
      const nuevo = { medio: accion.medio, ocupantes: ocupantesValidos(accion.medio, tramo.ocupantes) };
      return { ...estado, movilidad: { ...m, [accion.tramo]: nuevo } };
    }
    case 'ocupantes': {
      const tramo = m[accion.tramo];
      return {
        ...estado,
        movilidad: { ...m, [accion.tramo]: { ...tramo, ocupantes: ocupantesValidos(tramo.medio, accion.ocupantes) } },
      };
    }
    case 'idaYVuelta':
      return { ...estado, movilidad: { ...m, idaYVuelta: Boolean(accion.valor) } };
    case 'distancia':
      return {
        ...estado,
        movilidad: {
          ...m,
          distanciaKm: Math.min(numeroSeguro(accion.km), LIMITES.distanciaMaxKm),
          fuenteDistancia: accion.fuente ?? 'manual',
        },
      };
    case 'origen':
      return { ...estado, movilidad: { ...m, origen: accion.origen } };
    case 'comida':
      return { ...estado, alimentacion: { ...estado.alimentacion, comida: accion.valor } };
    case 'bebida':
      return {
        ...estado,
        alimentacion: { ...estado.alimentacion, bebidas: alternarBebida(estado.alimentacion.bebidas, accion.id) },
      };
    case 'vasos':
      return {
        ...estado,
        alimentacion: { ...estado.alimentacion, vasosCerveza: enteroEnRango(accion.valor, 1, LIMITES.vasosMax) },
      };
    case 'residuos':
      return { ...estado, residuos: accion.valor };
    case 'compras':
      return { ...estado, compras: accion.valor };
    case 'reiniciar':
      return crearEstadoInicial();
    case 'cargar':
      return normalizar(accion.estado);
    default:
      return estado;
  }
}

/** Asegura la forma del estado (por ejemplo, al leer de sessionStorage). */
export function normalizar(datos) {
  const base = crearEstadoInicial();
  if (!datos || typeof datos !== 'object') return base;
  const m = { ...base.movilidad, ...(datos.movilidad ?? {}) };
  m.ida = { ...base.movilidad.ida, ...(m.ida ?? {}) };
  m.vuelta = { ...base.movilidad.vuelta, ...(m.vuelta ?? {}) };
  m.distanciaKm = Math.min(numeroSeguro(m.distanciaKm), LIMITES.distanciaMaxKm);
  const a = { ...base.alimentacion, ...(datos.alimentacion ?? {}) };
  a.bebidas = Array.isArray(a.bebidas) ? a.bebidas : [];
  return { movilidad: m, alimentacion: a, residuos: datos.residuos ?? null, compras: datos.compras ?? null };
}

/** Errores del paso (ids; los textos están en es-AR.js). Paso: índice en PASOS. */
export function validarPaso(paso, r) {
  const errores = [];
  switch (PASOS[paso]) {
    case 'movilidad': {
      const m = r.movilidad;
      if (!m.ida.medio) errores.push('sinMedio');
      if (!m.idaYVuelta && !m.vuelta.medio) errores.push('sinMedioVuelta');
      const motorizado = esMotorizado(m.ida.medio) || (!m.idaYVuelta && esMotorizado(m.vuelta.medio));
      if (motorizado && !(numeroSeguro(m.distanciaKm) > 0)) errores.push('distanciaCero');
      break;
    }
    case 'alimentacion':
      if (!r.alimentacion.comida) errores.push('sinComida');
      if (!r.alimentacion.bebidas.length) errores.push('sinBebida');
      break;
    case 'residuos':
      if (!r.residuos) errores.push('sinResiduos');
      break;
    case 'compras':
      if (!r.compras) errores.push('sinCompras');
      break;
    default:
  }
  return errores;
}
