# Fase 2 – Funciones de Netlify (sin implementar)

Arquitectura propuesta para guardar resultados anónimos y mostrar el promedio de
la Fiesta. El cliente ya llama a estas rutas desde `src/servicios/almacenamiento.js`
cuando `FASE2_HABILITADA = true` en `src/config/evento.js`.

## Almacenamiento
[Netlify Blobs](https://docs.netlify.com/blobs/overview/): un store `resultados`
con un blob por envío y un blob `agregados` con sumas acumuladas (cantidad,
suma total y suma por categoría), para no recorrer todos los envíos en cada lectura.

## Endpoints
| Método | Ruta | Cuerpo / respuesta |
|---|---|---|
| POST | `/.netlify/functions/resultados` | `{ total, porCategoria, nivel, version }` → `201` |
| GET | `/.netlify/functions/promedio` | `{ cantidad, promedioKg, porCategoria }` |
| GET | `/.netlify/functions/panel` | Totales del evento para organizadores (protegido con una clave en variable de entorno) |

## Privacidad
- No se guarda origen, coordenadas, IP ni ningún dato que identifique a la persona.
- Validar en el servidor rangos razonables (0–500 kg CO₂e) y limitar envíos por
  sesión para evitar inflar el promedio.
- Mostrar la comparación "tu huella frente al promedio" solo con una cantidad
  mínima de envíos (por ejemplo, 30).
