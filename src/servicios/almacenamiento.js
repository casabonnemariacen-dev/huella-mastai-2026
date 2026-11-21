/**
 * FASE 2 – Guardado anónimo de resultados (NO implementado todavía).
 *
 * Contrato previsto (ver netlify/functions/README.md):
 *   guardarResultadoAnonimo(resultado) → POST /.netlify/functions/resultados
 *     Cuerpo: { total, porCategoria, nivel, version } sin datos personales,
 *     sin origen ni coordenadas.
 *   obtenerPromedio() → GET /.netlify/functions/promedio
 *     Respuesta: { cantidad, promedioKg, porCategoria }
 *
 * Mientras FASE2_HABILITADA sea false, estas funciones no hacen nada.
 */
import { FASE2_HABILITADA } from '../config/evento.js';

export async function guardarResultadoAnonimo(resultado) {
  if (!FASE2_HABILITADA) return { guardado: false };
  const res = await fetch('/.netlify/functions/resultados', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      total: resultado.total,
      porCategoria: resultado.porCategoria,
      nivel: resultado.nivel,
      version: 1,
    }),
  });
  return { guardado: res.ok };
}

export async function obtenerPromedio() {
  if (!FASE2_HABILITADA) return null;
  const res = await fetch('/.netlify/functions/promedio');
  return res.ok ? res.json() : null;
}
