/**
 * Opciones de cada paso y su vínculo con FACTORES (src/data/factores.js).
 * Los textos visibles están en src/textos/es-AR.js (misma clave `id`).
 */

/** Medios de transporte. */
export const MEDIOS = [
  { id: 'pie_bici', factor: 'pieBici', motorizado: false, divideOcupantes: false },
  { id: 'colectivo', factor: 'colectivo', motorizado: true, divideOcupantes: false },
  { id: 'moto', factor: 'moto', motorizado: true, divideOcupantes: true, ocupantesMax: 2 },
  { id: 'auto', factor: 'auto', motorizado: true, divideOcupantes: true, ocupantesMax: 8 },
  { id: 'remis', factor: 'remis', motorizado: true, divideOcupantes: false },
];

/** Comida: selección única. */
export const COMIDAS = [
  { id: 'vacuna', factor: 'carneVacuna' },
  { id: 'blanca', factor: 'carneBlanca' },
  { id: 'vegetariana', factor: 'platoVegetariano' },
  { id: 'ninguna', factor: null },
];

/** Bebidas: selección múltiple. "ninguna" es excluyente. */
export const BEBIDAS = [
  { id: 'alcohol', factor: 'cerveza', porVaso: true },
  { id: 'botella', factor: 'bebidaBotella' },
  { id: 'reutilizable', factor: 'bebidaReutilizable' },
  { id: 'ninguna', factor: null, excluyente: true },
];

/** Residuos: selección única. */
export const RESIDUOS = [
  { id: 'separe', separa: true, avisoBasura: false },
  { id: 'mismo_tacho', separa: false, avisoBasura: false },
  { id: 'fuera', separa: false, avisoBasura: true },
];

/** Compras: selección única. `componentes` = [clave de factor, cantidad]. */
export const COMPRAS = [
  { id: 'nada', componentes: [] },
  { id: 'pequeno', componentes: [['compraPequena', 1]] },
  { id: 'prenda', componentes: [['prenda', 1]] },
  // "Varias cosas": supuesto de una prenda y dos objetos chicos.
  { id: 'varias', componentes: [['prenda', 1], ['compraPequena', 2]] },
];

export const CATEGORIAS = ['movilidad', 'alimentacion', 'residuos', 'compras'];

export const buscar = (lista, id) => lista.find((o) => o.id === id) ?? null;
