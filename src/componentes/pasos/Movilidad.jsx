import { TEXTOS } from '../../textos/es-AR.js';
import { calcularMovilidad } from '../../calculo/movilidad.js';
import SelectorMedio from '../SelectorMedio.jsx';
import SelectorDistancia from '../SelectorDistancia.jsx';
import Subtotal from '../Subtotal.jsx';

const T = TEXTOS.movilidad;

export default function Movilidad({ respuestas, dispatch }) {
  const m = respuestas.movilidad;
  const subtotal = calcularMovilidad(m).total;

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

      <p className="ayuda">{T.destino}</p>
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
