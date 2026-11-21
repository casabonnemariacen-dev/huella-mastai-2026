import { useEffect, useRef } from 'react';
import { TEXTOS } from '../textos/es-AR.js';
import { FACTORES } from '../data/factores.js';
import { NIVELES } from '../data/umbrales.js';
import { formatearDecimal, formatearKg } from '../calculo/formato.js';

const T = TEXTOS.metodologia;

/** Texto de los umbrales, generado desde src/data/umbrales.js. */
export function textoUmbrales() {
  const [bajo, medio] = NIVELES;
  return TEXTOS.resultados.umbralesExplicacion(formatearKg(bajo.hasta), formatearKg(medio.hasta));
}

/** Diálogo modal nativo (<dialog>): atrapa el foco y se cierra con Escape. */
export default function Metodologia({ abierto, onCerrar }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!abierto && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [abierto]);

  return (
    <dialog ref={ref} className="metodologia" aria-labelledby="metodologia-titulo" onClose={onCerrar} onCancel={onCerrar}>
      <div className="metodologia__cabecera">
        <h2 id="metodologia-titulo">{T.titulo}</h2>
        <button type="button" className="boton boton--secundario boton--chico" onClick={onCerrar}>
          {T.cerrar}
        </button>
      </div>
      <p>{T.intro}</p>

      <h3>{T.formulasTitulo}</h3>
      <ul>
        {T.formulas.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <h3>{T.tablaTitulo}</h3>
      <p className="ayuda">{T.estimadoExplicacion}</p>
      <div className="tabla-scroll">
        <table className="tabla-factores">
          <thead>
            <tr>
              <th scope="col">{T.columnas.factor}</th>
              <th scope="col">{T.columnas.valor}</th>
              <th scope="col">{T.columnas.fuente}</th>
              <th scope="col">{T.columnas.anio}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(FACTORES).map(([clave, f]) => (
              <tr key={clave}>
                <th scope="row">
                  {f.nombre}
                  {f.estimado && <span className="etiqueta-estimado">{T.estimado}</span>}
                </th>
                <td className="tabla-factores__valor">
                  {formatearDecimal(f.valor, 4)} {f.unidad}
                </td>
                <td>
                  {f.fuente.url ? (
                    <a href={f.fuente.url} target="_blank" rel="noopener noreferrer">
                      {f.fuente.nombre}
                    </a>
                  ) : (
                    f.fuente.nombre
                  )}
                  {f.nota && <p className="nota">{f.nota}</p>}
                </td>
                <td>{f.anio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>{T.nivelesTitulo}</h3>
      <p>{textoUmbrales()}</p>

      <h3>{T.limitacionesTitulo}</h3>
      <p>{T.limitaciones}</p>

      <button type="button" className="boton boton--primario boton--ancho" onClick={onCerrar}>
        {T.cerrar}
      </button>
    </dialog>
  );
}
