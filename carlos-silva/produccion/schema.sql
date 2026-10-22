-- Carlos Silva · esquema de producción (Supabase). Ejecutar completo en SQL Editor, una sola vez.
-- Datos de salud: todo queda protegido con RLS; el cliente solo accede con su enlace personal (token).

create schema if not exists carlos;
create extension if not exists pgcrypto with schema extensions;

-- Quién es coach (se llena a mano, ver LEEME.md)
create table if not exists carlos.coaches (user_id uuid primary key references auth.users(id) on delete cascade);

create table if not exists carlos.clientes (
  id uuid primary key default gen_random_uuid(),
  datos jsonb not null default '{}'::jsonb,   -- perfil, rutina, plan, InBody, evaluaciones, suplementos
  activo boolean not null default true,
  token_hash text unique,                      -- SHA-256 del enlace personal (el token nunca se guarda)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists carlos.ejercicios_custom (
  id text primary key,
  datos jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function carlos.tocar() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists clientes_tocar on carlos.clientes;
create trigger clientes_tocar before update on carlos.clientes for each row execute function carlos.tocar();

alter table carlos.coaches enable row level security;          -- sin políticas: nadie la lee desde la API
alter table carlos.clientes enable row level security;
alter table carlos.ejercicios_custom enable row level security;

create or replace function carlos.es_coach() returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from carlos.coaches where user_id = auth.uid()) $$;
revoke all on function carlos.es_coach() from public;
grant execute on function carlos.es_coach() to authenticated;

drop policy if exists coach_clientes on carlos.clientes;
create policy coach_clientes on carlos.clientes for all to authenticated
  using (carlos.es_coach()) with check (carlos.es_coach());
drop policy if exists coach_custom on carlos.ejercicios_custom;
create policy coach_custom on carlos.ejercicios_custom for all to authenticated
  using (carlos.es_coach()) with check (carlos.es_coach());

-- Plan del cliente por token: devuelve SOLO lo que el cliente debe ver (sin teléfono, lesiones, PAR-Q ni notas).
create or replace function carlos.plan_por_token(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c carlos.clientes;
begin
  if p_token is null or length(p_token) < 32 then return null; end if;
  select * into c from carlos.clientes
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and activo;
  if not found then return null; end if;
  return jsonb_build_object(
    'v', 2, 'nombre', c.datos->>'nombre', 'obj', c.datos->>'obj', 'nivel', c.datos->>'nivel', 'cm', c.datos->'cm',
    'creado', to_char(c.created_at, 'YYYY-MM-DD'),
    'rutina', c.datos->'rutina', 'plan', c.datos->'plan', 'supl', coalesce(c.datos->'supl', '[]'::jsonb),
    'medidas', (select coalesce(jsonb_agg(e order by o), '[]'::jsonb) from (
        select e, o from jsonb_array_elements(coalesce(c.datos->'medidas', '[]'::jsonb)) with ordinality t(e, o) order by o desc limit 6) s),
    'evals', (select coalesce(jsonb_agg(e order by o), '[]'::jsonb) from (
        select e, o from jsonb_array_elements(coalesce(c.datos->'evals', '[]'::jsonb)) with ordinality t(e, o) order by o desc limit 3) s),
    'custom', (select coalesce(jsonb_agg(x.datos), '[]'::jsonb) from carlos.ejercicios_custom x));
end $$;
revoke all on function carlos.plan_por_token(text) from public;
grant execute on function carlos.plan_por_token(text) to anon, authenticated;

grant usage on schema carlos to anon, authenticated;
grant select, insert, update, delete on carlos.clientes, carlos.ejercicios_custom to authenticated;
