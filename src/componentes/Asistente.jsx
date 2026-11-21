import { useEffect, useRef, useState } from 'react';
import { TEXTOS } from '../textos/es-AR.js';
import { PASOS, validarPaso } from '../estado/respuestas.js';
import BarraProgreso from './BarraProgreso.jsx';
import Errores from './Errores.jsx';
import Bienvenida from './pasos/Bienvenida.jsx';
import Movilidad from './pasos/Movilidad.jsx';
import Alimentacion from './pasos/Alimentacion.jsx';
import Residuos from './pasos/Residuos.jsx';
import Compras from './pasos/Compras.jsx';
import Resultados from './pasos/Resultados.jsx';

const COMPONENTES = { bienvenida: Bienvenida, movilidad: Movilidad, alimentacion: Alimentacion, residuos: Residuos, compras: Compras, resultados: Resultados };

const ULTIMO = PASOS.length - 1;
const N = TEXTOS.navegacion;

export default function Asistente({ respuestas, dispatch, paso, irAPaso }) {
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const tituloRef = useRef(null);
  const erroresRef = useRef(null);
  const primeraVez = useRef(true);

  const nombre = PASOS[paso];
  const Paso = COMPONENTES[nombre];
  // Los errores se recalculan en vivo: desaparecen apenas se corrigen.
  const errores = mostrarErrores ? validarPaso(paso, respuestas) : [];

  // Al cambiar de paso, el foco va al título (no en la carga inicial).
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    tituloRef.current?.focus();
    window.scrollTo?.({ top: 0 });
  }, [paso]);

  function ir(destino) {
    setMostrarErrores(false);
    irAPaso(destino);
  }

  function siguiente() {
    if (validarPaso(paso, respuestas).length) {
      setMostrarErrores(true);
      // Esperar al render para llevar el foco al resumen de errores.
      requestAnimationFrame(() => erroresRef.current?.focus());
      return;
    }
    ir(paso + 1);
  }

  const textoSiguiente = paso === 0 ? N.comenzar : PASOS[paso + 1] === 'resultados' ? N.calcular : N.siguiente;

  return (
    <>
      <BarraProgreso paso={paso} total={PASOS.length} />
      <section className="paso" aria-labelledby="titulo-paso">
        <h2 id="titulo-paso" tabIndex={-1} ref={tituloRef}>
          {TEXTOS[nombre].titulo}
        </h2>
        <Paso respuestas={respuestas} dispatch={dispatch} irAPaso={ir} />
        <Errores errores={errores} ref={erroresRef} />
        {paso < ULTIMO && (
          <div className="navegacion">
            {paso > 0 && (
              <button type="button" className="boton boton--secundario" onClick={() => ir(paso - 1)}>
                {N.atras}
              </button>
            )}
            <button type="button" className="boton boton--primario" onClick={siguiente}>
              {textoSiguiente}
            </button>
          </div>
        )}
      </section>
    </>
  );
}
