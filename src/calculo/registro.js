/**
 * Registro anónimo que se guarda en Supabase (función pura).
 * Debe coincidir con lo que acepta registrar_resultado() en
 * supabase/migrations/002_acceso_solo_por_funciones.sql:
 *   - sin origen, coordenadas ni ningún dato personal;
 *   - distancia redondeada a 1 km;
 *   - medio_vuelta solo si no es "ida y vuelta";
 *   - vasos solo si hay bebidas alcohólicas.
 */
import { MEDIOS, buscar } from '../data/opciones.js';
import { SUPABASE } from '../config/evento.js';

const r3 = (n) => Math.round(Number(n) * 1000) / 1000;

/**
 * Devuelve el registro, o null si las respuestas están incompletas.
 * `token` es el secreto de esta visita (ver src/estado/registroVisita.js):
 * la base guarda solo su hash y lo exige para actualizar o borrar.
 */
export function armarRegistro(respuestas, huella, id, token, version = SUPABASE.versionRegistro) {
  const m = respuestas?.movilidad;
  const a = respuestas?.alimentacion;
  if (!id || !token || !m?.ida?.medio || !a?.comida || !a?.bebidas?.length || !respuestas.residuos || !respuestas.compras) {
    return null;
  }
  const vuelta = m.idaYVuelta ? null : m.vuelta?.medio ? m.vuelta : null;
  if (!m.idaYVuelta && !vuelta) return null;

  const ocupantes = (tramo) => (buscar(MEDIOS, tramo.medio)?.divideOcupantes ? tramo.ocupantes : null);
  const bebidas = [...new Set(a.bebidas)];
  const c = huella.porCategoria;
  const partes = {
    movilidad: r3(c.movilidad),
    alimentacion: r3(c.alimentacion),
    residuos_kg: r3(c.residuos),
    compras_kg: r3(c.compras),
  };

  return {
    id,
    token,
    version_app: version,
    // Suma de las partes ya redondeadas: cumple la regla total = suma de la base.
    total: r3(partes.movilidad + partes.alimentacion + partes.residuos_kg + partes.compras_kg),
    ...partes,
    nivel: huella.nivel,
    medio_ida: m.ida.medio,
    ocupantes_ida: ocupantes(m.ida),
    ida_y_vuelta: Boolean(m.idaYVuelta),
    medio_vuelta: vuelta ? vuelta.medio : null,
    ocupantes_vuelta: vuelta ? ocupantes(vuelta) : null,
    distancia_km: Math.round(Number(m.distanciaKm) || 0),
    fuente_distancia: m.fuenteDistancia ?? 'manual',
    comida: a.comida,
    bebidas,
    vasos: bebidas.includes('alcohol') ? a.vasosCerveza : null,
    residuos: respuestas.residuos,
    compras: respuestas.compras,
  };
}
