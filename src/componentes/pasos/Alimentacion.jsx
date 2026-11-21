import { useId } from 'react';
import { TEXTOS } from '../../textos/es-AR.js';
import { COMIDAS, BEBIDAS } from '../../data/opciones.js';
import { FACTORES } from '../../data/factores.js';
import { LIMITES } from '../../config/evento.js';
import { calcularAlimentacion } from '../../calculo/alimentacion.js';
import OpcionTarjeta from '../OpcionTarjeta.jsx';
import Subtotal from '../Subtotal.jsx';

const T = TEXTOS.alimentacion;

export default function Alimentacion({ respuestas, dispatch }) {
  const id = useId();
  const a = respuestas.alimentacion;
  const subtotal = calcularAlimentacion(a).total;

  return (
    <>
      <fieldset>
        <legend>{T.comidaPregunta}</legend>
        <div className="opciones">
          {COMIDAS.map((c) => (
            <OpcionTarjeta
              key={c.id}
              name="comida"
              value={c.id}
              checked={a.comida === c.id}
              onChange={() => dispatch({ type: 'comida', valor: c.id })}
              etiqueta={TEXTOS.opciones.comidas[c.id]}
              detalle={c.factor ? T.porcion(FACTORES[c.factor].valor) : null}
            />
          ))}
        </div>
      </fieldset>

      <fieldset aria-describedby={`${id}-bebida-ayuda`}>
        <legend>{T.bebidaPregunta}</legend>
        <p className="ayuda" id={`${id}-bebida-ayuda`}>
          {T.bebidaAyuda}
        </p>
        <div className="opciones">
          {BEBIDAS.map((b) => (
            <OpcionTarjeta
              key={b.id}
              tipo="checkbox"
              name="bebidas"
              value={b.id}
              checked={a.bebidas.includes(b.id)}
              onChange={() => dispatch({ type: 'bebida', id: b.id })}
              etiqueta={TEXTOS.opciones.bebidas[b.id]}
              detalle={b.factor ? T.porBebida(FACTORES[b.factor].valor, b.porVaso) : null}
            />
          ))}
        </div>
      </fieldset>

      {a.bebidas.includes('alcohol') && (
        <div className="campo">
          <label htmlFor={`${id}-vasos`}>{T.vasos}</label>
          <select
            id={`${id}-vasos`}
            value={a.vasosCerveza}
            onChange={(e) => dispatch({ type: 'vasos', valor: Number(e.target.value) })}
          >
            {Array.from({ length: LIMITES.vasosMax }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {T.vasosOpcion(n, LIMITES.vasosMax)}
              </option>
            ))}
          </select>
        </div>
      )}

      <Subtotal>{T.subtotal(subtotal)}</Subtotal>
    </>
  );
}
