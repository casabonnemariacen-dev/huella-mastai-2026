import { TEXTOS } from '../../textos/es-AR.js';
import { RESIDUOS } from '../../data/opciones.js';
import { calcularResiduos } from '../../calculo/residuos.js';
import OpcionTarjeta from '../OpcionTarjeta.jsx';
import Subtotal from '../Subtotal.jsx';
import AvisoBasura from '../AvisoBasura.jsx';

const T = TEXTOS.residuos;

export default function Residuos({ respuestas, dispatch }) {
  const { total, avisoBasura } = calcularResiduos(respuestas.residuos);

  return (
    <>
      <p className="ayuda">{T.ayuda}</p>
      <fieldset>
        <legend>{T.leyenda}</legend>
        <div className="opciones">
          {RESIDUOS.map((r) => (
            <OpcionTarjeta
              key={r.id}
              name="residuos"
              value={r.id}
              checked={respuestas.residuos === r.id}
              onChange={() => dispatch({ type: 'residuos', valor: r.id })}
              etiqueta={TEXTOS.opciones.residuos[r.id]}
            />
          ))}
        </div>
      </fieldset>
      {avisoBasura && <AvisoBasura />}
      <Subtotal>{T.subtotal(total)}</Subtotal>
    </>
  );
}
