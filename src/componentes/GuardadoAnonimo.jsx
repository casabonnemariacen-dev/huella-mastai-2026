import { useEffect, useMemo, useRef, useState } from 'react';
import { TEXTOS } from '../textos/es-AR.js';
import { SUPABASE, guardadoHabilitado } from '../config/evento.js';
import { armarRegistro } from '../calculo/registro.js';
import { compararConPromedio } from '../calculo/comparacion.js';
import { formatearKg, formatearDecimal } from '../calculo/formato.js';
import { guardarResultado, borrarResultado, obtenerResumen } from '../servicios/almacenamiento.js';
import { leerRegistroVisita, marcarNoGuardar } from '../estado/registroVisita.js';

const T = TEXTOS.guardado;

/** Barras "tu huella" y "promedio" (el texto dice lo mismo: el color no es imprescindible). */
function Comparacion({ total, comparacion }) {
  const maximo = Math.max(total, comparacion.promedio);
  const filas = [
    { id: 'tu', nombre: T.tuHuella, valor: total, color: 'var(--acento)' },
    { id: 'promedio', nombre: T.promedio, valor: comparacion.promedio, color: 'var(--texto-suave)' },
  ];
  const pct = formatearDecimal(Math.abs(comparacion.diferenciaPct), 0);
  const frase = comparacion.sentido === 'similar' ? T.similar : T[comparacion.sentido](pct);

  return (
    <section aria-labelledby="titulo-comparacion" className="comparacion">
      <h3 id="titulo-comparacion">{T.comparacionTitulo}</h3>
      <p className="comparacion__frase">{frase}</p>
      <ul className="barras">
        {filas.map((f) => (
          <li key={f.id} className="barras__fila">
            <span className="barras__nombre">{f.nombre}</span>
            <span className="barras__valor">{formatearKg(f.valor)}</span>
            <span className="barras__pista" aria-hidden="true">
              {f.valor > 0 && (
                <span className="barras__barra" style={{ width: `${(f.valor / maximo) * 100}%`, background: f.color }} />
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="ayuda">{T.visitas(comparacion.cantidad)}</p>
    </section>
  );
}

/**
 * Guarda el resultado de forma anónima en Supabase y muestra la comparación
 * con el promedio. Si Supabase no está configurado, no muestra nada.
 */
export default function GuardadoAnonimo({ respuestas, huella, config = SUPABASE }) {
  const habilitado = guardadoHabilitado(config);
  const [visita, setVisita] = useState(leerRegistroVisita);
  const [estado, setEstado] = useState('inactivo'); // guardado | error | borrando | no_guardado | error_borrar
  const [resumen, setResumen] = useState(null);
  const guardadoEnCurso = useRef(null);

  // Clave estable del registro: solo cambia si cambian las respuestas o el total.
  const clave = useMemo(
    () => JSON.stringify(visita.noGuardar ? null : armarRegistro(respuestas, huella, visita.idRegistro)),
    [respuestas, huella, visita],
  );

  useEffect(() => {
    if (!habilitado) return undefined;
    let vigente = true;
    const temporizador = setTimeout(async () => {
      const registro = JSON.parse(clave);
      if (registro) {
        guardadoEnCurso.current = guardarResultado(registro, config);
        const r = await guardadoEnCurso.current;
        if (!vigente) return;
        setEstado(r.ok ? 'guardado' : 'error');
      }
      const datos = await obtenerResumen(config);
      if (vigente) setResumen(datos);
    }, config.esperaGuardadoMs);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [clave, config, habilitado]);

  if (!habilitado) return null;

  async function noGuardar() {
    const nueva = marcarNoGuardar();
    setVisita(nueva);
    setEstado('borrando');
    await guardadoEnCurso.current; // si había un guardado en curso, se borra después
    const r = await borrarResultado(nueva.idRegistro, config);
    setEstado(r.ok ? 'no_guardado' : 'error_borrar');
    setResumen(await obtenerResumen(config));
  }

  const comparacion = compararConPromedio(huella.total, resumen, config.minimoParaPromedio);

  return (
    <>
      {comparacion?.estado === 'comparacion' && <Comparacion total={huella.total} comparacion={comparacion} />}
      {comparacion?.estado === 'pocos' && <p className="ayuda">{T.pocos(comparacion.cantidad, comparacion.minimo)}</p>}

      <div className="guardado" role="status" aria-live="polite">
        {!visita.noGuardar && estado !== 'error' && (
          <p>
            {T.aviso}{' '}
            <button type="button" className="enlace" onClick={noGuardar}>
              {T.noGuardar}
            </button>
          </p>
        )}
        {estado === 'error' && <p>{T.errorGuardar}</p>}
        {estado === 'borrando' && <p>{T.borrando}</p>}
        {estado === 'no_guardado' && <p>{T.noGuardado}</p>}
        {estado === 'error_borrar' && <p>{T.errorBorrar}</p>}
      </div>
    </>
  );
}
