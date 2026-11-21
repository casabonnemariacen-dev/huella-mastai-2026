/**
 * FACTORES DE EMISIÓN – única fuente de números de la app.
 *
 * Cada factor tiene:
 *   valor     número usado en el cálculo
 *   unidad    unidad del valor (siempre "CO₂e")
 *   fuente    { nombre, url }
 *   anio      año del dato
 *   estimado  true si el valor no se pudo verificar en la fuente primaria o
 *             surge de un supuesto propio (se muestra como "estimado" en la app)
 *   nota      criterio o cálculo, en texto para la sección de metodología
 *
 * Los valores derivados se calculan acá mismo, a partir de sus componentes,
 * para que el cálculo sea transparente. Si cambiás un componente, se
 * actualiza todo lo que depende de él.
 */

// ── Componentes base ────────────────────────────────────────────────────────

const NAFTA_KG_CO2_POR_LITRO = 2.27; // IPCC 2006: 69 300 kg CO₂/TJ × 44,3 TJ/Gg × 0,74 kg/L
const CONSUMO_AUTO_L_100KM = 8; // consumo urbano típico de un auto naftero
const FRACCION_KM_VACIO_REMIS = 0.5; // km en vacío por cada km con pasajero
const PORCION_CARNE_KG = 0.12; // porción de carne de un sándwich o plato de evento
const CERVEZA_KG_CO2E_POR_LITRO = 1.0; // valor central del rango 0,73–1,34 de microcervecerías
const VASO_CERVEZA_LITROS = 0.5;
const RESIDUOS_KG_POR_VISITANTE = 0.68; // SMGO 2026: promedio por persona por día en festivales
const FRACCION_RECICLADA_SI_SEPARA = 0.405; // SMGO 2026: fracción reciclada en festivales con separación

const IPCC_2006 = {
  nombre: 'IPCC 2006, Directrices para inventarios nacionales de GEI, Vol. 2, Cap. 3 (Transporte), cuadro 3.2.1',
  url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/spanish/vol2.html',
};
const DESNZ_2025 = {
  nombre: 'UK DESNZ, Greenhouse gas reporting: conversion factors 2025',
  url: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025',
};
const POORE_NEMECEK = {
  nombre: 'Poore y Nemecek (2018), Science 360:987–992, vía Our World in Data',
  url: 'https://ourworldindata.org/grapher/ghg-per-kg-poore',
};

// ── Factores ────────────────────────────────────────────────────────────────

export const FACTORES = {
  // Electricidad (para equivalencias)
  redElectricaAR: {
    nombre: 'Red eléctrica argentina',
    valor: 0.429,
    unidad: 'kg CO₂e/kWh',
    fuente: {
      nombre:
        'Secretaría de Energía de la Nación, Cálculo del factor de emisión de CO₂ de la red argentina de energía eléctrica (margen de operación simple)',
      url: 'http://datos.energia.gob.ar/dataset/calculo-del-factor-de-emision-de-co2-de-la-red-argentina-de-energia-electrica',
    },
    anio: 2023,
    estimado: false,
    nota: 'Último año publicado: 0,4293 tCO₂/MWh. Se usa el margen de operación simple, que representa el promedio de la generación de la red que no es de base.',
  },

  // Movilidad (por kilómetro)
  pieBici: {
    nombre: 'A pie / bicicleta',
    valor: 0,
    unidad: 'g CO₂e/km',
    fuente: { nombre: 'Sin combustión directa', url: '' },
    anio: 2026,
    estimado: false,
    nota: 'Se considera nulo: no hay emisiones directas.',
  },
  colectivo: {
    nombre: 'Colectivo urbano',
    valor: 125,
    unidad: 'g CO₂e/km',
    porPasajero: true,
    fuente: DESNZ_2025,
    anio: 2025,
    estimado: true,
    nota: 'Factor "local bus (not London)": 0,12525 kg CO₂e por pasajero-km. Ya incluye la ocupación promedio. Consultado en una copia secundaria de la planilla (Climatiq); no se encontró un factor argentino publicado.',
  },
  moto: {
    nombre: 'Moto',
    valor: 115,
    unidad: 'g CO₂e/km',
    porVehiculo: true,
    fuente: DESNZ_2025,
    anio: 2025,
    estimado: true,
    nota: 'Factor "motorbike, average": 0,1155 kg CO₂e por vehículo-km. Consultado en una fuente secundaria (Energy Saving Trust) que cita la planilla DESNZ. Se divide por la cantidad de personas en la moto.',
  },
  auto: {
    nombre: 'Auto',
    valor: Math.round(NAFTA_KG_CO2_POR_LITRO * (CONSUMO_AUTO_L_100KM / 100) * 1000 * 10) / 10,
    unidad: 'g CO₂e/km',
    porVehiculo: true,
    fuente: IPCC_2006,
    anio: 2006,
    estimado: true,
    nota: `Consumo de ${CONSUMO_AUTO_L_100KM} L/100 km (supuesto de manejo urbano) × ${NAFTA_KG_CO2_POR_LITRO} kg CO₂/L de nafta (factor por defecto del IPCC, que usa el Inventario Nacional de GEI de Argentina). Se divide por la cantidad de personas en el auto. Coincide con el promedio británico (DESNZ 2025: unos 170–177 g/km).`,
  },
  remis: {
    nombre: 'Remis / taxi',
    valor:
      Math.round(
        NAFTA_KG_CO2_POR_LITRO * (CONSUMO_AUTO_L_100KM / 100) * 1000 * (1 + FRACCION_KM_VACIO_REMIS) * 10,
      ) / 10,
    unidad: 'g CO₂e/km',
    porVehiculo: true,
    fuente: IPCC_2006,
    anio: 2026,
    estimado: true,
    nota: `Mismo factor que el auto, más un ${FRACCION_KM_VACIO_REMIS * 100} % de kilómetros en vacío: el remis viaja sin pasajeros para buscarte y para volver a su base o a otro viaje. Los estudios sobre taxis urbanos reportan entre 30 % y 50 % de recorrido vacío; tomamos el valor alto por precaución. No se divide entre pasajeros, porque el viaje se hace igual por el grupo.`,
  },

  // Alimentación (por porción)
  carneVacuna: {
    nombre: 'Carne vacuna (porción)',
    valor: Math.round(99.48 * PORCION_CARNE_KG * 100) / 100,
    unidad: 'kg CO₂e/porción',
    fuente: POORE_NEMECEK,
    anio: 2018,
    estimado: false,
    nota: `99,48 kg CO₂e por kg de carne de rodeo de cría (promedio mundial, incluye cambio de uso del suelo y pérdidas) × porción de ${PORCION_CARNE_KG * 1000} g. Se usa el promedio y no la mediana para no subestimar: es el alimento de mayor impacto. La ganadería pastoril argentina puede estar por debajo, pero no hay un valor nacional comparable de la granja al plato.`,
  },
  carneBlanca: {
    nombre: 'Carne blanca (porción)',
    valor: Math.round(((9.87 + 12.31 + 13.63) / 3) * PORCION_CARNE_KG * 100) / 100,
    unidad: 'kg CO₂e/porción',
    fuente: POORE_NEMECEK,
    anio: 2018,
    estimado: false,
    nota: `Promedio de pollo (9,87), cerdo (12,31) y pescado de criadero (13,63) kg CO₂e/kg × porción de ${PORCION_CARNE_KG * 1000} g.`,
  },
  platoVegetariano: {
    nombre: 'Plato vegetariano / vegano',
    valor: Math.round((0.1 * 1.79 + 0.1 * 1.57 + 0.1 * 0.53) * 100) / 100,
    unidad: 'kg CO₂e/porción',
    fuente: POORE_NEMECEK,
    anio: 2018,
    estimado: true,
    nota: 'Plato tipo de 300 g: 100 g de legumbres (1,79), 100 g de pan o masa de trigo (1,57) y 100 g de verduras (0,53) kg CO₂e/kg. La composición del plato es un supuesto propio.',
  },
  cerveza: {
    nombre: 'Cerveza (vaso de 500 ml)',
    valor: CERVEZA_KG_CO2E_POR_LITRO * VASO_CERVEZA_LITROS,
    unidad: 'kg CO₂e/vaso',
    fuente: {
      nombre:
        'Morgan, Styles y Thomas Lane (2021), "Thirsty work: Assessing the environmental footprint of craft beer", Sustainable Production and Consumption 27:242–253',
      url: 'https://research.bangor.ac.uk/en/publications/thirsty-work-assessing-the-environmental-footprint-of-craft-beer/',
    },
    anio: 2021,
    estimado: true,
    nota: `Se toma ${CERVEZA_KG_CO2E_POR_LITRO} kg CO₂e/L, el valor de la parte baja del rango publicado para microcervecerías (0,76–1,9 kg CO₂e/L: malta, energía, envase y frío), porque en la Fiesta la cerveza se sirve tirada de barril reutilizable, × ${VASO_CERVEZA_LITROS * 1000} ml.`,
  },
  bebidaBotella: {
    nombre: 'Gaseosa o agua embotellada (500 ml)',
    valor: 0.2,
    unidad: 'kg CO₂e/unidad',
    fuente: {
      nombre: 'Estimación propia a partir de huellas de producto publicadas por fabricantes de bebidas en PET de 500 ml (0,15–0,25 kg CO₂e)',
      url: '',
    },
    anio: 2026,
    estimado: true,
    nota: 'Valor central de los ACV publicados. Incluye la botella de PET, que suele representar entre un cuarto y la mitad del total.',
  },
  bebidaReutilizable: {
    nombre: 'Bebida en vaso reutilizable / agua de dispenser',
    valor: 0.02,
    unidad: 'kg CO₂e/unidad',
    fuente: {
      nombre: 'Estimación propia a partir de ACV de vasos reutilizables en eventos (lavado y amortización en muchos usos)',
      url: '',
    },
    anio: 2026,
    estimado: true,
    nota: 'Valor bajo y conservador: el vaso se amortiza en decenas de usos y el agua de red tiene un impacto mínimo.',
  },

  // Residuos (por visitante)
  residuosPorVisitante: {
    nombre: 'Residuos generados por visitante',
    valor: RESIDUOS_KG_POR_VISITANTE,
    unidad: 'kg/visitante',
    fuente: {
      nombre: 'Julie’s Bicycle y Powerful Thinking, "The Show Must Go On" (3.ª edición, 2026)',
      url: 'https://juliesbicycle.org/wp-content/uploads/2026/02/SMGO_Report_2026_FINAL.pdf',
    },
    anio: 2026,
    estimado: true,
    nota: 'Referencia de 0,68 kg de residuos por persona por día en festivales de música del Reino Unido, con 40,5 % reciclado. Se aplica a una visita de una noche; no hay datos de eventos del NEA. Valor tomado de un resumen del informe.',
  },
  residuoRelleno: {
    nombre: 'Residuo mezclado a relleno o basural',
    valor: 0.5,
    unidad: 'kg CO₂e/kg',
    fuente: DESNZ_2025,
    anio: 2025,
    estimado: true,
    nota: 'Orden de magnitud de los factores DESNZ para residuo municipal mezclado en relleno (unos 0,45–0,52 kg CO₂e/kg), por el metano que libera la materia orgánica. No se encontró un factor provincial.',
  },
  residuoReciclado: {
    nombre: 'Residuo separado y reciclado',
    valor: 0.021,
    unidad: 'kg CO₂e/kg',
    fuente: DESNZ_2025,
    anio: 2025,
    estimado: true,
    nota: 'Orden de magnitud de los factores DESNZ de reciclaje (unos 21 kg CO₂e por tonelada, solo transporte y clasificación).',
  },

  // Compras
  compraPequena: {
    nombre: 'Compra pequeña (accesorio o artesanía chica)',
    valor: 1,
    unidad: 'kg CO₂e/compra',
    fuente: { nombre: 'Estimación propia (orden de magnitud de objetos chicos de tela, madera o metal)', url: '' },
    anio: 2026,
    estimado: true,
    nota: 'Supuesto: un objeto de unos 100–200 g con materiales e impacto de fabricación moderados.',
  },
  prenda: {
    nombre: 'Prenda de ropa (remera de algodón)',
    valor: 6.5,
    unidad: 'kg CO₂e/prenda',
    fuente: {
      nombre: 'Rango de ACV de remeras de algodón (2,6–8,8 kg CO₂e; WRAP 2012: 28 kg CO₂e/kg de tela)',
      url: 'https://ckh.wrap.org.uk/clothingKnowledgeHub/detail/131',
    },
    anio: 2012,
    estimado: true,
    nota: 'Valor típico de una remera de algodón, de la fibra a la venta.',
  },

  // Equivalencias
  cargaCelular: {
    nombre: 'Energía de una carga completa de celular',
    valor: 0.0124,
    unidad: 'kWh/carga',
    fuente: {
      nombre: 'US EPA, Greenhouse Gas Equivalencies Calculator – Calculations and References',
      url: 'https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references',
    },
    anio: 2024,
    estimado: false,
    nota: 'Se multiplica por el factor de la red eléctrica argentina.',
  },
};

/** Parámetros de los supuestos, para mostrarlos en la metodología. */
export const SUPUESTOS = {
  consumoAutoL100km: CONSUMO_AUTO_L_100KM,
  fraccionKmVacioRemis: FRACCION_KM_VACIO_REMIS,
  porcionCarneKg: PORCION_CARNE_KG,
  vasoCervezaLitros: VASO_CERVEZA_LITROS,
  residuosKgPorVisitante: RESIDUOS_KG_POR_VISITANTE,
  fraccionRecicladaSiSepara: FRACCION_RECICLADA_SI_SEPARA,
};
