import { useState } from 'react';
import { TEXTOS } from '../../textos/es-AR.js';
import { FASE2_HABILITADA } from '../../config/evento.js';
import { calcularHuella } from '../../calculo/total.js';
import { armarExportacion, aCsv } from '../../calculo/exportar.js';
import { formatearKg, formatearEntero, formatearNumero } from '../../calculo/formato.js';
import GraficosCategorias from '../GraficosCategorias.jsx';
import Metodologia, { textoUmbrales } from '../Metodologia.jsx';
import AvisoBasura from '../AvisoBasura.jsx';

const T = TEXTOS.resultados;
const PASOS_EDITABLES = [1, 2, 3, 4];

function descargar(contenido, nombre, tipo) {
  if (typeof URL.createObjectURL !== 'function') return false;
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export default function Resultados({ respuestas, dispatch, irAPaso }) {
  const huella = calcularHuella(respuestas);
  const [mensaje, setMensaje] = useState({ texto: '', alternativo: '' });
  const [metodologia, setMetodologia] = useState(false);
  const nivel = T.niveles[huella.nivel];

  async function compartir() {
    const url = window.location.origin + window.location.pathname;
    const texto = T.textoCompartir(formatearKg(huella.total), url);
    try {
      if (navigator.share) {
        await navigator.share({ title: T.tituloCompartir, text: texto });
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return; // la persona canceló
    }
    try {
      await navigator.clipboard.writeText(texto);
      setMensaje({ texto: T.copiado, alternativo: '' });
    } catch {
      setMensaje({ texto: T.errorCompartir, alternativo: texto });
    }
  }

  function exportar(formato) {
    const datos = armarExportacion(respuestas, huella);
    const ok =
      formato === 'json'
        ? descargar(JSON.stringify(datos, null, 2), 'huella-mastai-2026.json', 'application/json')
        : descargar(aCsv(datos), 'huella-mastai-2026.csv', 'text/csv;charset=utf-8');
    if (ok) setMensaje({ texto: T.descargado, alternativo: '' });
  }

  return (
    <>
      <p className="total">
        {T.total}
        <strong className="total__valor">{formatearKg(huella.total)}</strong>
      </p>

      <section className={`nivel nivel--${huella.nivel}`} aria-labelledby="titulo-nivel">
        <h3 id="titulo-nivel">
          {T.nivelTitulo}: <span className="nivel__nombre">{nivel.nombre}</span>
        </h3>
        <p>{nivel.descripcion}</p>
        <p className="ayuda">{textoUmbrales()}</p>
      </section>

      {FASE2_HABILITADA && <p className="ayuda">{T.promedioPendiente}</p>}

      {huella.total > 0 && (
        <section aria-labelledby="titulo-equivalencias">
          <h3 id="titulo-equivalencias">{T.equivalenciasTitulo}</h3>
          <ul className="equivalencias">
            <li>
              <span aria-hidden="true">🔋 </span>
              {T.equivalenciaCelular(formatearEntero(huella.equivalencias.cargasCelular))}
            </li>
            <li>
              <span aria-hidden="true">🚗 </span>
              {T.equivalenciaAuto(formatearNumero(huella.equivalencias.kmAuto))}
            </li>
          </ul>
        </section>
      )}

      <section aria-labelledby="titulo-grafico">
        <h3 id="titulo-grafico">{T.graficoTitulo}</h3>
        <GraficosCategorias porCategoria={huella.porCategoria} />
      </section>

      {huella.avisoBasura && <AvisoBasura />}

      <section aria-labelledby="titulo-recomendaciones">
        <h3 id="titulo-recomendaciones">{T.recomendacionesTitulo}</h3>
        {huella.recomendaciones.length ? (
          <ul className="recomendaciones">
            {huella.recomendaciones.map((r) => (
              <li key={r.id}>{TEXTOS.recomendaciones[r.id](formatearKg(r.ahorroKg))}</li>
            ))}
          </ul>
        ) : (
          <p>{T.sinRecomendaciones}</p>
        )}
      </section>

      <p>
        <button type="button" className="enlace" onClick={() => setMetodologia(true)}>
          {T.metodologiaEnlace}
        </button>
      </p>

      <section aria-labelledby="titulo-acciones" className="acciones">
        <h3 id="titulo-acciones">{T.accionesTitulo}</h3>
        <button type="button" className="boton boton--primario boton--ancho" onClick={compartir}>
          {T.compartir}
        </button>
        <div className="acciones__fila">
          <button type="button" className="boton boton--secundario" onClick={() => exportar('csv')}>
            {T.descargarCsv}
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => exportar('json')}>
            {T.descargarJson}
          </button>
        </div>
        <div role="status" aria-live="polite">
          {mensaje.texto && <p>{mensaje.texto}</p>}
          {mensaje.alternativo && (
            <textarea className="texto-copiable" readOnly value={mensaje.alternativo} rows={3} aria-label={T.compartir} />
          )}
        </div>
      </section>

      <section aria-labelledby="titulo-editar" className="acciones">
        <h3 id="titulo-editar">{T.editar}</h3>
        <div className="acciones__fila">
          {PASOS_EDITABLES.map((p) => (
            <button key={p} type="button" className="boton boton--secundario" onClick={() => irAPaso(p)}>
              {T.editarPaso(TEXTOS.progreso.nombres[p])}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="boton boton--secundario boton--ancho"
          onClick={() => {
            dispatch({ type: 'reiniciar' });
            irAPaso(0);
          }}
        >
          {T.recalcular}
        </button>
      </section>

      <Metodologia abierto={metodologia} onCerrar={() => setMetodologia(false)} />
    </>
  );
}
