import { useId } from 'react';
import { TEXTOS } from '../textos/es-AR.js';
import { MEDIOS } from '../data/opciones.js';
import { FACTORES } from '../data/factores.js';
import { LIMITES } from '../config/evento.js';
import { formatearDecimal } from '../calculo/formato.js';
import OpcionTarjeta from './OpcionTarjeta.jsx';

const T = TEXTOS.movilidad;

function detalleFactor(medio) {
  const f = FACTORES[medio.factor];
  const base = T.factor(formatearDecimal(f.valor, 1));
  if (f.valor === 0) return base;
  return `${base} ${f.porPasajero ? T.porPersona : T.porVehiculo}`;
}

/** Medio de transporte + ocupantes (si corresponde) para un tramo. */
export default function SelectorMedio({ tramo, leyenda, preguntaOcupantes, valor, dispatch }) {
  const id = useId();
  const medio = MEDIOS.find((m) => m.id === valor.medio);
  const maxOcupantes = medio?.ocupantesMax ?? LIMITES.ocupantesMax;

  return (
    <>
      <fieldset>
        <legend>{leyenda}</legend>
        <div className="opciones">
          {MEDIOS.map((m) => (
            <OpcionTarjeta
              key={m.id}
              name={`medio-${tramo}`}
              value={m.id}
              checked={valor.medio === m.id}
              onChange={() => dispatch({ type: 'medio', tramo, medio: m.id })}
              etiqueta={TEXTOS.opciones.medios[m.id]}
              detalle={detalleFactor(m)}
            />
          ))}
        </div>
      </fieldset>

      {medio?.divideOcupantes && (
        <div className="campo">
          <label htmlFor={`${id}-ocupantes`}>{preguntaOcupantes}</label>
          <p className="ayuda" id={`${id}-ocupantes-ayuda`}>
            {T.ocupantesAyuda}
          </p>
          <select
            id={`${id}-ocupantes`}
            value={valor.ocupantes}
            aria-describedby={`${id}-ocupantes-ayuda`}
            onChange={(e) => dispatch({ type: 'ocupantes', tramo, ocupantes: Number(e.target.value) })}
          >
            {Array.from({ length: maxOcupantes }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
