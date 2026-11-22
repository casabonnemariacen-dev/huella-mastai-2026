/**
 * Identidad anónima de la visita para el guardado en Supabase.
 * - idRegistro: UUID v4 al azar. Mientras no cambie, editar respuestas
 *   actualiza el mismo registro (no lo duplica).
 * - token: secreto de 256 bits al azar (64 caracteres hex). Solo lo conoce
 *   este navegador; la base guarda únicamente su hash SHA-256. Hace falta
 *   id + token para actualizar o borrar el registro.
 * - noGuardar: la persona tocó "No guardar".
 * Se guarda en sessionStorage (se pierde al cerrar la pestaña) y se renueva
 * con "Volver a calcular", porque otra persona puede usar el mismo celular.
 */
const CLAVE = 'huella-mastai-2026-registro';

function nuevoId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  // Respaldo para navegadores viejos: UUID v4 con getRandomValues.
  const b = globalThis.crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function nuevoToken() {
  const b = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

const TOKEN_VALIDO = /^[0-9a-f]{64}$/;

const nuevoEstado = () => ({ idRegistro: nuevoId(), token: nuevoToken(), noGuardar: false });

function escribir(estado) {
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    // Sin almacenamiento: el id dura mientras la página esté abierta.
  }
  return estado;
}

export function leerRegistroVisita() {
  try {
    const datos = JSON.parse(window.sessionStorage.getItem(CLAVE));
    if (datos && typeof datos.idRegistro === 'string' && TOKEN_VALIDO.test(datos.token ?? '')) {
      return { idRegistro: datos.idRegistro, token: datos.token, noGuardar: Boolean(datos.noGuardar) };
    }
  } catch {
    // datos corruptos o sin acceso: se crea uno nuevo
  }
  return escribir(nuevoEstado());
}

export const marcarNoGuardar = () => escribir({ ...leerRegistroVisita(), noGuardar: true });

/** "Volver a calcular": nueva visita, nuevo id. */
export const renovarRegistroVisita = () => escribir(nuevoEstado());
