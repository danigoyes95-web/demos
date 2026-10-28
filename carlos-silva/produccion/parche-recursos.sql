-- Videos y lecturas que Carlos comparte con sus clientes (pestaña «Recursos» del panel).
-- Ejecuta este archivo UNA vez en Supabase → SQL Editor. Solo actualiza la función mi_plan() para que el cliente reciba sus enlaces.
-- Plan del cliente: SOLO lo que debe ver (sin teléfono, lesiones, PAR-Q, notas ni consentimiento).
create or replace function carlos.mi_plan() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c carlos.clientes;
begin
  select * into c from carlos.clientes where user_id = auth.uid() and activo;
  if not found then return null; end if;
  if not carlos.mensualidad_activa(c.datos) then   -- sin mensualidad: no se entrega rutina, plan ni seguimiento
    return jsonb_build_object('v', 2, 'cid', c.id, 'nombre', c.datos->>'nombre', 'activa', false, 'vence', c.datos->>'vence',
      'creado', to_char(c.created_at, 'YYYY-MM-DD'), 'rutina', null, 'plan', null, 'supl', '[]'::jsonb, 'medidas', '[]'::jsonb, 'evals', '[]'::jsonb, 'medcorp', '[]'::jsonb, 'custom', '[]'::jsonb);
  end if;
  return jsonb_build_object(
    'v', 2, 'activa', true, 'cid', c.id, 'nombre', c.datos->>'nombre', 'obj', c.datos->>'obj', 'nivel', c.datos->>'nivel', 'cm', c.datos->'cm', 'sx', c.datos->>'sx',
    'creado', to_char(c.created_at, 'YYYY-MM-DD'), 'vence', c.datos->>'vence',
    'rutina', c.datos->'rutina', 'plan', c.datos->'plan', 'supl', coalesce(c.datos->'supl', '[]'::jsonb),
    'recursos', (select coalesce(jsonb_agg(e order by o desc), '[]'::jsonb) from (
        select e, o from jsonb_array_elements(coalesce(c.datos->'recursos', '[]'::jsonb)) with ordinality t(e, o) order by o desc limit 30) s),
    'medidas', (select coalesce(jsonb_agg(e order by o), '[]'::jsonb) from (
        select e, o from jsonb_array_elements(coalesce(c.datos->'medidas', '[]'::jsonb)) with ordinality t(e, o) order by o desc limit 6) s),
    'evals', (select coalesce(jsonb_agg(e order by o), '[]'::jsonb) from (
        select e, o from jsonb_array_elements(coalesce(c.datos->'evals', '[]'::jsonb)) with ordinality t(e, o) order by o desc limit 3) s),
    'medcorp', (select coalesce(jsonb_agg(e order by o), '[]'::jsonb) from (
        select e, o from jsonb_array_elements(coalesce(c.datos->'medcorp', '[]'::jsonb)) with ordinality t(e, o) order by o desc limit 6) s),
    'custom', (select coalesce(jsonb_agg(x.datos), '[]'::jsonb) from carlos.ejercicios_custom x));
end $$;
