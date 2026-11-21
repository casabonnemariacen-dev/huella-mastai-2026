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
    provisorio: 'El detalle de resultados, gráficos y recomendaciones llega en la próxima etapa.',
    editar: 'Editar respuestas',
    recalcular: 'Volver a calcular',
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
