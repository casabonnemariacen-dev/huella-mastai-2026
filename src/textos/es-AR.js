/**
 * TEXTOS DE LA APP – español rioplatense con voseo.
 * Para corregir cualquier texto visible, editá este archivo.
 * Las claves de `opciones` coinciden con los `id` de src/data/opciones.js.
 */
import { EVENTO, CREDITOS } from '../config/evento.js';
import { formatearKg } from '../calculo/formato.js';

export const TEXTOS = {
  app: {
    encabezado: `${EVENTO.organizacion} – ${EVENTO.nombre} en ${EVENTO.edicion}`,
    titulo: 'Calculadora de huella de carbono',
    logoAlt: 'Logo de la Universidad de la Cuenca del Plata',
    saltarContenido: 'Saltar al contenido',
  },

  pie: {
    creditos: `Desarrollo: ${CREDITOS.desarrollo}, ${CREDITOS.anio}.`,
    datosMapa: 'Mapas y direcciones: © colaboradores de OpenStreetMap.',
    aviso: 'Herramienta educativa: los resultados son estimaciones.',
  },

  progreso: {
    etiqueta: 'Progreso del cuestionario',
    paso: (n, total) => `Paso ${n} de ${total}`,
    nombres: ['Bienvenida', 'Movilidad', 'Comida y bebida', 'Residuos', 'Compras', 'Resultados'],
  },

  navegacion: {
    comenzar: 'Comenzar',
    siguiente: 'Siguiente',
    atras: 'Atrás',
    calcular: 'Calcular mi huella',
  },

  bienvenida: {
    titulo: `¿Cuánto CO₂e generó tu visita a ${EVENTO.nombreCorto}?`,
    queEs:
      'La huella de carbono es la cantidad de gases de efecto invernadero que se emiten por algo que hacemos, como viajar, comer o comprar. Se mide en kilogramos de CO₂ equivalente (kg CO₂e).',
    alcance: `Este cálculo corresponde solo a tu visita a ${EVENTO.nombreConArticulo}: no es tu huella anual.`,
    duracion: '4 preguntas rápidas, menos de 3 minutos.',
    aproximados: 'Podés usar valores aproximados y editar todo al final.',
  },

  movilidad: {
    titulo: '¿Cómo llegaste a la Fiesta?',
    ayuda: 'Elegí el medio que usaste para la mayor parte del viaje.',
    leyendaMedio: 'Medio de transporte de ida',
    leyendaMedioVuelta: 'Medio de transporte de vuelta',
    factor: (valor) => `${valor} g CO₂e/km`,
    porPersona: 'por pasajero',
    porVehiculo: 'por vehículo',
    ocupantes: '¿Cuántas personas viajaron en el vehículo, contándote?',
    ocupantesAyuda: 'La emisión se reparte entre todas las personas que viajaron.',
    ocupantesVuelta: '¿Cuántas personas viajaron a la vuelta, contándote?',
    distanciaTitulo: '¿Qué distancia recorriste?',
    distanciaAyuda: 'Distancia de ida, desde tu casa o alojamiento hasta el Anfiteatro.',
    distanciaDeslizador: 'Distancia de ida en kilómetros (deslizador)',
    distanciaCampo: 'Distancia de ida en kilómetros',
    distanciaUnidad: 'km',
    distanciaMayor: (max) => `Si viajaste más de ${max} km, escribí la distancia en el campo.`,
    idaYVuelta: 'Ida y vuelta',
    idaYVueltaAyuda: 'Duplica la distancia. Desactivalo si volviste en otro medio.',
    vueltaTitulo: '¿Cómo volviste?',
    destino: `Destino: ${EVENTO.sede.nombre} (${EVENTO.sede.direccion}).`,
    subtotal: (kg) => `Movilidad: ${formatearKg(kg)}`,

    origenTitulo: '¿Desde dónde viniste?',
    origenEtiqueta: 'Dirección de origen',
    origenAyuda:
      'Escribí calle y número, barrio o localidad, y elegí una sugerencia. Si preferís, cargá la distancia a mano más abajo.',
    buscando: 'Buscando direcciones…',
    sugerencias: (n) => (n === 1 ? '1 sugerencia. Usá las flechas para elegirla.' : `${n} sugerencias. Usá las flechas para elegir.`),
    sinResultados: 'No encontramos esa dirección. Probá escribirla de otra forma o cargá la distancia a mano.',
    errorBusqueda:
      'No pudimos buscar direcciones en este momento. Cargá la distancia a mano con el deslizador o el campo.',
    borrarOrigen: 'Borrar origen',
    usarUbicacion: 'Usar mi ubicación actual',
    ubicando: 'Obteniendo tu ubicación…',
    miUbicacion: 'Mi ubicación actual',
    sinGeolocalizacion: 'Tu navegador no permite usar la ubicación. Escribí la dirección o cargá la distancia a mano.',
    ubicacionDenegada: 'No diste permiso para usar tu ubicación. Escribí la dirección o cargá la distancia a mano.',
    ubicacionError: 'No pudimos obtener tu ubicación. Escribí la dirección o cargá la distancia a mano.',
    origenElegido: (texto) => `Origen: ${texto}`,
    calculandoRuta: 'Calculando la ruta…',
    distanciaRuta: (km) => `Distancia por calle (solo ida): ${km} km. Podés ajustarla si hiciste otro recorrido.`,
    distanciaEstimada: (km) =>
      `No pudimos calcular la ruta. Estimamos ${km} km: la distancia en línea recta más un 30 % por el trazado de las calles. Ajustala si hace falta.`,
    mapaEtiqueta: 'Mapa con tu recorrido hasta el Anfiteatro',
    mapaOrigen: 'Tu origen',
    mapaDestino: EVENTO.sede.nombre,
  },

  alimentacion: {
    titulo: 'Comida y bebida',
    comidaPregunta: '¿Qué comiste o vas a comer en la Fiesta?',
    bebidaPregunta: '¿Qué tomaste o vas a tomar?',
    bebidaAyuda: 'Podés marcar más de una opción.',
    vasos: '¿Cuántos vasos de cerveza (500 ml)?',
    vasosOpcion: (n, max) => (n >= max ? `${n} o más` : String(n)),
    subtotal: (kg) => `Comida y bebida: ${formatearKg(kg)}`,
    porcion: (kg) => `${formatearKg(kg)} por porción`,
    porBebida: (kg, porVaso) => `${formatearKg(kg)} ${porVaso ? 'por vaso' : 'por unidad'}`,
  },

  residuos: {
    titulo: '¿Qué hiciste con tus residuos?',
    ayuda: 'Vasos, envases, servilletas y restos de comida.',
    leyenda: 'Manejo de residuos',
    subtotal: (kg) => `Residuos: ${formatearKg(kg)}`,
    avisoBasuraTitulo: 'La basura tirada contamina más allá del CO₂e',
    avisoBasura:
      'Los residuos que quedan en el suelo terminan en desagües, en el río Paraná y en los suelos. Los plásticos se fragmentan en microplásticos, y las colillas y los envases liberan sustancias tóxicas. Este daño no se mide en kg CO₂e, por eso no se suma a tu huella, pero es igual de importante: usá los tachos.',
  },

  compras: {
    titulo: '¿Compraste algo en la Fiesta?',
    ayuda: 'Ropa, recuerdos, artesanías o accesorios.',
    leyenda: 'Compras',
    subtotal: (kg) => `Compras: ${formatearKg(kg)}`,
  },

  resultados: {
    titulo: 'Tu huella de la visita',
    total: 'Huella total de tu visita',
    editar: 'Editar respuestas',
    editarPaso: (nombre) => `Editar: ${nombre}`,
    recalcular: 'Volver a calcular',

    nivelTitulo: 'Nivel de tu huella',
    niveles: {
      bajo: { nombre: 'Bajo', descripcion: 'Tu visita tuvo un impacto bajo. ¡Bien!' },
      medio: { nombre: 'Medio', descripcion: 'Tu visita tuvo un impacto moderado. Mirá abajo qué cambios suman más.' },
      alto: { nombre: 'Alto', descripcion: 'Tu visita tuvo un impacto alto. Con algunos cambios lo podés bajar bastante.' },
    },
    umbralesExplicacion: (bajo, alto) =>
      `Bajo: menos de ${bajo}. Medio: de ${bajo} a ${alto}. Alto: ${alto} o más. Los límites se definieron a partir de combinaciones típicas de respuestas (no comparan con otros visitantes).`,

    equivalenciasTitulo: '¿Cuánto es eso?',
    equivalenciaCelular: (n) => `Lo mismo que cargar un celular ${n} veces con la red eléctrica argentina.`,
    equivalenciaAuto: (km) => `Lo mismo que recorrer ${km} km en un auto naftero.`,

    categorias: {
      movilidad: 'Movilidad',
      alimentacion: 'Comida y bebida',
      residuos: 'Residuos',
      compras: 'Compras',
    },
    graficoTitulo: 'Tu huella por categoría',
    graficoAnillo: (resumen) => `Gráfico de anillo con la huella por categoría: ${resumen}.`,
    graficoBarras: 'Gráfico de barras con la huella por categoría',
    sinEmisiones: 'Tu visita no generó emisiones en ninguna categoría: no hay nada para graficar. ¡Excelente!',
    verTabla: 'Ver los datos como tabla',
    tablaCategoria: 'Categoría',
    tablaValor: 'Huella',
    tablaPorcentaje: 'Porcentaje',

    recomendacionesTitulo: 'Para la próxima',
    sinRecomendaciones: 'Tus elecciones ya son de bajo impacto. ¡Seguí así!',

    accionesTitulo: 'Compartí o guardá tu resultado',
    compartir: 'Compartir resultado',
    copiado: 'Copiamos el resultado al portapapeles. Pegalo donde quieras.',
    errorCompartir: 'No pudimos compartir ni copiar el resultado. Podés copiarlo desde acá:',
    textoCompartir: (kg, url) =>
      `Mi visita a ${EVENTO.nombre} (${EVENTO.edicion}) generó ${kg}. Calculá la tuya: ${url}`,
    tituloCompartir: `Mi huella en ${EVENTO.nombreCorto}`,
    descargarJson: 'Descargar datos (JSON)',
    descargarCsv: 'Descargar datos (CSV)',
    descargado: 'Descargamos el archivo.',

    metodologiaEnlace: '¿Cómo calculamos esto?',
    promedioPendiente: 'Pronto vas a poder comparar tu huella con el promedio de la Fiesta.',
  },

  recomendaciones: {
    caminar: (kg) => `Si hubieras venido a pie o en bicicleta, tu huella sería ${kg} menor.`,
    colectivo: (kg) => `Si hubieras venido en colectivo, tu huella sería ${kg} menor.`,
    compartir_auto: (kg) => `Si hubieran viajado 4 personas en el auto, tu huella sería ${kg} menor.`,
    carne_blanca: (kg) => `Si elegías carne blanca en lugar de vacuna, tu huella sería ${kg} menor.`,
    vegetariano: (kg) => `Si elegías un plato vegetariano, tu huella sería ${kg} menor.`,
    vaso_reutilizable: (kg) => `Si tomabas en vaso reutilizable en vez de botella, tu huella sería ${kg} menor.`,
    separar: (kg) => `Si separabas tus residuos en los tachos correctos, tu huella sería ${kg} menor.`,
    compras: (kg) => `Si te llevabas solo algo pequeño, tu huella sería ${kg} menor.`,
  },

  metodologia: {
    titulo: '¿Cómo calculamos esto?',
    cerrar: 'Cerrar',
    intro:
      'Estimamos las emisiones de gases de efecto invernadero de tu visita, expresadas en kilogramos de CO₂ equivalente (kg CO₂e). Cada respuesta se multiplica por un factor de emisión publicado, y los resultados se suman.',
    formulasTitulo: 'Cálculos',
    formulas: [
      'Movilidad = distancia × factor del medio ÷ personas en el vehículo (solo auto y moto). Con "Ida y vuelta", se cuenta la distancia dos veces; si volviste en otro medio, la vuelta usa ese factor.',
      'Remis o taxi: factor del auto más los kilómetros que el vehículo recorre vacío para buscarte y volver. No se divide entre pasajeros.',
      'Comida y bebida = factor por porción del plato + factor por vaso de cerveza × cantidad de vasos + factor por unidad de las demás bebidas.',
      'Residuos = residuos estimados por visitante × factor de disposición. Si separás, una parte se recicla; si no, todo va a relleno o basural. La basura tirada fuera de los tachos no suma CO₂e extra: su daño es contaminación de suelo y agua.',
      'Compras = factor de la opción elegida ("Varias cosas" = una prenda y dos objetos chicos).',
      'Las distancias por calle se calculan con OSRM sobre datos de OpenStreetMap. Si el servicio falla, usamos la distancia en línea recta más un 30 %.',
    ],
    tablaTitulo: 'Factores de emisión y fuentes',
    columnas: { factor: 'Factor', valor: 'Valor', fuente: 'Fuente', anio: 'Año' },
    estimado: 'Estimado',
    estimadoExplicacion:
      '"Estimado" indica que el valor surge de un supuesto propio o no pudo verificarse en la fuente primaria. Lo revisamos y lo actualizamos cuando aparecen mejores datos.',
    sinEnlace: 'Sin enlace',
    nivelesTitulo: 'Niveles',
    limitacionesTitulo: 'Limitaciones',
    limitaciones:
      'Es una estimación educativa, no una medición. Los factores son promedios: tu impacto real depende del vehículo, del origen de los alimentos y de cómo se gestionan los residuos en Corrientes. Preferimos fuentes argentinas cuando existen; para el resto usamos fuentes internacionales reconocidas.',
  },

  opciones: {
    medios: {
      pie_bici: 'A pie / bicicleta',
      colectivo: 'Colectivo urbano',
      moto: 'Moto',
      auto: 'Auto',
      remis: 'Remis / taxi',
    },
    comidas: {
      vacuna: 'Carne vacuna / roja',
      blanca: 'Carne blanca (pollo, cerdo, pescado)',
      vegetariana: 'Plato vegetariano / vegano',
      ninguna: 'No comí',
    },
    bebidas: {
      alcohol: 'Bebidas alcohólicas (cerveza)',
      botella: 'Gaseosa o agua embotellada',
      reutilizable: 'Bebida en vaso reutilizable / agua de dispenser',
      ninguna: 'No tomé nada',
    },
    residuos: {
      separe: 'Separé y usé los tachos correctos',
      mismo_tacho: 'Tiré todo al mismo tacho',
      fuera: 'Dejé residuos fuera de los tachos',
    },
    compras: {
      nada: 'Nada',
      pequeno: 'Algo pequeño (accesorios, artesanías chicas)',
      prenda: 'Una prenda de ropa',
      varias: 'Varias cosas',
    },
  },

  errores: {
    titulo: 'Revisá estos datos antes de seguir:',
    sinMedio: 'Elegí cómo llegaste a la Fiesta.',
    sinMedioVuelta: 'Elegí cómo volviste, o activá "Ida y vuelta".',
    distanciaCero:
      'Elegiste un medio con motor, pero la distancia es 0 km. Ingresá la distancia aproximada que recorriste.',
    sinComida: 'Elegí qué comiste (o marcá "No comí").',
    sinBebida: 'Elegí qué tomaste (o marcá "No tomé nada").',
    sinResiduos: 'Elegí qué hiciste con tus residuos.',
    sinCompras: 'Elegí si compraste algo (o marcá "Nada").',
  },
};

export default TEXTOS;
