-- Parche: notificaciones push. Ejecutar una vez en el SQL Editor (también está incluido en schema.sql).
-- Notificaciones push: cada celular (de Carlos o de un cliente) guarda aquí su suscripción. Solo se lee con la clave de servicio (Edge Function).
create table if not exists carlos.push_subs (
  endpoint text primary key check (endpoint like 'https://%' and length(endpoint) < 2000),
  user_id uuid not null references auth.users(id) on delete cascade,
  rol text not null check (rol in ('coach', 'cliente')),
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table carlos.push_subs enable row level security;   -- sin políticas: nadie la lee desde la API pública

create or replace function carlos.guardar_push(p_endpoint text, p_p256dh text, p_auth text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare r text;
begin
  if auth.uid() is null or p_endpoint is null or p_endpoint not like 'https://%' or length(p_endpoint) >= 2000 or coalesce(length(p_p256dh), 0) not between 20 and 200 or coalesce(length(p_auth), 0) not between 8 and 100 then return false; end if;
  r := case when carlos.es_coach() then 'coach' when carlos.mi_cliente() is not null then 'cliente' end;
  if r is null then return false; end if;
  insert into carlos.push_subs(endpoint, user_id, rol, p256dh, auth) values (p_endpoint, auth.uid(), r, p_p256dh, p_auth)
    on conflict (endpoint) do update set user_id = excluded.user_id, rol = excluded.rol, p256dh = excluded.p256dh, auth = excluded.auth;
  return true;
end $$;
revoke all on function carlos.guardar_push(text, text, text) from public;
grant execute on function carlos.guardar_push(text, text, text) to authenticated;
