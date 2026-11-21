import { TEXTOS } from '../textos/es-AR.js';

/** Lista de errores del paso, anunciada por lectores de pantalla. */
export default function Errores({ errores, ref }) {
  if (!errores.length) return null;
  return (
    <div className="errores" role="alert" ref={ref} tabIndex={-1}>
      <p>{TEXTOS.errores.titulo}</p>
      <ul>
        {errores.map((id) => (
          <li key={id}>{TEXTOS.errores[id]}</li>
        ))}
      </ul>
    </div>
  );
}
