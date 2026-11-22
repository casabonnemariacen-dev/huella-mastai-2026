/**
 * Guardado anónimo en Supabase (ver supabase/README.md).
 *
 * Sin librerías: llamadas fetch a la API REST de Supabase con la clave
 * PÚBLICA. La tabla no es accesible desde la API; solo se ejecutan tres
 * funciones SECURITY DEFINER habilitadas para el rol anon:
 *   registrar_resultado(p jsonb)   guarda o actualiza el registro de esta visita
 *   borrar_resultado(p_id uuid)    botón "No guardar"
 *   resumen_publico()              cantidad y promedios (de la vista resumen_evento)
 *
 * Estas funciones nunca lanzan errores hacia la interfaz: si Supabase no está
 * configurado o falla, devuelven { ok: false } o null y la app sigue igual.
 */
import { SUPABASE, guardadoHabilitado } from '../config/evento.js';

/** Encabezados para la API. Las claves anteriores (JWT) van también como Bearer. */
export function encabezados(clave) {
  const h = { apikey: clave, 'Content-Type': 'application/json', Accept: 'application/json' };
  if (clave.startsWith('eyJ')) h.Authorization = `Bearer ${clave}`;
  return h;
}

async function llamarFuncion(nombre, cuerpo, config) {
  if (!guardadoHabilitado(config)) return { ok: false, motivo: 'sin-configuracion' };
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), config.tiempoLimiteMs);
  try {
    const res = await fetch(`${config.url}/rest/v1/rpc/${nombre}`, {
      method: 'POST',
      headers: encabezados(config.clavePublica),
      body: JSON.stringify(cuerpo),
      signal: control.signal,
    });
    if (!res.ok) return { ok: false, motivo: `http-${res.status}` };
    const texto = await res.text();
    return { ok: true, datos: texto ? JSON.parse(texto) : null };
  } catch (e) {
    return { ok: false, motivo: e?.name === 'AbortError' ? 'tiempo-agotado' : 'red' };
  } finally {
    clearTimeout(temporizador);
  }
}

/** Guarda (o actualiza, si ya existe el id) el registro anónimo. */
export async function guardarResultado(registro, config = SUPABASE) {
  if (!registro) return { ok: false, motivo: 'registro-incompleto' };
  const r = await llamarFuncion('registrar_resultado', { p: registro }, config);
  return { ok: r.ok, motivo: r.motivo };
}

/** Borra el registro de esta visita (botón "No guardar"). */
export async function borrarResultado(id, config = SUPABASE) {
  const r = await llamarFuncion('borrar_resultado', { p_id: id }, config);
  return { ok: r.ok, motivo: r.motivo };
}

/** Cantidad de visitas y promedios, o null si no hay datos disponibles. */
export async function obtenerResumen(config = SUPABASE) {
  const r = await llamarFuncion('resumen_publico', {}, config);
  return r.ok && r.datos && typeof r.datos === 'object' ? r.datos : null;
}
