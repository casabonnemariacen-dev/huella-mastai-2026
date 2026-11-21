/**
 * Configuración del evento y de los servicios externos.
 * Para reutilizar la app en otro evento, cambiá los datos de este archivo
 * y los textos de src/textos/es-AR.js.
 */

export const EVENTO = {
  nombreCorto: 'Mastai',
  nombre: 'Mastai – Fiesta de la Cerveza del NEA Argentino',
  nombreConArticulo: 'la Fiesta de la Cerveza del NEA Argentino',
  edicion: 'Corrientes 2026',
  organizacion: 'IANES / UCP',
  sede: {
    nombre: 'Anfiteatro Mario del Tránsito Cocomarola',
    direccion: 'Av. Domingo Sarmiento 2650, W3400 Corrientes',
    // Coordenadas verificadas el 21/11/2026 con Nominatim (nodo OSM 3946938209,
    // "Anfiteatro Mario del Tránsito Cocomarola", amenity=theatre). El punto queda
    // sobre la traza de la Av. Sarmiento, en el barrio 1000 Viviendas.
    lat: -27.4905905,
    lon: -58.830225,
    osm: 'https://www.openstreetmap.org/node/3946938209',
  },
};

/**
 * Sesgo geográfico de la búsqueda de direcciones: centrado en Corrientes.
 * La caja incluye el Gran Corrientes y el Gran Resistencia (visitantes que
 * cruzan el puente General Belgrano). Las direcciones fuera de la caja se
 * permiten igual: solo se priorizan las cercanas.
 */
export const BUSQUEDA = {
  centro: { lat: EVENTO.sede.lat, lon: EVENTO.sede.lon },
  // [oeste, sur, este, norte]
  caja: [-59.1, -27.65, -58.6, -27.35],
  zoomSesgo: 12,
  escalaSesgo: 0.2, // Photon location_bias_scale: menor valor = más peso a la cercanía
  codigoPais: 'ar',
  idioma: 'es',
  minimoCaracteres: 3,
  esperaDebounceMs: 500,
  maximoResultados: 6,
};

/** Servicios externos (todos basados en datos de OpenStreetMap). */
export const SERVICIOS = {
  // Autocompletado: Photon. La política de Nominatim prohíbe el autocompletado.
  photon: 'https://photon.komoot.io/api/',
  // Geocodificación inversa ("Usar mi ubicación actual").
  nominatim: 'https://nominatim.openstreetmap.org',
  // Rutas: API compatible con OSRM. El servidor demo NO es apto para uso masivo:
  // ver README, "Servicio de rutas en producción".
  rutas: import.meta.env?.VITE_URL_RUTAS || 'https://router.project-osrm.org',
  perfilRutas: 'driving',
  tiempoLimiteMs: 8000,
  // Si el ruteo falla: distancia en línea recta × factor de desvío. 1,3 es el
  // valor habitual para redes urbanas (la ruta real suele ser 20–40 % más larga).
  factorDesvio: 1.3,
  solicitudesPorSegundo: 1,
  teselas: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  atribucionTeselas:
    '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>',
};

/** Límites de los controles de distancia y ocupantes. */
export const LIMITES = {
  distanciaMaxDeslizadorKm: 100,
  distanciaMaxKm: 2000,
  ocupantesMax: 8,
  vasosMax: 6,
};

/** Fase 2 (guardado anónimo y promedio de visitantes). Desactivada. */
export const FASE2_HABILITADA = false;

export const CREDITOS = {
  desarrollo: 'IANES – Universidad de la Cuenca del Plata (UCP)',
  anio: 2026,
};
