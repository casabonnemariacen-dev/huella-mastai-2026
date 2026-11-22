import { TEXTOS } from '../textos/es-AR.js';

/**
 * Logo de la UCP (public/logo-ucp.jpg, 800 × 565 px). Para cambiarlo,
 * reemplazá ese archivo o actualizá RUTA_LOGO. El recorte de los márgenes
 * blancos se hace con CSS (.encabezado__logo en src/estilos/global.css).
 */
const RUTA_LOGO = '/logo-ucp.jpg';

export default function Encabezado() {
  return (
    <header className="encabezado">
      <div className="encabezado__interior">
        <img className="encabezado__logo" src={RUTA_LOGO} alt={TEXTOS.app.logoAlt} width="800" height="565" />
        <div>
          <p className="encabezado__texto">{TEXTOS.app.encabezado}</p>
          <h1 className="encabezado__titulo">{TEXTOS.app.titulo}</h1>
        </div>
      </div>
    </header>
  );
}
