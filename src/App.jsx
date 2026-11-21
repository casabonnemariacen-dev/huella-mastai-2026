import { useEffect, useReducer, useState } from 'react';
import { reducer } from './estado/respuestas.js';
import { cargarSesion, guardarSesion } from './estado/persistencia.js';
import { TEXTOS } from './textos/es-AR.js';
import Encabezado from './componentes/Encabezado.jsx';
import PiePagina from './componentes/PiePagina.jsx';
import Asistente from './componentes/Asistente.jsx';
import './estilos/global.css';

export default function App() {
  const [inicial] = useState(cargarSesion);
  const [respuestas, dispatch] = useReducer(reducer, inicial.respuestas);
  const [paso, setPaso] = useState(inicial.paso);

  useEffect(() => guardarSesion(respuestas, paso), [respuestas, paso]);

  return (
    <div className="app">
      <a className="saltar" href="#contenido">
        {TEXTOS.app.saltarContenido}
      </a>
      <Encabezado />
      <main id="contenido" className="principal">
        <Asistente respuestas={respuestas} dispatch={dispatch} paso={paso} irAPaso={setPaso} />
      </main>
      <PiePagina />
    </div>
  );
}
