import { EVENTO } from '../config/evento.js';
import { UNIDAD } from './formato.js';

/** Objeto exportable con respuestas y resultados (sin coordenadas exactas). */
export function armarExportacion(respuestas, huella, fecha = new Date()) {
  const m = respuestas.movilidad;
  return {
    evento: `${EVENTO.nombre} – ${EVENTO.edicion}`,
    fecha: fecha.toISOString(),
    unidad: UNIDAD,
    respuestas: {
      movilidad: {
        origen: m.origen?.texto ?? null,
        distanciaIdaKm: m.distanciaKm,
        fuenteDistancia: m.fuenteDistancia,
        ida: m.ida,
        idaYVuelta: m.idaYVuelta,
        vuelta: m.idaYVuelta ? null : m.vuelta,
      },
      alimentacion: respuestas.alimentacion,
      residuos: respuestas.residuos,
      compras: respuestas.compras,
    },
    resultados: {
      total: huella.total,
      porCategoria: huella.porCategoria,
      nivel: huella.nivel,
      equivalencias: huella.equivalencias,
      recomendaciones: huella.recomendaciones,
      avisoBasura: huella.avisoBasura,
    },
  };
}

/** Aplana un objeto a pares [ruta, valor]. */
function aplanar(obj, prefijo = '', filas = []) {
  if (obj === null || typeof obj !== 'object') {
    filas.push([prefijo, obj]);
    return filas;
  }
  if (Array.isArray(obj) && obj.every((v) => v === null || typeof v !== 'object')) {
    filas.push([prefijo, obj.join(' | ')]);
    return filas;
  }
  for (const [clave, valor] of Object.entries(obj)) {
    aplanar(valor, prefijo ? `${prefijo}.${clave}` : clave, filas);
  }
  return filas;
}

const celda = (v) => {
  let s;
  if (v === null || v === undefined) s = '';
  else if (typeof v === 'number') s = String(v).replace('.', ','); // decimal con coma (es-AR)
  else s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * CSV con separador ";" y decimales con coma (abre bien en planillas en
 * español). Incluye BOM para que se respeten los acentos.
 */
export function aCsv(datos) {
  const filas = [['campo', 'valor'], ...aplanar(datos)];
  return '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n') + '\r\n';
}
