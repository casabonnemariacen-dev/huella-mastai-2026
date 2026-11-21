import { TEXTOS } from '../textos/es-AR.js';
import { segmentosAnillo, barrasCategorias } from '../calculo/grafico.js';
import { formatearKg, formatearDecimal, UNIDAD } from '../calculo/formato.js';

const T = TEXTOS.resultados;
const RADIO = 40;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const HUECO = 1.6; // separación entre segmentos (unidades del viewBox ≈ 2 px)

const porcentaje = (p) => `${formatearDecimal(p * 100, 1)} %`;

/**
 * Anillo + barras por categoría, con leyenda (los valores van en texto, el
 * color solo acompaña) y tabla alternativa. Con total 0 no se dibuja nada.
 */
export default function GraficosCategorias({ porCategoria }) {
  const segmentos = segmentosAnillo(porCategoria);
  if (!segmentos.length) return <p className="destacado">{T.sinEmisiones}</p>;

  const barras = barrasCategorias(porCategoria).filter((b) => b.valor > 0);
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  const resumen = segmentos.map((s) => `${T.categorias[s.id]} ${formatearKg(s.valor)} (${porcentaje(s.proporcion)})`).join('; ');
  const hueco = segmentos.length > 1 ? HUECO : 0;

  return (
    <div className="graficos">
      <figure className="anillo">
        <svg viewBox="0 0 100 100" role="img" aria-label={T.graficoAnillo(resumen)}>
          <g transform="rotate(-90 50 50)">
            {segmentos.map((s) => {
              const largo = Math.max(s.proporcion * CIRCUNFERENCIA - hueco, 0.01);
              return (
                <circle
                  key={s.id}
                  cx="50"
                  cy="50"
                  r={RADIO}
                  fill="none"
                  stroke={`var(--cat-${s.id})`}
                  strokeWidth="14"
                  strokeDasharray={`${largo} ${CIRCUNFERENCIA - largo}`}
                  strokeDashoffset={-(s.inicio * CIRCUNFERENCIA + hueco / 2)}
                >
                  <title>{`${T.categorias[s.id]}: ${formatearKg(s.valor)} (${porcentaje(s.proporcion)})`}</title>
                </circle>
              );
            })}
          </g>
          <text x="50" y="47" textAnchor="middle" className="anillo__total">
            {formatearDecimal(total, 2)}
          </text>
          <text x="50" y="60" textAnchor="middle" className="anillo__unidad">
            {UNIDAD}
          </text>
        </svg>
      </figure>

      <ul className="barras" aria-label={T.graficoBarras}>
        {barras.map((b) => (
          <li key={b.id} className="barras__fila">
            <span className="barras__nombre">
              <span className="muestra" style={{ background: `var(--cat-${b.id})` }} aria-hidden="true" />
              {T.categorias[b.id]}
            </span>
            <span className="barras__valor">{formatearKg(b.valor)}</span>
            <span className="barras__pista" aria-hidden="true">
              <span
                className="barras__barra"
                style={{ width: `${b.relativo * 100}%`, background: `var(--cat-${b.id})` }}
                title={`${T.categorias[b.id]}: ${formatearKg(b.valor)}`}
              />
            </span>
          </li>
        ))}
      </ul>

      <details className="tabla-alternativa">
        <summary>{T.verTabla}</summary>
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{T.tablaCategoria}</th>
                <th scope="col">{T.tablaValor}</th>
                <th scope="col">{T.tablaPorcentaje}</th>
              </tr>
            </thead>
            <tbody>
              {barrasCategorias(porCategoria).map((b) => (
                <tr key={b.id}>
                  <th scope="row">{T.categorias[b.id]}</th>
                  <td>{formatearKg(b.valor)}</td>
                  <td>{porcentaje(total > 0 ? b.valor / total : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
