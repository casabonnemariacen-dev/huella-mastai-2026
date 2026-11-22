-- ════════════════════════════════════════════════════════════════════════════
-- Migración 002: acceso solo por funciones SECURITY DEFINER ejecutables por anon
--
-- Se ejecuta DESPUÉS de la 001 (SQL Editor → New query → pegar todo → Run).
-- Se puede ejecutar más de una vez.
--
-- Resultado:
--   · public.resultados: RLS activado, sin políticas y sin ningún permiso para
--     public, anon ni authenticated → sin acceso directo desde la API.
--   · Escritura: solo con registrar_resultado(jsonb) (valida todo).
--   · Botón "No guardar": solo con borrar_resultado(uuid).
--   · Lectura: solo con resumen_publico(), que lee de la vista resumen_evento
--     y devuelve únicamente cantidad y promedios.
--   · Las tres funciones las puede ejecutar SOLO el rol anon (la app).
--   · Las vistas de organizadores no son accesibles por anon ni authenticated:
--     se consultan desde el panel de Supabase.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Quitar las funciones de la 001 que se reemplazan ─────────────────────
drop function if exists public.guardar_resultado(jsonb);
drop function if exists public.estadisticas_publicas();

-- ── 2. Tabla: sin acceso directo para nadie salvo el dueño ──────────────────
alter table public.resultados enable row level security;
revoke all on table public.resultados from public, anon, authenticated;

-- ── 3. registrar_resultado: única forma de escribir ─────────────────────────
-- Valida forma y valores antes de insertar; además rigen los CHECK de la
-- tabla (rangos de 0 a 500, opciones permitidas, total = suma de categorías).
-- Si el id ya existe y el registro tiene menos de 3 horas, lo actualiza
-- (la persona editó sus respuestas); si es más viejo, no cambia nada.
create or replace function public.registrar_resultado(p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id      uuid;
  v_claves  text[] := array[
    'id', 'version_app', 'total', 'movilidad', 'alimentacion', 'residuos_kg', 'compras_kg', 'nivel',
    'medio_ida', 'ocupantes_ida', 'ida_y_vuelta', 'medio_vuelta', 'ocupantes_vuelta',
    'distancia_km', 'fuente_distancia', 'comida', 'bebidas', 'vasos', 'residuos', 'compras'
  ];
  v_extra   text;
begin
  -- Forma general
  if p is null or jsonb_typeof(p) <> 'object' then
    raise exception 'El registro tiene que ser un objeto JSON' using errcode = '22023';
  end if;
  select k into v_extra from jsonb_object_keys(p) as k where k <> all (v_claves) limit 1;
  if v_extra is not null then
    raise exception 'Campo no permitido: %', v_extra using errcode = '22023';
  end if;

  -- id: UUID versión 4 (generado al azar por el navegador)
  if coalesce(p ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'id inválido' using errcode = '22023';
  end if;
  v_id := (p ->> 'id')::uuid;

  -- Tipos
  if jsonb_typeof(p -> 'total') <> 'number' or jsonb_typeof(p -> 'movilidad') <> 'number'
     or jsonb_typeof(p -> 'alimentacion') <> 'number' or jsonb_typeof(p -> 'residuos_kg') <> 'number'
     or jsonb_typeof(p -> 'compras_kg') <> 'number' or jsonb_typeof(p -> 'distancia_km') <> 'number' then
    raise exception 'Los valores numéricos son obligatorios' using errcode = '22023';
  end if;
  if jsonb_typeof(p -> 'ida_y_vuelta') is distinct from 'boolean' then
    raise exception 'ida_y_vuelta tiene que ser verdadero o falso' using errcode = '22023';
  end if;
  if jsonb_typeof(p -> 'bebidas') is distinct from 'array' then
    raise exception 'bebidas tiene que ser una lista' using errcode = '22023';
  end if;

  -- Reglas de las respuestas
  if (p ->> 'ida_y_vuelta')::boolean and p ->> 'medio_vuelta' is not null then
    raise exception 'Con ida y vuelta no se indica medio de vuelta' using errcode = '22023';
  end if;
  if not (p ->> 'ida_y_vuelta')::boolean and p ->> 'medio_vuelta' is null then
    raise exception 'Falta el medio de la vuelta' using errcode = '22023';
  end if;
  if (p -> 'bebidas') ? 'ninguna' and jsonb_array_length(p -> 'bebidas') > 1 then
    raise exception '"ninguna" no se combina con otras bebidas' using errcode = '22023';
  end if;
  if ((p -> 'bebidas') ? 'alcohol') <> (p ->> 'vasos' is not null) then
    raise exception 'vasos se indica solo si hay bebidas alcohólicas' using errcode = '22023';
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
    round((p ->> 'distancia_km')::numeric)::smallint,
    p ->> 'fuente_distancia',
    p ->> 'comida',
    array(select distinct jsonb_array_elements_text(p -> 'bebidas')),
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

-- ── 4. borrar_resultado: botón "No guardar" (solo registros de < 3 horas) ───
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

-- ── 5. resumen_publico: única forma de leer, a partir de resumen_evento ─────
-- Devuelve solo cantidad y promedios (nunca filas ni datos individuales).
create or replace function public.resumen_publico()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'cantidad',              e.visitas,
    'promedio_total',        e.promedio_kg,
    'promedio_movilidad',    e.promedio_movilidad_kg,
    'promedio_alimentacion', e.promedio_alimentacion_kg,
    'promedio_residuos',     e.promedio_residuos_kg,
    'promedio_compras',      e.promedio_compras_kg
  )
  from public.resumen_evento as e;
$$;

-- ── 6. Permisos de ejecución: SOLO anon ─────────────────────────────────────
-- Supabase da EXECUTE por defecto a anon, authenticated y service_role sobre
-- funciones nuevas; se quita a todos y se otorga solo a anon.
revoke all on function public.registrar_resultado(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.borrar_resultado(uuid)     from public, anon, authenticated, service_role;
revoke all on function public.resumen_publico()          from public, anon, authenticated, service_role;
grant execute on function public.registrar_resultado(jsonb) to anon;
grant execute on function public.borrar_resultado(uuid)     to anon;
grant execute on function public.resumen_publico()          to anon;

-- ── 7. Vistas de organizadores: sin acceso desde la API ─────────────────────
revoke all on public.resumen_evento          from public, anon, authenticated;
revoke all on public.resumen_por_dia         from public, anon, authenticated;
revoke all on public.distribucion_respuestas from public, anon, authenticated;

-- ── 8. Comprobación (se muestra como resultado de la consulta) ──────────────
-- Esperado: tabla y vistas → false para anon y authenticated;
-- funciones → true solo para anon.
select objeto, rol, tiene_permiso
from (
  values
    ('tabla resultados (select)',  'anon',          has_table_privilege('anon', 'public.resultados', 'select')),
    ('tabla resultados (insert)',  'anon',          has_table_privilege('anon', 'public.resultados', 'insert')),
    ('tabla resultados (select)',  'authenticated', has_table_privilege('authenticated', 'public.resultados', 'select')),
    ('vista resumen_evento',       'anon',          has_table_privilege('anon', 'public.resumen_evento', 'select')),
    ('vista resumen_por_dia',      'anon',          has_table_privilege('anon', 'public.resumen_por_dia', 'select')),
    ('vista distribucion_respuestas', 'anon',       has_table_privilege('anon', 'public.distribucion_respuestas', 'select')),
    ('registrar_resultado',        'anon',          has_function_privilege('anon', 'public.registrar_resultado(jsonb)', 'execute')),
    ('registrar_resultado',        'authenticated', has_function_privilege('authenticated', 'public.registrar_resultado(jsonb)', 'execute')),
    ('borrar_resultado',           'anon',          has_function_privilege('anon', 'public.borrar_resultado(uuid)', 'execute')),
    ('borrar_resultado',           'authenticated', has_function_privilege('authenticated', 'public.borrar_resultado(uuid)', 'execute')),
    ('resumen_publico',            'anon',          has_function_privilege('anon', 'public.resumen_publico()', 'execute')),
    ('resumen_publico',            'authenticated', has_function_privilege('authenticated', 'public.resumen_publico()', 'execute'))
) as t(objeto, rol, tiene_permiso);
