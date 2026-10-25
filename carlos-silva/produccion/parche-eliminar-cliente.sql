-- Parche: eliminar clientes desde el panel. Ejecutar una vez en el SQL Editor (también está incluido en schema.sql).
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
