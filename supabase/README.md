# Supabase – guardado anónimo de resultados

La app guarda cada resultado **de forma anónima** en Supabase para mostrar "tu huella
frente al promedio de la Fiesta". No se guarda origen, coordenadas, IP ni ningún dato
personal: solo los totales por categoría y las opciones elegidas (medio, km redondeados,
comida, bebidas, residuos, compras).

## Cómo funciona

```
Navegador (GitHub Pages)  ──clave pública (rol anon)──▶  Supabase (Postgres)
                                                          ├─ registrar_resultado(jsonb)
                                                          ├─ borrar_resultado(uuid)
                                                          └─ resumen_publico()  ← lee de resumen_evento
```

- La **clave pública** (publishable / anon) queda dentro de la app y cualquiera puede
  verla: es así por diseño. La protección está en la base de datos.
- **Sin acceso directo a la tabla:** `resultados` tiene RLS activado, ninguna política
  y ningún permiso para `public`, `anon` ni `authenticated` (en el panel figura como
  "API deshabilitada").
- **Escritura solo con `registrar_resultado`** (`SECURITY DEFINER`, `search_path` vacío):
  rechaza campos no permitidos (por ejemplo `origen` o `ip`), tipos incorrectos,
  respuestas incoherentes y valores fuera de rango; además rigen los CHECK de la tabla.
  Hace *upsert* por `id`: si la persona edita sus respuestas, se actualiza el mismo
  registro. Pasadas 3 horas, el registro ya no se puede modificar ni borrar.
- **"No guardar"** usa `borrar_resultado`, con la misma ventana de 3 horas.
- **Lectura solo con `resumen_publico`**, que toma cantidad y promedios de la vista
  `resumen_evento`. Nunca devuelve filas.
- Las tres funciones las ejecuta **solo el rol `anon`** (ni `authenticated` ni
  `service_role`). Las vistas de organizadores no son accesibles por la API.
- El `id` es un UUID v4 al azar que genera el navegador para cada visita.

## Instalación (una sola vez)

1. Entrá a <https://supabase.com/dashboard> y abrí el proyecto.
2. **SQL Editor → New query**: ejecutá, **en orden**, cada migración (pegar todo → **Run**):
   1. [`migrations/001_resultados_anonimos.sql`](migrations/001_resultados_anonimos.sql):
      tabla y vistas.
   2. [`migrations/002_acceso_solo_por_funciones.sql`](migrations/002_acceso_solo_por_funciones.sql):
      funciones y permisos definitivos. Al final muestra una tabla de comprobación:
      tabla y vistas en `false` para `anon`; las tres funciones en `true` solo para `anon`.
   Las dos se pueden volver a ejecutar sin problema.
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
