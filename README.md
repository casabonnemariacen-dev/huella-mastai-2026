# Calculadora de Huella de Carbono – Mastai – Fiesta de la Cerveza del NEA Argentino, Corrientes 2026

Herramienta educativa de **IANES / UCP (Universidad de la Cuenca del Plata)** para que
quienes visitan la Fiesta (Anfiteatro Mario del Tránsito Cocomarola, Av. Domingo
Sarmiento 2650, W3400 Corrientes) estimen la huella de carbono **de su visita** —no su
huella anual— en kg CO₂e.

Asistente de 6 pasos: bienvenida → movilidad → comida y bebida → residuos → compras →
resultados (total, nivel, equivalencias, gráficos, recomendaciones, compartir, descarga
CSV/JSON y metodología con todas las fuentes).

- **Tecnología:** React 19 + Vite, Leaflet + OpenStreetMap, Photon / Nominatim / OSRM.
- **Sitio estático** desplegable en Netlify.
- **Pruebas:** Vitest + Testing Library.

---

## Ejecutar localmente

Requisitos: [Node.js](https://nodejs.org/) 20 o superior (incluye npm).

```bash
npm install          # instala dependencias (una sola vez)
npm run dev          # servidor de desarrollo en http://localhost:5173
npm run dev -- --host  # además lo expone en la red local, para probar desde el celular
npm test             # pruebas unitarias y de interfaz
npm run lint         # revisión de código
npm run build        # compila el sitio en dist/
npm run preview      # sirve dist/ para revisarlo antes de publicar
```

## Publicación actual: GitHub Pages

La app está publicada en **<https://casabonnemariacen-dev.github.io/huella-mastai-2026/>**.

- El workflow `.github/workflows/deploy-pages.yml` publica solo con cada `git push` a
  `main`: instala, **corre las pruebas** (si fallan, no publica), compila con
  `BASE_PATH=/huella-mastai-2026/` y sube `dist/` a Pages.
- También se puede lanzar a mano: pestaña *Actions → Publicar en GitHub Pages → Run workflow*.
- Servidor de rutas propio (opcional): definí la variable `VITE_URL_RUTAS` en
  *Settings → Secrets and variables → Actions → Variables* y volvé a ejecutar el workflow.
- Diferencias con Netlify: GitHub Pages no permite encabezados HTTP propios (los de
  `netlify.toml` no se aplican) ni redirecciones; la app no las necesita para funcionar.
- Para compilar localmente con la ruta de Pages: `BASE_PATH=/huella-mastai-2026/ npm run build`
  (en Git Bash de Windows, anteponé `MSYS_NO_PATHCONV=1`).

## Desplegar en Netlify

El archivo `netlify.toml` ya define todo (comando `npm run build`, carpeta `dist`,
Node 22, redirección para SPA y encabezados de seguridad y caché).

**Opción A – desde un repositorio (recomendada):**
1. Subí este repositorio a GitHub, GitLab o Bitbucket.
2. En Netlify: *Add new site → Import an existing project* y elegí el repositorio.
3. Netlify detecta la configuración de `netlify.toml`. Tocá *Deploy*.
4. Cada `git push` a la rama principal publica una versión nueva.

**Opción B – manual, sin repositorio:**
```bash
npm run build
npx netlify-cli deploy --dir=dist          # vista previa
npx netlify-cli deploy --dir=dist --prod   # producción
```
También podés arrastrar la carpeta `dist/` a <https://app.netlify.com/drop>.

**Variables de entorno (opcional):** en *Site configuration → Environment variables*
podés definir `VITE_URL_RUTAS` (ver la sección siguiente). Ver `.env.example`.

**Código QR:** generalo con la URL final del sitio (por ejemplo, `https://<tu-sitio>.netlify.app`).

## Servicio de rutas en producción

> ⚠️ **El servidor demo de OSRM (`router.project-osrm.org`) NO es apto para el uso
> masivo durante el evento.**

Es un servidor de demostración mantenido por voluntarios:
- **no tiene garantía de servicio (SLA)** y puede estar caído o lento;
- su política de uso limita a **1 solicitud por segundo** y prohíbe el uso intensivo;
- durante la Fiesta, muchas personas usarían la app a la vez **desde la misma red**
  (el wifi del evento o la misma antena de celular), y ese tráfico concentrado puede ser
  **bloqueado**.

La app ya está preparada para la falla: si la ruta no responde en 8 segundos, estima la
distancia (línea recta × 1,3) y la persona puede ajustarla con el deslizador o el campo
numérico. Aun así, para el evento recomendamos una de estas alternativas, de menor a
mayor esfuerzo:

1. **OpenRouteService** (<https://openrouteservice.org>): plan gratuito con clave de API
   (unas 2.000 rutas por día). Para no exponer la clave, conviene una Netlify Function
   que haga de *proxy* y traduzca la respuesta al formato OSRM, o adaptar
   `src/servicios/rutas.js`.
2. **Servicios comerciales con SLA:** GraphHopper, Stadia Maps o Geoapify (tienen planes
   gratuitos y pagos). Sus APIs no son idénticas a OSRM: hay que adaptar
   `interpretarOsrm` y la URL en `src/servicios/rutas.js`.
3. **OSRM propio:** un contenedor Docker con el extracto de Argentina de
   [Geofabrik](https://download.geofabrik.de/south-america/argentina.html) en un VPS
   económico (verificá los requisitos de memoria para preprocesar el extracto). Sin límites y con control total. Guía:
   <https://github.com/Project-OSRM/osrm-backend#using-docker>.
4. **Sin ruteo:** desactivar el cálculo de rutas y usar solo la distancia estimada y la
   carga manual (ya implementadas como respaldo).

Para cambiar el servidor sin tocar código, definí `VITE_URL_RUTAS` con la URL base de
cualquier API compatible con OSRM (por ejemplo `https://mi-osrm.ejemplo.org`) y volvé a
publicar. El valor por defecto está en `src/config/evento.js` (`SERVICIOS.rutas`).

**Búsqueda de direcciones:** el autocompletado usa **Photon** (photon.komoot.io), porque
la política de Nominatim prohíbe el autocompletado. Photon también es un servicio
público sin SLA: si falla, la app lo informa y se puede cargar la distancia a mano. La
búsqueda tiene *debounce* de 500 ms, mínimo 3 caracteres, como máximo 1 solicitud por
segundo, caché y sesgo geográfico hacia Corrientes (parámetros en `BUSQUEDA`, dentro de
`src/config/evento.js`).

## Cómo modificar factores, textos y datos del evento

| Qué | Archivo |
|---|---|
| **Factores de emisión** (valor, unidad, fuente, año, `estimado`, nota) | `src/data/factores.js` |
| Supuestos (consumo del auto, porción de carne, km en vacío del remis, residuos por visitante…) | constantes al inicio de `src/data/factores.js` |
| Opciones de cada paso y su vínculo con los factores | `src/data/opciones.js` |
| Umbrales de nivel (bajo / medio / alto) | `src/data/umbrales.js` |
| **Todos los textos visibles** (voseo) | `src/textos/es-AR.js` |
| Evento, sede, coordenadas, servicios, límites, Fase 2 | `src/config/evento.js` |
| Colores | `src/estilos/variables.css` |
| Logo | `public/ucp.png` (reemplazá el archivo o cambiá `RUTA_LOGO` en `src/componentes/Encabezado.jsx`) |

Notas:
- Los componentes **no tienen números sueltos**: todo sale de `src/data/`. La tabla
  de "¿Cómo calculamos esto?" se genera automáticamente desde `factores.js`.
- Después de cambiar un factor, corré `npm test`. Algunas pruebas verifican reglas
  (por ejemplo, remis ≥ auto, o que la carne vacuna sea el alimento de mayor impacto) y
  van a fallar si un cambio las rompe.
- Usá siempre la unidad escrita como `kg CO₂e` (hay una prueba que lo controla).

## Estructura

```
src/
├─ config/evento.js       Evento, sede, búsqueda, servicios, límites, Fase 2
├─ data/                  factores.js, opciones.js, umbrales.js
├─ textos/es-AR.js        Todos los textos
├─ calculo/               Funciones puras (sin React) + pruebas en __tests__/
├─ estado/                Reducer de respuestas, validaciones y sessionStorage
├─ servicios/             Photon/Nominatim, OSRM, limitador, almacenamiento (Fase 2)
├─ componentes/           Interfaz (pasos/, mapa, gráficos, metodología)
└─ estilos/               CSS mobile-first
netlify/functions/        Fase 2: contrato de la API (sin implementar)
```

## Metodología (resumen)

- **Movilidad:** km × factor del medio. Auto y moto se dividen entre las personas que
  viajaron. "Ida y vuelta" (activado por defecto) duplica la distancia; si lo
  desactivás, la vuelta usa su propio medio.
- **Remis / taxi:** factor del auto + 50 % de km en vacío (el vehículo viaja vacío a
  buscar al pasajero y a volver a su base o al próximo viaje; la literatura sobre taxis
  urbanos reporta 30–50 %). No se divide entre pasajeros.
- **Comida:** factor por porción (120 g de carne). **Cerveza:** por vaso de 500 ml ×
  cantidad de vasos. "No tomé nada" excluye las demás opciones.
- **Residuos:** 0,68 kg por visitante × factor de relleno, o mezcla de reciclado y
  relleno si se separa. Dejar basura fuera de los tachos **no suma CO₂e**: se muestra un
  mensaje sobre contaminación de suelo y agua.
- **Niveles:** bajo < 3 kg CO₂e; medio de 3 a 10; alto ≥ 10. No se compara con otros
  visitantes (eso requiere los datos reales de la Fase 2).
- Los resultados se muestran con 2 decimales y coma decimal (es-AR).

## Fuentes de los factores de emisión

"Estimado" = el valor surge de un supuesto propio o no se pudo verificar en la fuente
primaria. Conviene revisarlos con el equipo docente antes del evento.

| Factor | Valor | Fuente | Año | Estado |
|---|---|---|---|---|
| Red eléctrica argentina | 0,429 kg CO₂e/kWh | [Secretaría de Energía de la Nación, Cálculo del factor de emisión de CO₂ de la red argentina de energía eléctrica (margen de operación simple)](http://datos.energia.gob.ar/dataset/calculo-del-factor-de-emision-de-co2-de-la-red-argentina-de-energia-electrica) | 2023 | Verificado |
| A pie / bicicleta | 0 g CO₂e/km | Sin combustión directa | 2026 | Verificado |
| Colectivo urbano | 125 g CO₂e/km | [UK DESNZ, Greenhouse gas reporting: conversion factors 2025](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025) | 2025 | Estimado |
| Moto | 115 g CO₂e/km | [UK DESNZ, Greenhouse gas reporting: conversion factors 2025](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025) | 2025 | Estimado |
| Auto | 181,6 g CO₂e/km | [IPCC 2006, Directrices para inventarios nacionales de GEI, Vol. 2, Cap. 3 (Transporte), cuadro 3.2.1](https://www.ipcc-nggip.iges.or.jp/public/2006gl/spanish/vol2.html) | 2006 | Estimado |
| Remis / taxi | 272,4 g CO₂e/km | [IPCC 2006, Directrices para inventarios nacionales de GEI, Vol. 2, Cap. 3 (Transporte), cuadro 3.2.1](https://www.ipcc-nggip.iges.or.jp/public/2006gl/spanish/vol2.html) | 2026 | Estimado |
| Carne vacuna (porción) | 11,94 kg CO₂e/porción | [Poore y Nemecek (2018), Science 360:987–992, vía Our World in Data](https://ourworldindata.org/grapher/ghg-per-kg-poore) | 2018 | Verificado |
| Carne blanca (porción) | 1,43 kg CO₂e/porción | [Poore y Nemecek (2018), Science 360:987–992, vía Our World in Data](https://ourworldindata.org/grapher/ghg-per-kg-poore) | 2018 | Verificado |
| Plato vegetariano / vegano | 0,39 kg CO₂e/porción | [Poore y Nemecek (2018), Science 360:987–992, vía Our World in Data](https://ourworldindata.org/grapher/ghg-per-kg-poore) | 2018 | Estimado |
| Cerveza (vaso de 500 ml) | 0,5 kg CO₂e/vaso | [Morgan, Styles y Thomas Lane (2021), "Thirsty work: Assessing the environmental footprint of craft beer", Sustainable Production and Consumption 27:242–253](https://research.bangor.ac.uk/en/publications/thirsty-work-assessing-the-environmental-footprint-of-craft-beer/) | 2021 | Estimado |
| Gaseosa o agua embotellada (500 ml) | 0,2 kg CO₂e/unidad | Estimación propia a partir de huellas de producto publicadas por fabricantes de bebidas en PET de 500 ml (0,15–0,25 kg CO₂e) | 2026 | Estimado |
| Bebida en vaso reutilizable / agua de dispenser | 0,02 kg CO₂e/unidad | Estimación propia a partir de ACV de vasos reutilizables en eventos (lavado y amortización en muchos usos) | 2026 | Estimado |
| Residuos generados por visitante | 0,68 kg/visitante | [Julie’s Bicycle y Powerful Thinking, "The Show Must Go On" (3.ª edición, 2026)](https://juliesbicycle.org/wp-content/uploads/2026/02/SMGO_Report_2026_FINAL.pdf) | 2026 | Estimado |
| Residuo mezclado a relleno o basural | 0,5 kg CO₂e/kg | [UK DESNZ, Greenhouse gas reporting: conversion factors 2025](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025) | 2025 | Estimado |
| Residuo separado y reciclado | 0,021 kg CO₂e/kg | [UK DESNZ, Greenhouse gas reporting: conversion factors 2025](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025) | 2025 | Estimado |
| Compra pequeña (accesorio o artesanía chica) | 1 kg CO₂e/compra | Estimación propia (orden de magnitud de objetos chicos de tela, madera o metal) | 2026 | Estimado |
| Prenda de ropa (remera de algodón) | 6,5 kg CO₂e/prenda | [Rango de ACV de remeras de algodón (2,6–8,8 kg CO₂e; WRAP 2012: 28 kg CO₂e/kg de tela)](https://ckh.wrap.org.uk/clothingKnowledgeHub/detail/131) | 2012 | Estimado |
| Energía de una carga completa de celular | 0,0124 kWh/carga | [US EPA, Greenhouse Gas Equivalencies Calculator – Calculations and References](https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references) | 2024 | Verificado |

Otras fuentes:
- Coordenadas del Anfiteatro: [OpenStreetMap, nodo 3946938209](https://www.openstreetmap.org/node/3946938209) (verificadas con Nominatim el 21/11/2026).
- Paleta de los gráficos: validada para daltonismo (protanopía, deuteranopía y tritanopía).

## Fase 2 (preparada, no implementada)

Guardado anónimo de resultados para mostrar el promedio real de la Fiesta y un panel
para organizadores. Ver `netlify/functions/README.md` (Netlify Functions + Netlify
Blobs) y `src/servicios/almacenamiento.js`. Se activa con `FASE2_HABILITADA` en
`src/config/evento.js` una vez implementadas las funciones.

## Créditos

Desarrollo: IANES – Universidad de la Cuenca del Plata (UCP), 2026.
Mapas y datos de direcciones: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL).
