import { normalizar, crearEstadoInicial, PASOS } from './respuestas.js';

const CLAVE = 'huella-mastai-2026';

/** Lee respuestas y paso de sessionStorage. Si no hay o falla, estado inicial. */
export function cargarSesion() {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE);
    if (!crudo) return { respuestas: crearEstadoInicial(), paso: 0 };
    const datos = JSON.parse(crudo);
    const paso = Number.isInteger(datos.paso) && datos.paso >= 0 && datos.paso < PASOS.length ? datos.paso : 0;
    return { respuestas: normalizar(datos.respuestas), paso };
  } catch {
    return { respuestas: crearEstadoInicial(), paso: 0 };
  }
}

export function guardarSesion(respuestas, paso) {
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify({ respuestas, paso }));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota): la app sigue funcionando.
  }
}
