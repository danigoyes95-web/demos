-- Programa los avisos automáticos (hora de Ecuador = UTC-5). Ejecutar UNA vez, DESPUÉS de desplegar la función "avisos".
-- Antes cambia: PROYECTO (la referencia de tu proyecto, ej. jukpaqtriemqvxormrgb) y SECRETO (el mismo valor del secreto CRON_SECRET).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Todos los días 09:00 (14:00 UTC): mensualidades por vencer
select cron.schedule('fz-mensualidad', '0 14 * * *', $$
  select net.http_post(url := 'https://PROYECTO.supabase.co/functions/v1/avisos?tipo=mensualidad', headers := '{"x-cron-secret": "SECRETO"}'::jsonb) $$);
-- Viernes 18:00 (23:00 UTC): recordatorio del check-in del sábado
select cron.schedule('fz-checkin', '0 23 * * 5', $$
  select net.http_post(url := 'https://PROYECTO.supabase.co/functions/v1/avisos?tipo=checkin', headers := '{"x-cron-secret": "SECRETO"}'::jsonb) $$);

-- Para PROBAR (envía una notificación de prueba a los celulares de Carlos):
-- select net.http_post(url := 'https://PROYECTO.supabase.co/functions/v1/avisos?tipo=prueba', headers := '{"x-cron-secret": "SECRETO"}'::jsonb);
-- Para quitar un aviso programado:  select cron.unschedule('fz-checkin');
