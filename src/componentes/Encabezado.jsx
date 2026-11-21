import { TEXTOS } from '../textos/es-AR.js';

/**
 * Logo: reemplazá public/logo-ucp-placeholder.svg por el archivo real
 * (por ejemplo public/logo-ucp.svg) y actualizá RUTA_LOGO.
 */
const RUTA_LOGO = '/logo-ucp-placeholder.svg';

export default function Encabezado() {
  return (
    <header className="encabezado">
      <div className="encabezado__interior">
        <img className="encabezado__logo" src={RUTA_LOGO} alt={TEXTOS.app.logoAlt} width="72" height="29" />
        <div>
          <p className="encabezado__texto">{TEXTOS.app.encabezado}</p>
          <h1 className="encabezado__titulo">{TEXTOS.app.titulo}</h1>
        </div>
      </div>
    </header>
  );
}
