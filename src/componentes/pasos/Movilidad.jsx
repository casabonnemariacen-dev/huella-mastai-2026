import { lazy, Suspense, useRef, useState } from 'react';
import { TEXTOS } from '../../textos/es-AR.js';
import { EVENTO } from '../../config/evento.js';
import { calcularMovilidad } from '../../calculo/movilidad.js';
import { formatearDecimal } from '../../calculo/formato.js';
import { calcularRuta, distanciaEstimadaKm, rutaEnCache } from '../../servicios/rutas.js';
import SelectorMedio from '../SelectorMedio.jsx';
import SelectorDistancia from '../SelectorDistancia.jsx';
import BuscadorDireccion from '../BuscadorDireccion.jsx';
import Subtotal from '../Subtotal.jsx';

const Mapa = lazy(() => import('../Mapa.jsx'));
const T = TEXTOS.movilidad;
const SEDE = EVENTO.sede;

export default function Movilidad({ respuestas, dispatch }) {
  const m = respuestas.movilidad;
  const subtotal = calcularMovilidad(m).total;
  const [ruta, setRuta] = useState(() => ({
    estado: 'inactivo',
    geometria: m.origen ? (rutaEnCache(m.origen, SEDE)?.geometria ?? null) : null,
  }));
  const controlRef = useRef(null);

  async function elegirOrigen(origen) {
    dispatch({ type: 'origen', origen });
    controlRef.current?.abort();
    const control = new AbortController();
    controlRef.current = control;
    setRuta({ estado: 'cargando', geometria: null });
    try {
      const r = await calcularRuta(origen, SEDE, control.signal);
      dispatch({ type: 'distancia', km: Math.round(r.km * 10) / 10, fuente: 'ruta' });
      setRuta({ estado: 'ok', geometria: r.geometria });
    } catch {
      if (control.signal.aborted) return;
      const km = Math.round(distanciaEstimadaKm(origen, SEDE) * 10) / 10;
      dispatch({ type: 'distancia', km, fuente: 'estimada' });
      setRuta({ estado: 'error', geometria: null });
    }
  }

  function borrarOrigen() {
    controlRef.current?.abort();
    dispatch({ type: 'origen', origen: null });
    setRuta({ estado: 'inactivo', geometria: null });
  }

  let mensajeDistancia = '';
  if (ruta.estado === 'cargando') mensajeDistancia = T.calculandoRuta;
  else if (m.origen && m.fuenteDistancia === 'ruta') mensajeDistancia = T.distanciaRuta(formatearDecimal(m.distanciaKm, 1));
  else if (m.origen && m.fuenteDistancia === 'estimada') mensajeDistancia = T.distanciaEstimada(formatearDecimal(m.distanciaKm, 1));

  return (
    <>
      <p className="ayuda">{T.ayuda}</p>
      <SelectorMedio
        tramo="ida"
        leyenda={T.leyendaMedio}
        preguntaOcupantes={T.ocupantes}
        valor={m.ida}
        dispatch={dispatch}
      />

      <section aria-labelledby="titulo-origen">
        <h3 id="titulo-origen">{T.origenTitulo}</h3>
        <BuscadorDireccion origen={m.origen} onElegir={elegirOrigen} onBorrar={borrarOrigen} />
        <p className="ayuda">{T.destino}</p>
        {m.origen && (
          <Suspense fallback={<div className="mapa mapa--cargando" aria-hidden="true" />}>
            <Mapa origen={m.origen} destino={SEDE} geometria={ruta.geometria} />
          </Suspense>
        )}
        <p className="ayuda" role="status" aria-live="polite">
          {mensajeDistancia}
        </p>
      </section>

      <SelectorDistancia km={m.distanciaKm} onCambiar={(km) => dispatch({ type: 'distancia', km, fuente: 'manual' })} />

      <div className="campo">
        <label className="interruptor">
          <input
            type="checkbox"
            role="switch"
            checked={m.idaYVuelta}
            aria-describedby="ayuda-ida-vuelta"
            onChange={(e) => dispatch({ type: 'idaYVuelta', valor: e.target.checked })}
          />
          {T.idaYVuelta}
        </label>
        <p className="ayuda" id="ayuda-ida-vuelta">
          {T.idaYVueltaAyuda}
        </p>
      </div>

      {!m.idaYVuelta && (
        <section aria-labelledby="titulo-vuelta">
          <h3 id="titulo-vuelta">{T.vueltaTitulo}</h3>
          <SelectorMedio
            tramo="vuelta"
            leyenda={T.leyendaMedioVuelta}
            preguntaOcupantes={T.ocupantesVuelta}
            valor={m.vuelta}
            dispatch={dispatch}
          />
        </section>
      )}

      <Subtotal>{T.subtotal(subtotal)}</Subtotal>
    </>
  );
}
