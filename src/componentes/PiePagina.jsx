import { TEXTOS } from '../textos/es-AR.js';

export default function PiePagina() {
  return (
    <footer className="pie">
      <p>{TEXTOS.pie.creditos}</p>
      <p>{TEXTOS.pie.aviso}</p>
      <p>{TEXTOS.pie.datosMapa}</p>
    </footer>
  );
}
