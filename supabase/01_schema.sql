-- =====================================================================
--  Quincaillerie en ligne — Supabase schema
--  Run this file FIRST in Supabase → SQL Editor → New query → Run.
--  Then run 02_seed.sql (optional sample data).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'manager', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_source as enum ('web', 'phone', 'whatsapp');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Generic updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  role        public.user_role not null default 'customer',
  governorate text,
  city        text,
  address     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role helpers (security definer so they can be used inside RLS policies
-- without recursion)
create or replace function public.get_my_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('manager', 'admin') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Create a profile automatically on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change a role. (auth.uid() is null in the SQL editor,
-- so you can still promote the first admin by hand.)
create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Seul un administrateur peut changer un rôle';
  end if;
  if new.role is distinct from old.role and new.id = auth.uid() then
    raise exception 'Vous ne pouvez pas changer votre propre rôle';
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------
-- Shop settings (single row)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id         int primary key default 1 check (id = 1),
  shop_name  text not null default 'Dar Brico',
  tagline    text not null default 'Quincaillerie en ligne',
  phone      text not null default '+216 00 000 000',
  whatsapp   text not null default '21600000000',
  email      text,
  address    text,
  hours      text,
  updated_at timestamptz not null default now()
);

create or replace trigger settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  icon       text not null default 'wrench',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  reference   text,
  description text,
  highlights  text[] not null default '{}',
  specs       jsonb  not null default '[]'::jsonb,   -- [{ "label": "...", "value": "..." }]
  category_id uuid references public.categories (id) on delete set null,
  price       numeric(10, 3) not null check (price >= 0),
  old_price   numeric(10, 3) check (old_price is null or old_price > 0),
  stock       int not null default 0 check (stock >= 0),
  images      text[] not null default '{}',
  badge       text,
  is_featured boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx   on public.products (is_active);

create or replace trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Delivery zones (one row per gouvernorat)
-- ---------------------------------------------------------------------
create table if not exists public.delivery_zones (
  governorate text primary key,
  fee         numeric(10, 3) not null default 8 check (fee >= 0),
  delay       text,
  is_active   boolean not null default true
);

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  bigint not null unique default nextval('public.order_number_seq'),
  user_id       uuid references auth.users (id) on delete set null,
  customer_name text not null,
  phone         text not null,
  governorate   text not null,
  city          text not null,
  address       text not null,
  note          text,
  subtotal      numeric(10, 3) not null default 0,
  delivery_fee  numeric(10, 3) not null default 0,
  total         numeric(10, 3) not null default 0,
  status        public.order_status not null default 'pending',
  source        public.order_source not null default 'web',
  staff_note    text,
  handled_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists orders_user_idx    on public.orders (user_id);
create index if not exists orders_status_idx  on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

create or replace trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price   numeric(10, 3) not null,
  quantity     int not null check (quantity > 0),
  line_total   numeric(10, 3) generated always as (unit_price * quantity) stored
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_status_history (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx on public.order_status_history (order_id);

-- Log every status change
create or replace function public.log_order_status()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists orders_log_status on public.orders;
create trigger orders_log_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- Give stock back when an order is cancelled (and take it again if it is
-- un-cancelled)
create or replace function public.sync_stock_on_cancel()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.products p
       set stock = p.stock + oi.quantity
      from public.order_items oi
     where oi.order_id = new.id and oi.product_id = p.id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    update public.products p
       set stock = p.stock - oi.quantity
      from public.order_items oi
     where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end $$;

drop trigger if exists orders_sync_stock on public.orders;
create trigger orders_sync_stock
  after update of status on public.orders
  for each row execute function public.sync_stock_on_cancel();

-- ---------------------------------------------------------------------
-- RPC: place an order (guests and signed-in users; staff for phone orders)
-- Prices and stock are always read from the database, never trusted
-- from the browser.
-- p_items: [{ "product_id": "<uuid>", "quantity": 2 }, ...]
-- ---------------------------------------------------------------------
create or replace function public.place_order(
  p_customer_name text,
  p_phone         text,
  p_governorate   text,
  p_city          text,
  p_address       text,
  p_note          text,
  p_items         jsonb,
  p_source        public.order_source default 'web'
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user     uuid := auth.uid();
  v_order_id uuid;
  v_number   bigint;
  v_fee      numeric(10, 3);
  v_sub      numeric(10, 3) := 0;
  v_item     jsonb;
  v_qty      int;
  v_product  public.products%rowtype;
begin
  if p_source <> 'web' and not public.is_staff() then
    raise exception 'Non autorisé';
  end if;

  if coalesce(btrim(p_customer_name), '') = '' or coalesce(btrim(p_phone), '') = ''
     or coalesce(btrim(p_city), '') = '' or coalesce(btrim(p_address), '') = '' then
    raise exception 'Informations de livraison incomplètes';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Le panier est vide';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'Trop d''articles dans la commande';
  end if;

  select fee into v_fee
    from public.delivery_zones
   where governorate = p_governorate and is_active;
  if not found then
    raise exception 'Livraison non disponible pour ce gouvernorat';
  end if;

  -- Orders taken by staff on the phone are already confirmed with the customer
  insert into public.orders (user_id, customer_name, phone, governorate, city, address, note,
                             delivery_fee, source, status, handled_by)
  values (case when p_source = 'web' then v_user end,
          btrim(p_customer_name), btrim(p_phone), p_governorate, btrim(p_city), btrim(p_address),
          nullif(btrim(coalesce(p_note, '')), ''),
          v_fee, p_source,
          case when p_source = 'web' then 'pending' else 'confirmed' end::public.order_status,
          case when p_source <> 'web' then v_user end)
  returning id, order_number into v_order_id, v_number;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 999 then
      raise exception 'Quantité invalide';
    end if;

    select * into v_product
      from public.products
     where id = (v_item ->> 'product_id')::uuid and is_active
       for update;
    if not found then
      raise exception 'Un produit du panier n''est plus disponible';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuffisant pour « % » (reste %)', v_product.name, v_product.stock;
    end if;

    update public.products set stock = stock - v_qty where id = v_product.id;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_qty);

    v_sub := v_sub + v_product.price * v_qty;
  end loop;

  update public.orders
     set subtotal = v_sub, total = v_sub + v_fee
   where id = v_order_id;

  return jsonb_build_object('id', v_order_id, 'order_number', v_number, 'total', v_sub + v_fee);
end $$;

revoke all on function public.place_order(text, text, text, text, text, text, jsonb, public.order_source) from public;
grant execute on function public.place_order(text, text, text, text, text, text, jsonb, public.order_source) to anon, authenticated;

-- RPC: a customer cancels their own order while it is still pending
create or replace function public.cancel_my_order(p_order_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.orders
     set status = 'cancelled'
   where id = p_order_id and user_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'Cette commande ne peut plus être annulée';
  end if;
end $$;

revoke all on function public.cancel_my_order(uuid) from public;
grant execute on function public.cancel_my_order(uuid) to authenticated;

-- RPC: admin user list (emails live in auth.users, which the API cannot read)
create or replace function public.admin_list_users()
returns table (
  id uuid, email text, full_name text, phone text,
  role public.user_role, created_at timestamptz, last_sign_in_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Non autorisé';
  end if;
  return query
    select p.id, u.email::text, p.full_name, p.phone, p.role, p.created_at, u.last_sign_in_at
      from public.profiles p
      join auth.users u on u.id = p.id
     order by p.created_at desc;
end $$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.settings             enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.delivery_zones       enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;

-- profiles
drop policy if exists "profiles: read own or staff" on public.profiles;
create policy "profiles: read own or staff" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_staff());

drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- settings
drop policy if exists "settings: public read" on public.settings;
create policy "settings: public read" on public.settings
  for select using (true);

drop policy if exists "settings: admin update" on public.settings;
create policy "settings: admin update" on public.settings
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- categories
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories
  for select using (true);

drop policy if exists "categories: staff write" on public.categories;
create policy "categories: staff write" on public.categories
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- products
drop policy if exists "products: public read active" on public.products;
create policy "products: public read active" on public.products
  for select using (is_active or public.is_staff());

drop policy if exists "products: staff write" on public.products;
create policy "products: staff write" on public.products
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- delivery zones
drop policy if exists "zones: public read" on public.delivery_zones;
create policy "zones: public read" on public.delivery_zones
  for select using (true);

drop policy if exists "zones: admin write" on public.delivery_zones;
create policy "zones: admin write" on public.delivery_zones
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- orders (inserts only go through place_order)
drop policy if exists "orders: read own or staff" on public.orders;
create policy "orders: read own or staff" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "orders: staff update" on public.orders;
create policy "orders: staff update" on public.orders
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "orders: admin delete" on public.orders;
create policy "orders: admin delete" on public.orders
  for delete to authenticated
  using (public.is_admin());

-- Staff may only change workflow columns, never prices or customer data
revoke update on public.orders from authenticated, anon;
grant update (status, staff_note, handled_by) on public.orders to authenticated;

-- Customers may edit their contact details, not their id/timestamps
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, governorate, city, address, role) on public.profiles to authenticated;

-- order items / history follow their order
drop policy if exists "order_items: read with order" on public.order_items;
create policy "order_items: read with order" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
     where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())
  ));

drop policy if exists "history: read with order" on public.order_status_history;
create policy "history: read with order" on public.order_status_history
  for select to authenticated
  using (exists (
    select 1 from public.orders o
     where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())
  ));

-- ---------------------------------------------------------------------
-- Storage: public bucket for product photos, staff-only uploads
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product images: public read" on storage.objects;
create policy "product images: public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product images: staff insert" on storage.objects;
create policy "product images: staff insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "product images: staff update" on storage.objects;
create policy "product images: staff update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "product images: staff delete" on storage.objects;
create policy "product images: staff delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_staff());

-- ---------------------------------------------------------------------
-- Realtime: live "new order" alerts in the back office
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;
