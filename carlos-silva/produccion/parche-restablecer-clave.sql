-- Parche: restablecer la clave de un cliente sin correo. Ejecutar una vez en el SQL Editor (también está incluido en schema.sql).
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
