import { TEXTOS } from '../textos/es-AR.js';

export default function BarraProgreso({ paso, total }) {
  const n = paso + 1;
  return (
    <div className="progreso">
      <div className="progreso__texto" aria-hidden="true">
        <span>{TEXTOS.progreso.paso(n, total)}</span>
        <span>{TEXTOS.progreso.nombres[paso]}</span>
      </div>
      <progress
        max={total}
        value={n}
        aria-label={TEXTOS.progreso.etiqueta}
        aria-valuetext={`${TEXTOS.progreso.paso(n, total)}: ${TEXTOS.progreso.nombres[paso]}`}
      />
    </div>
  );
}
