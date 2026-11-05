-- ═══════════════════════════════════════════════════════════════════════
-- Exotic Açaí · Suscripción de almuerzos — ESQUEMA FASE 2 (Supabase / Postgres)
-- ESTADO: preparado, NO conectado ni ejecutado. El demo (fase 1) usa data/seed.js + localStorage.
-- Cómo usarlo cuando toque: crear el proyecto en Supabase y correr este archivo en el SQL editor.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ───────── tipos y parámetros
create type app_role as enum ('admin', 'cocina', 'menus', 'contenido', 'finanzas');

create table settings (key text primary key, value numeric not null);
insert into settings values ('iva', 0.15);                       -- PROVISIONAL: confirmar con Salo
create or replace function iva() returns numeric language sql stable as $$ select value from settings where key = 'iva' $$;

-- ───────── personas y roles
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  cargo text,
  rol app_role not null default 'cocina',
  created_at timestamptz not null default now()
);

create or replace function mi_rol() returns app_role
language sql stable security definer set search_path = public as $$ select rol from profiles where id = auth.uid() $$;
create or replace function tiene_rol(variadic roles app_role[]) returns boolean
language sql stable security definer set search_path = public as $$ select coalesce(mi_rol() = any (roles), false) $$;

-- ───────── catálogo
create table delivery_zones (
  id text primary key, nombre text not null,
  extra_mensual numeric(8,2) not null default 0, es_retiro boolean not null default false, activa boolean not null default true
);
create table plans (
  id text primary key, nombre text not null,
  publico text not null check (publico in ('oficina', 'gym', 'especial')),
  precio_20 numeric(8,2) not null,            -- PVP con IVA, 20 almuerzos/mes
  precio_12 numeric(8,2) not null,            -- PVP con IVA, 12 almuerzos/mes (3 días/sem.)
  costo_almuerzo numeric(8,2) not null,       -- ingredientes + empaque (estimado)
  activo boolean not null default true
);
create table menu_items (
  id text primary key, nombre text not null, descripcion text,
  kcal int not null, proteina_g int not null, carbos_g int not null, grasa_g int not null,
  etiquetas text[] not null default '{}', foto_url text,
  plan_slot smallint not null check (plan_slot between 0 and 2),   -- 0 oficina · 1 fit · 2 especial
  rating_prom numeric(2,1) not null default 0, votos int not null default 0
);
create table weekly_menus (
  id bigserial primary key,
  semana date not null,                        -- lunes de la semana
  dia smallint not null check (dia between 1 and 5),
  slot smallint not null check (slot between 0 and 2),
  menu_item_id text not null references menu_items (id),
  unique (semana, dia, slot)
);

-- ───────── clientes y suscripciones
create table customers (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, telefono text not null, email text,
  direccion text, zone_id text references delivery_zones (id), ventana text,
  restricciones text[] not null default '{}', alergias text[] not null default '{}', notas text,
  created_at timestamptz not null default now()
);
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  plan_id text not null references plans (id),
  frecuencia smallint not null check (frecuencia in (12, 20)),
  porcion text not null default 'normal' check (porcion in ('normal', 'volumen', 'definicion')),
  publico text not null check (publico in ('oficina', 'gym', 'especial')),
  estado text not null default 'activa' check (estado in ('activa', 'pausada', 'cancelada')),
  inicio date not null, fin date,
  pausas jsonb not null default '[]',          -- [["2026-11-01","2026-11-10"], ["2026-11-20", null]]
  precio numeric(8,2) not null,                -- PVP mensual con IVA al momento de la alta
  fuente text, campana text,
  created_at timestamptz not null default now()
);
create index on subscriptions (estado, inicio);
create table payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions (id) on delete cascade,
  fecha date not null,
  monto numeric(8,2) not null, iva numeric(8,2) not null, neto numeric(8,2) not null,
  estado text not null check (estado in ('cobrado', 'pendiente', 'fallido')),
  metodo text, nota text, es_primero boolean not null default false,
  created_at timestamptz not null default now()
);
create index on payments (fecha, estado);

-- ───────── operación diaria
create table daily_orders (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  subscription_id uuid not null references subscriptions (id) on delete cascade,
  menu_item_id text not null references menu_items (id),
  porcion text not null default 'normal', notas text,
  unique (fecha, subscription_id)
);
create table deliveries (
  id uuid primary key default gen_random_uuid(),
  daily_order_id uuid not null unique references daily_orders (id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'entregado')),
  entregado_en timestamptz, entregado_por uuid references profiles (id)
);

-- ───────── finanzas
create table expense_categories (id text primary key, nombre text not null, tipo text not null check (tipo in ('fijo', 'variable')));
insert into expense_categories values ('ingredientes', 'Ingredientes', 'variable'), ('empaques', 'Empaques', 'variable'), ('delivery', 'Delivery', 'variable'),
  ('sueldos', 'Sueldos', 'fijo'), ('marketing', 'Marketing', 'fijo'), ('arriendo', 'Arriendo', 'fijo'), ('servicios', 'Servicios', 'fijo');
create table expenses (
  id uuid primary key default gen_random_uuid(),
  fecha date not null, category_id text not null references expense_categories (id),
  descripcion text not null, proveedor text, monto numeric(10,2) not null check (monto > 0),
  created_by uuid references profiles (id), created_at timestamptz not null default now()
);
create index on expenses (fecha);

-- ───────── marketing
create table funnel_events (
  id bigserial primary key,
  ocurrido_en timestamptz not null default now(),
  session_id text, tipo text not null check (tipo in ('visita', 'inicio', 'paso1', 'paso2', 'paso3', 'paso4', 'pago', 'wa_click')),
  fuente text not null default 'directo', campana text, medio text,
  plan_id text, subscription_id uuid
);
create index on funnel_events (ocurrido_en, tipo);

-- ═══════════ VISTAS para el Panel de Resultados (se ejecutan con los permisos de quien consulta) ═══════════
create or replace view mrr_mensual with (security_invoker = true) as
select m::date as mes,
       count(s.*) as suscriptores_activos,
       coalesce(sum(s.precio / (1 + iva())), 0)::numeric(12,2) as mrr_neto
from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') m
left join subscriptions s on s.inicio <= (m + interval '1 month - 1 day')::date and (s.fin is null or s.fin > (m + interval '1 month - 1 day')::date)
group by m order by m;

create or replace view churn_mensual with (security_invoker = true) as
select m::date as mes,
       (select count(*) from subscriptions s where s.fin >= m and s.fin < m + interval '1 month') as cancelados,
       (select count(*) from subscriptions s where s.inicio < m and (s.fin is null or s.fin >= m)) as activos_inicio,
       round(100.0 * (select count(*) from subscriptions s where s.fin >= m and s.fin < m + interval '1 month')
             / nullif((select count(*) from subscriptions s where s.inicio < m and (s.fin is null or s.fin >= m)), 0), 2) as churn_pct
from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') m order by m;

create or replace view margen_por_plan with (security_invoker = true) as
select p.id as plan_id, p.nombre, s.frecuencia, count(*) as suscriptores,
       round(avg(s.precio / (1 + iva())), 2) as precio_neto,
       p.costo_almuerzo * s.frecuencia as costo_mes,
       round(avg(s.precio / (1 + iva())) - p.costo_almuerzo * s.frecuencia, 2) as margen_unitario,
       round(100 * (1 - p.costo_almuerzo * s.frecuencia / nullif(avg(s.precio / (1 + iva())), 0)), 1) as margen_pct,
       round(count(*) * (avg(s.precio / (1 + iva())) - p.costo_almuerzo * s.frecuencia), 2) as margen_total
from subscriptions s join plans p on p.id = s.plan_id
where s.estado = 'activa'
group by p.id, p.nombre, p.costo_almuerzo, s.frecuencia;

create or replace view flujo_caja with (security_invoker = true) as
select m::date as mes,
       coalesce((select sum(neto) from payments where estado = 'cobrado' and fecha >= m and fecha < m + interval '1 month'), 0) as entradas_netas,
       coalesce((select sum(monto) from expenses where fecha >= m and fecha < m + interval '1 month'), 0) as salidas,
       coalesce((select sum(neto) from payments where estado = 'cobrado' and fecha >= m and fecha < m + interval '1 month'), 0)
       - coalesce((select sum(monto) from expenses where fecha >= m and fecha < m + interval '1 month'), 0) as saldo
from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') m order by m;

-- Cocina necesita nombre/dirección/plato sin ver todo Suscriptores: vista acotada (corre como dueño, filtra por rol)
create or replace view entregas_del_dia as
select o.fecha, c.nombre, c.direccion, c.zone_id, c.ventana, c.restricciones, c.alergias, o.porcion, mi.nombre as plato, d.estado, d.id as delivery_id
from daily_orders o join subscriptions s on s.id = o.subscription_id join customers c on c.id = s.customer_id
join menu_items mi on mi.id = o.menu_item_id left join deliveries d on d.daily_order_id = o.id
where tiene_rol('admin', 'cocina', 'menus');

-- ═══════════ RLS por rol (espejo de la tabla de permisos del demo) ═══════════
do $$ declare t text; begin
  foreach t in array array['profiles','delivery_zones','plans','menu_items','weekly_menus','customers','subscriptions','payments','daily_orders','deliveries','expense_categories','expenses','funnel_events','settings'] loop
    execute format('alter table %I enable row level security', t);
  end loop; end $$;

-- perfiles: cada quien ve el suyo; Admin gestiona todos
create policy profiles_self on profiles for select using (id = auth.uid() or tiene_rol('admin'));
create policy profiles_admin on profiles for all using (tiene_rol('admin')) with check (tiene_rol('admin'));

-- catálogo público (la landing lee planes, zonas y menú sin iniciar sesión)
create policy plans_read on plans for select using (true);
create policy zones_read on delivery_zones for select using (true);
create policy menu_items_read on menu_items for select using (true);
create policy weekly_read on weekly_menus for select using (true);
create policy plans_admin on plans for all using (tiene_rol('admin')) with check (tiene_rol('admin'));
create policy zones_admin on delivery_zones for all using (tiene_rol('admin')) with check (tiene_rol('admin'));
create policy menu_items_write on menu_items for all using (tiene_rol('admin', 'menus')) with check (tiene_rol('admin', 'menus'));
create policy weekly_write on weekly_menus for all using (tiene_rol('admin', 'menus')) with check (tiene_rol('admin', 'menus'));

-- Suscriptores: Admin edita · Finanzas solo lectura
create policy customers_read on customers for select using (tiene_rol('admin', 'finanzas'));
create policy customers_write on customers for all using (tiene_rol('admin')) with check (tiene_rol('admin'));
create policy subs_read on subscriptions for select using (tiene_rol('admin', 'finanzas'));
create policy subs_write on subscriptions for all using (tiene_rol('admin')) with check (tiene_rol('admin'));

-- Cobros y gastos: Admin y Finanzas
create policy payments_all on payments for all using (tiene_rol('admin', 'finanzas')) with check (tiene_rol('admin', 'finanzas'));
create policy expcat_all on expense_categories for all using (tiene_rol('admin', 'finanzas')) with check (tiene_rol('admin', 'finanzas'));
create policy expenses_all on expenses for all using (tiene_rol('admin', 'finanzas')) with check (tiene_rol('admin', 'finanzas'));
create policy settings_read on settings for select using (tiene_rol('admin', 'finanzas'));
create policy settings_write on settings for all using (tiene_rol('admin')) with check (tiene_rol('admin'));

-- Cocina: Admin y Cocina editan · Menús lee
create policy orders_read on daily_orders for select using (tiene_rol('admin', 'cocina', 'menus'));
create policy orders_write on daily_orders for all using (tiene_rol('admin', 'cocina')) with check (tiene_rol('admin', 'cocina'));
create policy deliv_read on deliveries for select using (tiene_rol('admin', 'cocina', 'menus'));
create policy deliv_write on deliveries for all using (tiene_rol('admin', 'cocina')) with check (tiene_rol('admin', 'cocina'));

-- Embudo: la landing inserta sin sesión; lectura para Admin, Contenido y Finanzas
create policy funnel_insert on funnel_events for insert to anon, authenticated with check (true);
create policy funnel_read on funnel_events for select using (tiene_rol('admin', 'contenido', 'finanzas'));

-- Panel de Resultados 🔸 versión resumida por rol (Cocina, Menús, Contenido): solo sus indicadores
create or replace function resumen_area() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r app_role := mi_rol(); out jsonb := '{}';
begin
  if r in ('cocina', 'menus') then
    out := jsonb_build_object('porciones_hoy', (select count(*) from daily_orders where fecha = current_date),
                              'valoracion', (select round(sum(rating_prom * votos) / nullif(sum(votos), 0), 1) from menu_items));
  elsif r = 'contenido' then
    out := jsonb_build_object('visitas_30d', (select count(*) from funnel_events where tipo = 'visita' and ocurrido_en > now() - interval '30 days'),
                              'pagos_30d', (select count(*) from funnel_events where tipo = 'pago' and ocurrido_en > now() - interval '30 days'));
  end if;
  return out;
end $$;

-- Alta desde el flujo público: hacerla con una Edge Function o RPC SECURITY DEFINER (crea customer + subscription + payment),
-- nunca con inserts directos del navegador. Se implementa en fase 2.
