/**
 * Limitador de solicitudes: garantiza al menos `intervaloMs` entre el inicio
 * de dos tareas (políticas de uso de Nominatim, Photon y OSRM: 1 por segundo).
 * Las tareas se encolan en orden. Si la señal de una tarea se aborta mientras
 * espera, se descarta sin consumir turno.
 */
export function crearLimitador(intervaloMs, ahora = () => Date.now()) {
  let ultimo = -Infinity;
  let cola = Promise.resolve();

  return function ejecutar(tarea, signal) {
    const resultado = cola.then(async () => {
      if (signal?.aborted) throw new DOMException('Cancelada', 'AbortError');
      const espera = ultimo + intervaloMs - ahora();
      if (espera > 0) await new Promise((r) => setTimeout(r, espera));
      if (signal?.aborted) throw new DOMException('Cancelada', 'AbortError');
      ultimo = ahora();
      return tarea();
    });
    cola = resultado.catch(() => {});
    return resultado;
  };
}
