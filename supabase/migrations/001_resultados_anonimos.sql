-- ════════════════════════════════════════════════════════════════════════════
-- Calculadora de Huella de Carbono – Mastai 2026 (IANES / UCP)
-- Migración 001: guardado anónimo de resultados
--
-- Cómo usarla: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede ejecutar más de una vez sin romper nada.
--
-- Seguridad (la app usa la clave PÚBLICA, que cualquiera puede ver):
--   · La tabla tiene RLS activado y SIN políticas → anon y authenticated no
--     pueden leerla ni escribirla directamente.
--   · Solo pueden ejecutar tres funciones:
--       guardar_resultado(jsonb)   inserta o actualiza UN registro por id
--       borrar_resultado(uuid)     botón "No guardar"
--       estadisticas_publicas()    solo promedios y cantidad, nunca filas
--   · Las funciones validan todo con CHECK: valores fuera de rango o
--     inexistentes se rechazan.
--   · No se guarda origen, coordenadas, IP ni datos personales.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Tabla ───────────────────────────────────────────────────────────────────
create table if not exists public.resultados (
  id                uuid        primary key,          -- generado al azar en el navegador
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now(),
  version_app       smallint    not null default 1 check (version_app between 1 and 100),

  -- Resultados (kg CO₂e)
  total             numeric(7,3) not null check (total        between 0 and 500),
  movilidad         numeric(7,3) not null check (movilidad    between 0 and 500),
  alimentacion      numeric(7,3) not null check (alimentacion between 0 and 500),
  residuos_kg       numeric(7,3) not null check (residuos_kg  between 0 and 500),
  compras_kg        numeric(7,3) not null check (compras_kg   between 0 and 500),
  nivel             text        not null check (nivel in ('bajo', 'medio', 'alto')),

  -- Respuestas (los valores son los ids de src/data/opciones.js)
  medio_ida         text        not null check (medio_ida in ('pie_bici', 'colectivo', 'moto', 'auto', 'remis')),
  ocupantes_ida     smallint             check (ocupantes_ida between 1 and 8),
  ida_y_vuelta      boolean     not null,
  medio_vuelta      text                 check (medio_vuelta in ('pie_bici', 'colectivo', 'moto', 'auto', 'remis')),
  ocupantes_vuelta  smallint             check (ocupantes_vuelta between 1 and 8),
  distancia_km      smallint    not null check (distancia_km between 0 and 2000),  -- solo ida, redondeada a 1 km
  fuente_distancia  text        not null check (fuente_distancia in ('ruta', 'estimada', 'manual')),
  comida            text        not null check (comida in ('vacuna', 'blanca', 'vegetariana', 'ninguna')),
  bebidas           text[]      not null check (
                      cardinality(bebidas) between 1 and 4
                      and bebidas <@ array['alcohol', 'botella', 'reutilizable', 'ninguna']::text[]
                    ),
  vasos             smallint             check (vasos between 1 and 6),
  residuos          text        not null check (residuos in ('separe', 'mismo_tacho', 'fuera')),
  compras           text        not null check (compras in ('nada', 'pequeno', 'prenda', 'varias')),

  -- Coherencia: el total tiene que ser la suma de las categorías
  constraint total_coherente check (
    abs(total - (movilidad + alimentacion + residuos_kg + compras_kg)) < 0.05
  )
);

comment on table public.resultados is
  'Resultados anónimos de la calculadora de huella de carbono (Mastai 2026). Sin datos personales.';

create index if not exists resultados_creado_en_idx on public.resultados (creado_en);

alter table public.resultados enable row level security;
revoke all on table public.resultados from anon, authenticated;

-- ── guardar_resultado: insertar o actualizar un registro ────────────────────
-- Actualizar solo es posible dentro de las 3 horas desde la creación (para
-- que la persona pueda editar sus respuestas sin duplicar el registro).
create or replace function public.guardar_resultado(p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := (p ->> 'id')::uuid;
begin
  if v_id is null then
    raise exception 'Falta el id del registro';
  end if;

  insert into public.resultados as r (
    id, version_app,
    total, movilidad, alimentacion, residuos_kg, compras_kg, nivel,
    medio_ida, ocupantes_ida, ida_y_vuelta, medio_vuelta, ocupantes_vuelta,
    distancia_km, fuente_distancia, comida, bebidas, vasos, residuos, compras
  )
  values (
    v_id,
    coalesce((p ->> 'version_app')::smallint, 1),
    (p ->> 'total')::numeric,
    (p ->> 'movilidad')::numeric,
    (p ->> 'alimentacion')::numeric,
    (p ->> 'residuos_kg')::numeric,
    (p ->> 'compras_kg')::numeric,
    p ->> 'nivel',
    p ->> 'medio_ida',
    (p ->> 'ocupantes_ida')::smallint,
    (p ->> 'ida_y_vuelta')::boolean,
    p ->> 'medio_vuelta',
    (p ->> 'ocupantes_vuelta')::smallint,
    (p ->> 'distancia_km')::smallint,
    p ->> 'fuente_distancia',
    p ->> 'comida',
    array(select jsonb_array_elements_text(coalesce(p -> 'bebidas', '[]'::jsonb))),
    (p ->> 'vasos')::smallint,
    p ->> 'residuos',
    p ->> 'compras'
  )
  on conflict (id) do update set
    actualizado_en   = now(),
    version_app      = excluded.version_app,
    total            = excluded.total,
    movilidad        = excluded.movilidad,
    alimentacion     = excluded.alimentacion,
    residuos_kg      = excluded.residuos_kg,
    compras_kg       = excluded.compras_kg,
    nivel            = excluded.nivel,
    medio_ida        = excluded.medio_ida,
    ocupantes_ida    = excluded.ocupantes_ida,
    ida_y_vuelta     = excluded.ida_y_vuelta,
    medio_vuelta     = excluded.medio_vuelta,
    ocupantes_vuelta = excluded.ocupantes_vuelta,
    distancia_km     = excluded.distancia_km,
    fuente_distancia = excluded.fuente_distancia,
    comida           = excluded.comida,
    bebidas          = excluded.bebidas,
    vasos            = excluded.vasos,
    residuos         = excluded.residuos,
    compras          = excluded.compras
  where r.creado_en > now() - interval '3 hours';
end;
$$;

-- ── borrar_resultado: botón "No guardar" ────────────────────────────────────
create or replace function public.borrar_resultado(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.resultados
  where id = p_id
    and creado_en > now() - interval '3 hours';
$$;

-- ── estadisticas_publicas: solo agregados ───────────────────────────────────
create or replace function public.estadisticas_publicas()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'cantidad',             count(*),
    'promedio_total',       round(avg(total), 3),
    'promedio_movilidad',   round(avg(movilidad), 3),
    'promedio_alimentacion', round(avg(alimentacion), 3),
    'promedio_residuos',    round(avg(residuos_kg), 3),
    'promedio_compras',     round(avg(compras_kg), 3)
  )
  from public.resultados;
$$;

-- Permisos: nadie ejecuta por defecto; solo la app (anon) y usuarios logueados.
revoke all on function public.guardar_resultado(jsonb)  from public;
revoke all on function public.borrar_resultado(uuid)    from public;
revoke all on function public.estadisticas_publicas()   from public;
grant execute on function public.guardar_resultado(jsonb) to anon, authenticated;
grant execute on function public.borrar_resultado(uuid)   to anon, authenticated;
grant execute on function public.estadisticas_publicas()  to anon, authenticated;

-- ── Vistas para organizadores (se consultan desde el panel de Supabase) ─────
-- No se exponen a la app: anon y authenticated no tienen permiso.

-- Resumen general del evento
create or replace view public.resumen_evento with (security_invoker = true) as
select
  count(*)                                   as visitas,
  round(sum(total), 2)                       as huella_total_kg,
  round(avg(total), 2)                       as promedio_kg,
  round(percentile_cont(0.5) within group (order by total)::numeric, 2) as mediana_kg,
  round(avg(movilidad), 2)                   as promedio_movilidad_kg,
  round(avg(alimentacion), 2)                as promedio_alimentacion_kg,
  round(avg(residuos_kg), 2)                 as promedio_residuos_kg,
  round(avg(compras_kg), 2)                  as promedio_compras_kg,
  count(*) filter (where nivel = 'bajo')     as nivel_bajo,
  count(*) filter (where nivel = 'medio')    as nivel_medio,
  count(*) filter (where nivel = 'alto')     as nivel_alto,
  min(creado_en)                             as primer_registro,
  max(creado_en)                             as ultimo_registro
from public.resultados;

-- Registros por día (hora argentina)
create or replace view public.resumen_por_dia with (security_invoker = true) as
select
  (creado_en at time zone 'America/Argentina/Buenos_Aires')::date as dia,
  count(*)                    as visitas,
  round(sum(total), 2)        as huella_total_kg,
  round(avg(total), 2)        as promedio_kg
from public.resultados
group by 1
order by 1;

-- Cómo respondió la gente: cantidad y porcentaje por opción
create or replace view public.distribucion_respuestas with (security_invoker = true) as
with base as (
  select 'medio_ida' as pregunta, medio_ida as opcion from public.resultados
  union all select 'medio_vuelta', medio_vuelta from public.resultados where not ida_y_vuelta
  union all select 'comida', comida from public.resultados
  union all select 'bebidas', unnest(bebidas) from public.resultados
  union all select 'residuos', residuos from public.resultados
  union all select 'compras', compras from public.resultados
  union all select 'nivel', nivel from public.resultados
)
select
  pregunta,
  coalesce(opcion, 'sin dato') as opcion,
  count(*) as cantidad,
  round(100.0 * count(*) / nullif((select count(*) from public.resultados), 0), 1) as porcentaje_visitas
from base
group by pregunta, opcion
order by pregunta, cantidad desc;

revoke all on public.resumen_evento          from anon, authenticated;
revoke all on public.resumen_por_dia         from anon, authenticated;
revoke all on public.distribucion_respuestas from anon, authenticated;
