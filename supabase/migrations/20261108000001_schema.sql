-- =====================================================================
-- Byamashop — schéma principal
-- Toutes les sommes sont des entiers en francs CFA (XOF, pas de centimes).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Administrateurs (liés aux comptes Supabase Auth)
-- ---------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 600),
  image_url   text,
  sort_order  int  not null default 0,
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 2 and 140),
  category_id       uuid references public.categories (id) on delete set null,
  short_description text not null default '' check (char_length(short_description) <= 300),
  description       text not null default '' check (char_length(description) <= 5000),
  details           text not null default '' check (char_length(details) <= 3000),
  price             int  not null check (price >= 0 and price <= 100000000),
  compare_at_price  int  check (compare_at_price is null or compare_at_price > 0),
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured       boolean not null default false,
  is_new            boolean not null default false,
  condition_note    text check (condition_note is null or char_length(condition_note) <= 200),
  tags              text[] not null default '{}',
  option1_name      text not null default 'Taille' check (char_length(option1_name) <= 40),
  option2_name      text not null default 'Couleur' check (char_length(option2_name) <= 40),
  seo_title         text check (seo_title is null or char_length(seo_title) <= 120),
  seo_description   text check (seo_description is null or char_length(seo_description) <= 320),
  sort_order        int  not null default 0,
  is_demo           boolean not null default false,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);

create table public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  sku            text check (sku is null or char_length(sku) <= 64),
  option1        text check (option1 is null or char_length(option1) <= 60),
  option2        text check (option2 is null or char_length(option2) <= 60),
  color_hex      text check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  price_override int  check (price_override is null or (price_override >= 0 and price_override <= 100000000)),
  stock          int  not null default 0 check (stock >= 0),
  is_active      boolean not null default true,
  position       int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants (product_id);
create unique index product_variants_sku_idx on public.product_variants (sku) where sku is not null;

create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url        text not null check (char_length(url) <= 1000),
  thumb_url  text check (thumb_url is null or char_length(thumb_url) <= 1000),
  alt        text not null default '' check (char_length(alt) <= 200),
  width      int,
  height     int,
  position   int  not null default 0,
  storage_path text,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, position);

create table public.collections (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (char_length(name) between 1 and 80),
  description  text not null default '' check (char_length(description) <= 600),
  image_url    text,
  is_featured  boolean not null default false,
  is_published boolean not null default true,
  sort_order   int  not null default 0,
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  position      int  not null default 0,
  primary key (collection_id, product_id)
);
create index collection_products_product_idx on public.collection_products (product_id);

-- Promotions en pourcentage, appliquées au moment du calcul du prix
create table public.promotions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 80),
  percent_off   int  not null check (percent_off between 1 and 90),
  scope         text not null check (scope in ('all', 'category', 'collection', 'products')),
  category_id   uuid references public.categories (id) on delete cascade,
  collection_id uuid references public.collections (id) on delete cascade,
  product_ids   uuid[] not null default '{}',
  starts_at     timestamptz,
  ends_at       timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (scope <> 'category' or category_id is not null),
  check (scope <> 'collection' or collection_id is not null),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

-- ---------------------------------------------------------------------
-- Boutique : livraison, réglages, pages éditables
-- ---------------------------------------------------------------------
create table public.delivery_zones (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null check (char_length(name) between 1 and 80),
  description            text not null default '' check (char_length(description) <= 300),
  fee                    int  not null check (fee >= 0 and fee <= 1000000),
  free_from              int  check (free_from is null or free_from > 0),
  estimate               text not null default '' check (char_length(estimate) <= 80),
  is_pickup              boolean not null default false,
  is_active              boolean not null default true,
  sort_order             int  not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table public.store_settings (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.pages (
  slug         text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null check (char_length(title) between 1 and 120),
  body         text not null default '' check (char_length(body) <= 60000),
  is_published boolean not null default true,
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------------
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique,
  idempotency_key  uuid not null unique,
  access_token     uuid not null default gen_random_uuid(),
  customer_name    text not null,
  customer_phone   text not null,
  customer_email   text,
  delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
  delivery_zone_name text not null,
  delivery_address text not null,
  delivery_notes   text,
  customer_note    text,
  payment_method   text not null check (payment_method in ('wave', 'orange_money', 'cash_on_delivery')),
  payment_status   text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded', 'failed')),
  status           text not null default 'new' check (status in ('new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  delivery_status  text not null default 'pending' check (delivery_status in ('pending', 'in_transit', 'delivered', 'failed', 'returned')),
  subtotal         int  not null check (subtotal >= 0),
  discount_total   int  not null default 0 check (discount_total >= 0),
  delivery_fee     int  not null check (delivery_fee >= 0),
  total            int  not null check (total >= 0),
  currency         text not null default 'XOF',
  payment_reference text,
  admin_note       text,
  is_test          boolean not null default false,
  stock_released   boolean not null default false,
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_phone_idx on public.orders (customer_phone, created_at desc);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  product_id    uuid references public.products (id) on delete set null,
  variant_id    uuid references public.product_variants (id) on delete set null,
  product_name  text not null,
  variant_label text,
  image_url     text,
  unit_price    int  not null check (unit_price >= 0),
  base_price    int  not null check (base_price >= 0),
  quantity      int  not null check (quantity between 1 and 99),
  line_total    int  not null check (line_total >= 0)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_events (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders (id) on delete cascade,
  kind       text not null,
  from_value text,
  to_value   text,
  note       text,
  actor      uuid,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------------
-- Messages, newsletter, limitation des abus
-- ---------------------------------------------------------------------
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  email      text,
  subject    text not null default 'general',
  message    text not null,
  is_handled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  consent_text    text not null,
  source          text not null default 'site',
  created_at      timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table public.request_log (
  id         bigint generated always as identity primary key,
  kind       text not null,
  key        text not null,
  created_at timestamptz not null default now()
);
create index request_log_lookup_idx on public.request_log (kind, key, created_at desc);

-- ---------------------------------------------------------------------
-- Déclencheurs updated_at
-- ---------------------------------------------------------------------
create trigger categories_touch before update on public.categories for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger product_variants_touch before update on public.product_variants for each row execute function public.touch_updated_at();
create trigger collections_touch before update on public.collections for each row execute function public.touch_updated_at();
create trigger promotions_touch before update on public.promotions for each row execute function public.touch_updated_at();
create trigger delivery_zones_touch before update on public.delivery_zones for each row execute function public.touch_updated_at();
create trigger store_settings_touch before update on public.store_settings for each row execute function public.touch_updated_at();
create trigger pages_touch before update on public.pages for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- Date de première publication
create or replace function public.products_set_published_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger products_published_at before insert or update on public.products
  for each row execute function public.products_set_published_at();

insert into public.store_settings (id, data) values (1, '{}'::jsonb) on conflict do nothing;
