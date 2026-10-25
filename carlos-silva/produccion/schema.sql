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
  user_id uuid unique references auth.users(id) on delete set null,   -- cuenta del cliente (vinculada con su código)
  codigo_hash text unique,                     -- SHA-256 del código de invitación vigente (el código nunca se guarda)
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

-- Registro diario del cliente (lo ve el coach): ejercicios y comidas marcados, y reportes de peso/esfuerzo.
create table if not exists carlos.marcas (
  cliente_id uuid not null references carlos.clientes(id) on delete cascade,
  fecha date not null,
  clave text not null check (clave ~ '^[em][0-9]{1,2}$'),   -- e3 = ejercicio nº3 del día · m1 = comida nº1
  primary key (cliente_id, fecha, clave)
);
create table if not exists carlos.reportes (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references carlos.clientes(id) on delete cascade,
  fecha date not null default current_date,
  peso numeric check (peso between 20 and 400),
  rpe int check (rpe between 1 and 10),
  nota text check (length(nota) <= 500),
  created_at timestamptz not null default now()
);
alter table carlos.marcas enable row level security;
alter table carlos.reportes enable row level security;
drop policy if exists coach_marcas on carlos.marcas;
create policy coach_marcas on carlos.marcas for select to authenticated using (carlos.es_coach());
drop policy if exists coach_reportes on carlos.reportes;
create policy coach_reportes on carlos.reportes for select to authenticated using (carlos.es_coach());

-- El cliente NO lee tablas: solo usa estas funciones, que filtran por su propia cuenta (auth.uid()).
create or replace function carlos.mi_cliente() returns uuid
language sql stable security definer set search_path = '' as
$$ select id from carlos.clientes where user_id = auth.uid() and activo $$;
revoke all on function carlos.mi_cliente() from public;
grant execute on function carlos.mi_cliente() to authenticated;   -- lo usan las políticas de Storage

-- Vincula la cuenta recién creada con el cliente, usando el código que le dio Carlos (un solo uso).
create or replace function carlos.reclamar(p_codigo text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if auth.uid() is null or p_codigo is null or length(p_codigo) < 20 then return false; end if;
  update carlos.clientes set user_id = auth.uid(), codigo_hash = null
   where codigo_hash = encode(extensions.digest(p_codigo, 'sha256'), 'hex') and user_id is null and activo;
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- Mensualidad: el coach la activa desde su panel (fecha 'vence' dentro de datos). Activa = vence >= hoy (hora de Ecuador).
create or replace function carlos.hoy() returns date language sql stable set search_path = '' as
$$ select (now() at time zone 'America/Guayaquil')::date $$;
create or replace function carlos.mensualidad_activa(p_datos jsonb) returns boolean language sql stable set search_path = '' as
$$ select coalesce((p_datos->>'vence') ~ '^\d{4}-\d{2}-\d{2}$' and (p_datos->>'vence')::date >= (now() at time zone 'America/Guayaquil')::date, false) $$;

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
    'medidas', (select coalesce(jsonb_agg(e order by o), '[]'::jsonb) from (
        select e, o from jsonb_array_elements(coalesce(c.datos->'medidas', '[]'::jsonb)) with ordinality t(e, o) order by o desc limit 6) s),
    'evals', (select coalesce(jsonb_agg(e order by o), '[]'::jsonb) from (
        select e, o from jsonb_array_elements(coalesce(c.datos->'evals', '[]'::jsonb)) with ordinality t(e, o) order by o desc limit 3) s),
    'medcorp', (select coalesce(jsonb_agg(e order by o), '[]'::jsonb) from (
        select e, o from jsonb_array_elements(coalesce(c.datos->'medcorp', '[]'::jsonb)) with ordinality t(e, o) order by o desc limit 6) s),
    'custom', (select coalesce(jsonb_agg(x.datos), '[]'::jsonb) from carlos.ejercicios_custom x));
end $$;

create or replace function carlos.marcar(p_fecha date, p_clave text, p_on boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare cid uuid := carlos.mi_cliente();
begin
  if cid is null or p_fecha not between current_date - 8 and current_date + 8 then return; end if;
  if not carlos.mensualidad_activa((select datos from carlos.clientes where id = cid)) then return; end if;
  if p_on then insert into carlos.marcas(cliente_id, fecha, clave) values (cid, p_fecha, p_clave) on conflict do nothing;
  else delete from carlos.marcas where cliente_id = cid and fecha = p_fecha and clave = p_clave; end if;
end $$;

create or replace function carlos.mis_marcas(p_desde date) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('f', to_char(fecha, 'YYYY-MM-DD'), 'k', clave)), '[]'::jsonb)
    from carlos.marcas where cliente_id = carlos.mi_cliente() and fecha >= greatest(p_desde, current_date - 30) $$;

create or replace function carlos.reportar(p_peso numeric, p_rpe int, p_nota text) returns void
language plpgsql security definer set search_path = '' as $$
declare cid uuid := carlos.mi_cliente();
begin
  if cid is null then return; end if;
  if (select count(*) from carlos.reportes where cliente_id = cid and created_at > now() - interval '1 day') >= 20 then return; end if;
  insert into carlos.reportes(cliente_id, peso, rpe, nota) values (cid, p_peso, p_rpe, left(p_nota, 500));
end $$;

-- Fotos del check-in (frente, lateral, espalda): archivos en Storage (bucket privado) + registro aquí.
create table if not exists carlos.fotos (
  cliente_id uuid not null references carlos.clientes(id) on delete cascade,
  fecha date not null,
  vista text not null check (vista in ('frente', 'lateral', 'espalda')),
  path text not null,
  created_at timestamptz not null default now(),
  primary key (cliente_id, fecha, vista)
);
alter table carlos.fotos enable row level security;
drop policy if exists coach_fotos on carlos.fotos;
create policy coach_fotos on carlos.fotos for select to authenticated using (carlos.es_coach());

create or replace function carlos.registrar_foto(p_fecha date, p_vista text, p_path text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare cid uuid := carlos.mi_cliente();
begin
  if cid is null or p_vista not in ('frente', 'lateral', 'espalda') or p_fecha not between current_date - 8 and current_date + 8 then return false; end if;
  if p_path <> cid::text || '/' || p_fecha::text || '/' || p_vista || '.jpg' then return false; end if;
  insert into carlos.fotos(cliente_id, fecha, vista, path) values (cid, p_fecha, p_vista, p_path)
    on conflict (cliente_id, fecha, vista) do update set path = excluded.path, created_at = now();
  return true;
end $$;

create or replace function carlos.mis_fotos() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('f', to_char(fecha, 'YYYY-MM-DD'), 'v', vista) order by fecha desc), '[]'::jsonb)
    from carlos.fotos where cliente_id = carlos.mi_cliente() $$;

-- Bucket privado: solo JPEG de hasta 5 MB. Cada cliente solo toca su carpeta (<id_cliente>/...); el coach lee todo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];
drop policy if exists fotos_cliente_insert on storage.objects;
create policy fotos_cliente_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = carlos.mi_cliente()::text);
drop policy if exists fotos_cliente_update on storage.objects;
create policy fotos_cliente_update on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = carlos.mi_cliente()::text)
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = carlos.mi_cliente()::text);
drop policy if exists fotos_leer on storage.objects;
create policy fotos_leer on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (carlos.es_coach() or (storage.foldername(name))[1] = carlos.mi_cliente()::text));

-- Registro de series: kg y repeticiones de cada serie (alimenta récords y gráficos de carga del coach).
create table if not exists carlos.series (
  cliente_id uuid not null references carlos.clientes(id) on delete cascade,
  fecha date not null,
  ejercicio text not null check (ejercicio ~ '^[a-z0-9-]{1,40}$'),
  serie int not null check (serie between 1 and 12),
  kg numeric not null check (kg between 0 and 1000),
  reps int not null check (reps between 0 and 300),
  updated_at timestamptz not null default now(),
  primary key (cliente_id, fecha, ejercicio, serie)
);
alter table carlos.series enable row level security;
drop policy if exists coach_series on carlos.series;
create policy coach_series on carlos.series for select to authenticated using (carlos.es_coach());

create or replace function carlos.guardar_serie(p_fecha date, p_ej text, p_serie int, p_kg numeric, p_reps int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare cid uuid := carlos.mi_cliente();
begin
  if cid is null or p_fecha not between current_date - 8 and current_date + 1 then return false; end if;
  if p_kg is null or p_reps is null then return false; end if;
  if not carlos.mensualidad_activa((select datos from carlos.clientes where id = cid)) then return false; end if;
  insert into carlos.series(cliente_id, fecha, ejercicio, serie, kg, reps) values (cid, p_fecha, p_ej, p_serie, p_kg, p_reps)
    on conflict (cliente_id, fecha, ejercicio, serie) do update set kg = excluded.kg, reps = excluded.reps, updated_at = now();
  return true;
end $$;

create or replace function carlos.mis_series(p_desde date) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('f', to_char(fecha, 'YYYY-MM-DD'), 'e', ejercicio, 's', serie, 'kg', kg, 'r', reps) order by fecha desc, ejercicio, serie), '[]'::jsonb)
    from (select * from carlos.series where cliente_id = carlos.mi_cliente() and fecha >= greatest(p_desde, current_date - 400) order by fecha desc limit 3000) x $$;

-- Ficha de ingreso (anamnesis): la escribe el CLIENTE; va en tabla aparte para que el panel del coach nunca la pise.
create table if not exists carlos.fichas (
  cliente_id uuid primary key references carlos.clientes(id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  completa boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table carlos.fichas enable row level security;
drop policy if exists coach_fichas on carlos.fichas;
create policy coach_fichas on carlos.fichas for select to authenticated using (carlos.es_coach());

create or replace function carlos.guardar_ficha(p_datos jsonb, p_completa boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
declare cid uuid := carlos.mi_cliente();
begin
  if cid is null or p_datos is null or jsonb_typeof(p_datos) <> 'object' or pg_column_size(p_datos) > 60000 then return false; end if;
  insert into carlos.fichas(cliente_id, datos, completa) values (cid, p_datos, coalesce(p_completa, false))
    on conflict (cliente_id) do update set datos = excluded.datos, completa = excluded.completa, updated_at = now();
  return true;
end $$;

create or replace function carlos.mi_ficha() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('datos', datos, 'completa', completa) from carlos.fichas where cliente_id = carlos.mi_cliente() $$;

-- Exámenes médicos (PDF/foto): archivos en un bucket privado + registro aquí. Solo los ve el coach y el propio cliente.
create table if not exists carlos.examenes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references carlos.clientes(id) on delete cascade,
  nombre text not null check (length(nombre) <= 120),
  path text not null unique,
  created_at timestamptz not null default now()
);
alter table carlos.examenes enable row level security;
drop policy if exists coach_examenes on carlos.examenes;
create policy coach_examenes on carlos.examenes for select to authenticated using (carlos.es_coach());

create or replace function carlos.registrar_examen(p_nombre text, p_path text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare cid uuid := carlos.mi_cliente();
begin
  if cid is null or p_nombre is null or length(p_nombre) not between 1 and 120 then return false; end if;
  if p_path !~ ('^' || cid::text || '/[0-9a-f-]{36}\.(pdf|jpg|png)$') then return false; end if;
  if (select count(*) from carlos.examenes where cliente_id = cid) >= 20 then return false; end if;
  insert into carlos.examenes(cliente_id, nombre, path) values (cid, p_nombre, p_path) on conflict (path) do nothing;
  return true;
end $$;

create or replace function carlos.mis_examenes() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'n', nombre, 'f', to_char(created_at, 'YYYY-MM-DD'), 'p', path) order by created_at desc), '[]'::jsonb)
    from carlos.examenes where cliente_id = carlos.mi_cliente() $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('examenes', 'examenes', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];
drop policy if exists examenes_cliente_insert on storage.objects;
create policy examenes_cliente_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'examenes' and (storage.foldername(name))[1] = carlos.mi_cliente()::text);
drop policy if exists examenes_leer on storage.objects;
create policy examenes_leer on storage.objects for select to authenticated
  using (bucket_id = 'examenes' and (carlos.es_coach() or (storage.foldername(name))[1] = carlos.mi_cliente()::text));

-- Eliminar un cliente por completo (solo el coach): borra su ficha de cliente con TODO su historial (marcas, reportes, series, fotos, ficha de ingreso y exámenes registrados)
-- y también su cuenta de acceso. Los archivos de fotos y exámenes los borra el panel antes de llamar a esta función (Storage).
create or replace function carlos.eliminar_cliente(p_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  if not carlos.es_coach() then return false; end if;
  select user_id into uid from carlos.clientes where id = p_id;
  if not found then return false; end if;
  delete from carlos.clientes where id = p_id;   -- en cascada: marcas, reportes, fotos, series, fichas, examenes
  if uid is not null and not exists (select 1 from carlos.coaches where user_id = uid) then delete from auth.users where id = uid; end if;   -- nunca borra una cuenta de coach
  return true;
end $$;
revoke all on function carlos.eliminar_cliente(uuid) from public;
grant execute on function carlos.eliminar_cliente(uuid) to authenticated;
-- El coach puede borrar archivos de los dos buckets (al eliminar un cliente).
drop policy if exists fotos_coach_borrar on storage.objects;
create policy fotos_coach_borrar on storage.objects for delete to authenticated using (bucket_id = 'fotos' and carlos.es_coach());
drop policy if exists examenes_coach_borrar on storage.objects;
create policy examenes_coach_borrar on storage.objects for delete to authenticated using (bucket_id = 'examenes' and carlos.es_coach());

-- Restablecer la clave de un cliente SIN correo: Carlos genera un enlace (código de un solo uso) y el cliente elige su clave nueva.
-- Requiere: el código vigente del cliente (codigo_hash), que el correo coincida con su cuenta y una clave de 8 a 72 caracteres.
create or replace function carlos.restablecer_clave(p_email text, p_codigo text, p_clave text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare cid uuid; uid uuid;
begin
  if p_email is null or p_codigo is null or length(p_codigo) < 20 or p_clave is null or length(p_clave) not between 8 and 72 then return false; end if;
  select c.id, c.user_id into cid, uid
    from carlos.clientes c join auth.users u on u.id = c.user_id
   where c.codigo_hash = encode(extensions.digest(p_codigo, 'sha256'), 'hex') and lower(u.email) = lower(trim(p_email)) and c.activo;
  if cid is null then return false; end if;
  update auth.users set encrypted_password = extensions.crypt(p_clave, extensions.gen_salt('bf', 10)), updated_at = now() where id = uid;
  update carlos.clientes set codigo_hash = null where id = cid;   -- el código se usa una sola vez
  return true;
end $$;
revoke all on function carlos.restablecer_clave(text, text, text) from public;
grant usage on schema carlos to anon;   -- solo permite llamar a esta función; las tablas siguen cerradas para anon
grant execute on function carlos.restablecer_clave(text, text, text) to anon, authenticated;

do $$ declare f text; begin
  foreach f in array array['reclamar(text)', 'mi_plan()', 'marcar(date,text,boolean)', 'mis_marcas(date)', 'reportar(numeric,int,text)', 'registrar_foto(date,text,text)', 'mis_fotos()', 'guardar_serie(date,text,int,numeric,int)', 'mis_series(date)', 'guardar_ficha(jsonb,boolean)', 'mi_ficha()', 'registrar_examen(text,text)', 'mis_examenes()'] loop
    execute format('revoke all on function carlos.%s from public', f);
    execute format('grant execute on function carlos.%s to authenticated', f);
  end loop; end $$;

grant usage on schema carlos to authenticated;
grant select, insert, update, delete on carlos.clientes, carlos.ejercicios_custom to authenticated;
grant select on carlos.marcas, carlos.reportes, carlos.fotos, carlos.series, carlos.fichas, carlos.examenes to authenticated;
