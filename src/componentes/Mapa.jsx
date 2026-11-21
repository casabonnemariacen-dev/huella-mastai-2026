import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SERVICIOS } from '../config/evento.js';
import { TEXTOS } from '../textos/es-AR.js';

const T = TEXTOS.movilidad;

function Encuadre({ puntos }) {
  const map = useMap();
  const clave = JSON.stringify(puntos);
  useEffect(() => {
    map.fitBounds(JSON.parse(clave), { padding: [24, 24], maxZoom: 16 });
  }, [map, clave]);
  return null;
}

/**
 * Mapa del recorrido (complementario: toda la información también está en texto).
 * Se carga de forma diferida para no pesar en la primera pantalla.
 */
export default function Mapa({ origen, destino, geometria }) {
  const o = [origen.lat, origen.lon];
  const d = [destino.lat, destino.lon];
  const linea = geometria?.length ? geometria : [o, d];
  const puntos = geometria?.length ? [...geometria, o, d] : [o, d];

  return (
    <div className="mapa" role="region" aria-label={T.mapaEtiqueta}>
      <MapContainer center={d} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url={SERVICIOS.teselas} attribution={SERVICIOS.atribucionTeselas} />
        <Polyline
          positions={linea}
          pathOptions={{ color: '#1b5e20', weight: 4, dashArray: geometria?.length ? undefined : '6 8' }}
        />
        <CircleMarker center={o} radius={8} pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#2a78d6', fillOpacity: 1 }}>
          <Tooltip>{T.mapaOrigen}</Tooltip>
        </CircleMarker>
        <CircleMarker center={d} radius={9} pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#1b5e20', fillOpacity: 1 }}>
          <Tooltip>{T.mapaDestino}</Tooltip>
        </CircleMarker>
        <Encuadre puntos={puntos} />
      </MapContainer>
    </div>
  );
}
