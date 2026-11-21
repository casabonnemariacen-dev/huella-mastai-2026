import { useId, useState } from 'react';
import { TEXTOS } from '../textos/es-AR.js';
import { LIMITES } from '../config/evento.js';
import { formatearDecimal } from '../calculo/formato.js';

const T = TEXTOS.movilidad;

/** Convierte "12,5" o "12.5" a número; texto inválido o vacío → null. */
export function interpretarKm(texto) {
  const limpio = String(texto).trim().replace(/\s/g, '').replace(',', '.');
  if (limpio === '') return 0;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Deslizador (0..100 km) y campo numérico sincronizados. */
export default function SelectorDistancia({ km, onCambiar }) {
  const id = useId();
  // Texto en edición: permite escribir "2," sin que se reformatee al tipear.
  const [editando, setEditando] = useState(null);
  const texto = editando ?? formatearDecimal(km, 1);

  return (
    <div className="campo">
      <span className="etiqueta" id={`${id}-titulo`}>
        {T.distanciaTitulo}
      </span>
      <p className="ayuda" id={`${id}-ayuda`}>
        {T.distanciaAyuda}
      </p>
      <div className="distancia">
        <input
          type="range"
          min="0"
          max={LIMITES.distanciaMaxDeslizadorKm}
          step="0.5"
          value={Math.min(km, LIMITES.distanciaMaxDeslizadorKm)}
          onChange={(e) => {
            setEditando(null);
            onCambiar(Number(e.target.value));
          }}
          aria-label={T.distanciaDeslizador}
          aria-valuetext={`${formatearDecimal(km, 1)} km`}
          aria-describedby={`${id}-ayuda`}
        />
        <div className="distancia__numero">
          <label className="visualmente-oculto" htmlFor={`${id}-km`}>
            {T.distanciaCampo}
          </label>
          <input
            id={`${id}-km`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={texto}
            onChange={(e) => {
              setEditando(e.target.value);
              const n = interpretarKm(e.target.value);
              if (n !== null) onCambiar(Math.min(n, LIMITES.distanciaMaxKm));
            }}
            onBlur={() => setEditando(null)}
            aria-describedby={`${id}-ayuda ${id}-mayor`}
          />
          <span aria-hidden="true">{T.distanciaUnidad}</span>
        </div>
      </div>
      <p className="ayuda" id={`${id}-mayor`}>
        {T.distanciaMayor(LIMITES.distanciaMaxDeslizadorKm)}
      </p>
    </div>
  );
}
