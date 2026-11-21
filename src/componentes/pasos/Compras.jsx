import { TEXTOS } from '../../textos/es-AR.js';
import { COMPRAS } from '../../data/opciones.js';
import { calcularCompras } from '../../calculo/compras.js';
import { formatearKg } from '../../calculo/formato.js';
import OpcionTarjeta from '../OpcionTarjeta.jsx';
import Subtotal from '../Subtotal.jsx';

const T = TEXTOS.compras;

export default function Compras({ respuestas, dispatch }) {
  return (
    <>
      <p className="ayuda">{T.ayuda}</p>
      <fieldset>
        <legend>{T.leyenda}</legend>
        <div className="opciones">
          {COMPRAS.map((c) => (
            <OpcionTarjeta
              key={c.id}
              name="compras"
              value={c.id}
              checked={respuestas.compras === c.id}
              onChange={() => dispatch({ type: 'compras', valor: c.id })}
              etiqueta={TEXTOS.opciones.compras[c.id]}
              detalle={c.componentes.length ? formatearKg(calcularCompras(c.id)) : null}
            />
          ))}
        </div>
      </fieldset>
      <Subtotal>{T.subtotal(calcularCompras(respuestas.compras))}</Subtotal>
    </>
  );
}
