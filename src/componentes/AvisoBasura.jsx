import { TEXTOS } from '../textos/es-AR.js';

/** Mensaje educativo: la basura tirada NO se suma como CO₂e. */
export default function AvisoBasura() {
  return (
    <aside className="aviso" aria-labelledby="aviso-basura-titulo">
      <h3 id="aviso-basura-titulo">{TEXTOS.residuos.avisoBasuraTitulo}</h3>
      <p>{TEXTOS.residuos.avisoBasura}</p>
    </aside>
  );
}
