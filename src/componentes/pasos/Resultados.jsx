import { TEXTOS } from '../../textos/es-AR.js';
import { calcularHuella } from '../../calculo/total.js';
import { formatearKg } from '../../calculo/formato.js';

const T = TEXTOS.resultados;

/** Versión provisoria (etapa 2). Gráficos y recomendaciones: etapa 3. */
export default function Resultados({ respuestas, dispatch, irAPaso }) {
  const huella = calcularHuella(respuestas);
  return (
    <>
      <p className="total">
        {T.total}
        <strong className="total__valor">{formatearKg(huella.total)}</strong>
      </p>
      <p className="ayuda">{T.provisorio}</p>
      <div className="navegacion">
        <button type="button" className="boton boton--secundario" onClick={() => irAPaso(1)}>
          {T.editar}
        </button>
        <button
          type="button"
          className="boton boton--primario"
          onClick={() => {
            dispatch({ type: 'reiniciar' });
            irAPaso(0);
          }}
        >
          {T.recalcular}
        </button>
      </div>
    </>
  );
}
