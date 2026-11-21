import { TEXTOS } from '../../textos/es-AR.js';

const T = TEXTOS.bienvenida;

export default function Bienvenida() {
  return (
    <>
      <p>{T.queEs}</p>
      <p>{T.alcance}</p>
      <p className="destacado">
        {T.duracion}
        <br />
        {T.aproximados}
      </p>
    </>
  );
}
