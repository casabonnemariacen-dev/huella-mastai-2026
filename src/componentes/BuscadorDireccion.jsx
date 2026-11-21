import { useEffect, useId, useRef, useState } from 'react';
import { TEXTOS } from '../textos/es-AR.js';
import { BUSQUEDA } from '../config/evento.js';
import { buscarDirecciones, direccionDesdeCoordenadas } from '../servicios/geocodificacion.js';

const T = TEXTOS.movilidad;

/**
 * Campo de dirección con autocompletado (patrón combobox de WAI-ARIA)
 * y botón "Usar mi ubicación actual".
 * - Debounce de BUSQUEDA.esperaDebounceMs, mínimo BUSQUEDA.minimoCaracteres.
 * - Cancela la búsqueda anterior al seguir escribiendo.
 * - Ante errores, muestra un mensaje y la persona puede cargar la distancia a mano.
 */
export default function BuscadorDireccion({ origen, onElegir, onBorrar }) {
  const id = useId();
  const [texto, setTexto] = useState(origen?.texto ?? '');
  const [resultados, setResultados] = useState([]);
  const [estado, setEstado] = useState('inactivo'); // inactivo | buscando | listo | error
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [ubicacion, setUbicacion] = useState({ estado: 'inactivo', mensaje: '' });
  const elegidoRef = useRef(origen?.texto ?? null);

  useEffect(() => {
    const q = texto.trim();
    if (q.length < BUSQUEDA.minimoCaracteres || q === elegidoRef.current) return undefined;
    const control = new AbortController();
    const temporizador = setTimeout(async () => {
      setEstado('buscando');
      try {
        const lista = await buscarDirecciones(q, control.signal);
        setResultados(lista);
        setActivo(-1);
        setAbierto(true);
        setEstado('listo');
      } catch (e) {
        if (e.name === 'AbortError') return;
        setResultados([]);
        setAbierto(false);
        setEstado('error');
      }
    }, BUSQUEDA.esperaDebounceMs);
    return () => {
      clearTimeout(temporizador);
      control.abort();
    };
  }, [texto]);

  function cambiarTexto(valor) {
    setTexto(valor);
    elegidoRef.current = null;
    if (valor.trim().length < BUSQUEDA.minimoCaracteres) {
      setResultados([]);
      setAbierto(false);
      setEstado('inactivo');
    }
  }

  function elegir(r) {
    elegidoRef.current = r.texto;
    setTexto(r.texto);
    setAbierto(false);
    setResultados([]);
    setEstado('inactivo');
    onElegir(r);
  }

  function borrar() {
    elegidoRef.current = null;
    setTexto('');
    setResultados([]);
    setAbierto(false);
    setEstado('inactivo');
    onBorrar();
  }

  function teclas(e) {
    if (!abierto || !resultados.length) {
      if (e.key === 'ArrowDown' && resultados.length) setAbierto(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((i) => (i + 1) % resultados.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => (i <= 0 ? resultados.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activo >= 0) {
      e.preventDefault();
      elegir(resultados[activo]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  }

  function usarUbicacion() {
    if (!navigator.geolocation) {
      setUbicacion({ estado: 'error', mensaje: T.sinGeolocalizacion });
      return;
    }
    setUbicacion({ estado: 'buscando', mensaje: T.ubicando });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        let nombre = null;
        try {
          nombre = await direccionDesdeCoordenadas(lat, lon);
        } catch {
          // Sin dirección legible: se usa igual la ubicación.
        }
        setUbicacion({ estado: 'inactivo', mensaje: '' });
        elegir({ texto: nombre ?? T.miUbicacion, lat, lon });
      },
      (error) => {
        setUbicacion({
          estado: 'error',
          mensaje: error?.code === 1 ? T.ubicacionDenegada : T.ubicacionError,
        });
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  }

  const listaId = `${id}-lista`;
  const mostrarLista = abierto && resultados.length > 0;
  let anuncio = '';
  if (estado === 'buscando') anuncio = T.buscando;
  else if (estado === 'listo') anuncio = resultados.length ? T.sugerencias(resultados.length) : T.sinResultados;

  return (
    <div className="campo buscador">
      <label htmlFor={`${id}-campo`}>{T.origenEtiqueta}</label>
      <p className="ayuda" id={`${id}-ayuda`}>
        {T.origenAyuda}
      </p>
      <div className="buscador__fila">
        <input
          id={`${id}-campo`}
          type="text"
          role="combobox"
          autoComplete="off"
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-expanded={mostrarLista}
          aria-controls={listaId}
          aria-activedescendant={mostrarLista && activo >= 0 ? `${id}-op-${activo}` : undefined}
          aria-describedby={`${id}-ayuda`}
          value={texto}
          onChange={(e) => cambiarTexto(e.target.value)}
          onKeyDown={teclas}
          onBlur={() => setAbierto(false)}
          onFocus={() => resultados.length && setAbierto(true)}
        />
        {texto && (
          <button type="button" className="boton boton--secundario boton--chico" onClick={borrar}>
            {T.borrarOrigen}
          </button>
        )}
      </div>
      <ul id={listaId} role="listbox" aria-label={T.origenEtiqueta} className="buscador__lista" hidden={!mostrarLista}>
        {resultados.map((r, i) => (
          <li
            key={`${r.texto}-${i}`}
            id={`${id}-op-${i}`}
            role="option"
            aria-selected={i === activo}
            className={i === activo ? 'activo' : undefined}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => elegir(r)}
          >
            {r.texto}
          </li>
        ))}
      </ul>
      <p className="ayuda" role="status" aria-live="polite">
        {anuncio}
      </p>
      {estado === 'error' && (
        <p className="mensaje-error" role="alert">
          {T.errorBusqueda}
        </p>
      )}

      <button
        type="button"
        className="boton boton--secundario boton--ancho"
        onClick={usarUbicacion}
        disabled={ubicacion.estado === 'buscando'}
      >
        <span aria-hidden="true">📍 </span>
        {ubicacion.estado === 'buscando' ? T.ubicando : T.usarUbicacion}
      </button>
      {ubicacion.estado === 'error' && (
        <p className="mensaje-error" role="alert">
          {ubicacion.mensaje}
        </p>
      )}
    </div>
  );
}
