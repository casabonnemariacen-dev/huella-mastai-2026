# Supabase – guardado anónimo de resultados

La app guarda cada resultado **de forma anónima** en Supabase para mostrar "tu huella
frente al promedio de la Fiesta". No se guarda origen, coordenadas, IP ni ningún dato
personal: solo los totales por categoría y las opciones elegidas (medio, km redondeados,
comida, bebidas, residuos, compras).

## Cómo funciona

```
Navegador (GitHub Pages)  ──clave pública──▶  Supabase (Postgres)
                                               ├─ guardar_resultado(jsonb)
                                               ├─ borrar_resultado(uuid)
                                               └─ estadisticas_publicas()
```

- La **clave pública** (publishable / anon) queda dentro de la app y cualquiera puede
  verla: es así por diseño. La protección está en la base de datos.
- La tabla `resultados` tiene **RLS activado sin políticas**: con la clave pública no se
  puede leer ni escribir directamente. Solo se pueden ejecutar las tres funciones.
- `guardar_resultado` valida cada valor (rangos de 0 a 500 kg CO₂e, opciones
  permitidas, total igual a la suma de las categorías) y hace *upsert* por `id`.
- El `id` es un UUID al azar que genera el navegador para cada visita. Si la persona
  edita sus respuestas, se actualiza el mismo registro. Pasadas 3 horas, el registro
  ya no se puede modificar ni borrar desde la app.
- `estadisticas_publicas` devuelve solo cantidad y promedios, nunca filas.

## Instalación (una sola vez)

1. Entrá a <https://supabase.com/dashboard> y abrí el proyecto.
2. **SQL Editor → New query**, pegá todo el contenido de
   [`migrations/001_resultados_anonimos.sql`](migrations/001_resultados_anonimos.sql) y
   tocá **Run**. Tiene que decir *Success. No rows returned*. Se puede volver a ejecutar
   sin problema.
3. **Project Settings → API Keys** (o *Data API*): copiá
   - la **Project URL** (`https://xxxx.supabase.co`), y
   - la **publishable key** (`sb_publishable_…`) o, en proyectos con claves anteriores,
     la **anon public**.
   **Nunca** uses en la app la `secret` / `service_role`: da acceso total a la base.
4. Cargá esos dos valores como variables del repositorio en GitHub
   (*Settings → Secrets and variables → Actions → Variables*):
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_CLAVE_PUBLICA`. Para probar en tu computadora,
   copialos en un archivo `.env.local` (ver `.env.example`).

## Ver los datos (organizadores)

En **Table Editor** o **SQL Editor**:

| Vista / tabla | Qué muestra |
|---|---|
| `resumen_evento` | Visitas, huella total del evento, promedio, mediana, promedios por categoría y cantidad por nivel |
| `resumen_por_dia` | Visitas, huella total y promedio por día (hora argentina) |
| `distribucion_respuestas` | Cantidad y porcentaje por opción de cada pregunta (medio, comida, bebidas, residuos, compras, nivel) |
| `resultados` | Todos los registros (sin datos personales) |

Ejemplo en SQL Editor: `select * from resumen_evento;`

Las vistas **no** están disponibles con la clave pública: solo desde el panel.

**Exportar:** Table Editor → `resultados` → **Export → CSV**.

**Registros sospechosos:** si alguien cargara datos falsos usando la clave pública,
se pueden revisar y borrar desde el Table Editor (por ejemplo, ordenando por `total`).

## Plan gratuito: pausa por inactividad

En el plan gratuito, Supabase **pausa el proyecto después de unos 7 días sin actividad**.
Un proyecto pausado no recibe datos (la app sigue funcionando, pero sin guardar ni
mostrar el promedio). Antes del evento, entrá al panel y verificá que el proyecto esté
activo; si está pausado, tocá **Restore project**.

## Después del evento

1. Exportá `resultados` a CSV.
2. Decidí si conservar los datos o borrarlos (`delete from resultados;`).
