import { TEXTOS } from '../textos/es-AR.js';

/**
 * Isotipo de la UCP (public/ucp.png, 554 × 554 px). Para cambiarlo,
 * reemplazá ese archivo o actualizá RUTA_LOGO.
 */
const RUTA_LOGO = '/ucp.png';

export default function Encabezado() {
  return (
    <header className="encabezado">
      <div className="encabezado__interior">
        <img className="encabezado__logo" src={RUTA_LOGO} alt={TEXTOS.app.logoAlt} width="554" height="554" />
        <div>
          <p className="encabezado__texto">{TEXTOS.app.encabezado}</p>
          <h1 className="encabezado__titulo">{TEXTOS.app.titulo}</h1>
        </div>
      </div>
    </header>
  );
}
