-- =====================================================================
-- Byamashop — sécurité (RLS), droits d'accès et fonctions métier
-- =====================================================================

-- ---------------------------------------------------------------------
-- Activer la sécurité au niveau des lignes partout
-- ---------------------------------------------------------------------
alter table public.admin_users            enable row level security;
alter table public.categories             enable row level security;
alter table public.products               enable row level security;
alter table public.product_variants       enable row level security;
alter table public.product_images         enable row level security;
alter table public.collections            enable row level security;
alter table public.collection_products    enable row level security;
alter table public.promotions             enable row level security;
alter table public.delivery_zones         enable row level security;
alter table public.store_settings         enable row level security;
alter table public.pages                  enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.order_events           enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.request_log            enable row level security;

-- ---------------------------------------------------------------------
-- Droits de base : on part de zéro puis on accorde le strict nécessaire
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

-- Lecture publique du catalogue (filtrée par les politiques ci-dessous)
grant select on public.categories, public.products, public.product_variants, public.product_images,
  public.collections, public.collection_products, public.promotions, public.delivery_zones,
  public.store_settings, public.pages
  to anon, authenticated;

-- Écriture réservée aux administrateurs (contrôlée par RLS)
grant insert, update, delete on public.categories, public.products, public.product_variants,
  public.product_images, public.collections, public.collection_products, public.promotions,
  public.delivery_zones, public.pages
  to authenticated;
grant update on public.store_settings to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items, public.order_events to authenticated;
grant select, update, delete on public.contact_messages, public.newsletter_subscribers to authenticated;
grant select on public.admin_users to authenticated;

-- ---------------------------------------------------------------------
-- Politiques
-- ---------------------------------------------------------------------
create policy admin_users_self on public.admin_users for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy categories_read on public.categories for select
  using (is_published or public.is_admin());
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy products_read on public.products for select
  using (status = 'published' or public.is_admin());
create policy products_admin on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy variants_read on public.product_variants for select
  using (public.is_admin() or exists (
    select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy variants_admin on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy images_read on public.product_images for select
  using (public.is_admin() or exists (
    select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy images_admin on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy collections_read on public.collections for select
  using (is_published or public.is_admin());
create policy collections_admin on public.collections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy collection_products_read on public.collection_products for select using (true);
create policy collection_products_admin on public.collection_products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy promotions_read on public.promotions for select
  using (public.is_admin() or (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())));
create policy promotions_admin on public.promotions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy zones_read on public.delivery_zones for select using (is_active or public.is_admin());
create policy zones_admin on public.delivery_zones for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy settings_read on public.store_settings for select using (true);
create policy settings_admin on public.store_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy pages_read on public.pages for select using (is_published or public.is_admin());
create policy pages_admin on public.pages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Commandes : aucune lecture publique. Les clients consultent leur commande
-- uniquement via get_order_status(reference, jeton secret).
create policy orders_admin_read on public.orders for select to authenticated using (public.is_admin());
create policy orders_admin_update on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy order_items_admin on public.order_items for select to authenticated using (public.is_admin());
create policy order_events_admin on public.order_events for select to authenticated using (public.is_admin());

create policy contact_admin on public.contact_messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy newsletter_admin on public.newsletter_subscribers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- request_log : aucune politique => inaccessible hors fonctions SECURITY DEFINER

-- Empêche un administrateur de modifier les montants d'une commande via l'API :
-- seuls les statuts, notes et le marqueur de test sont modifiables.
create or replace function public.orders_guard_update()
returns trigger language plpgsql as $$
begin
  if current_setting('byamashop.internal', true) = 'on' then
    return new;
  end if;
  if new.reference <> old.reference or new.idempotency_key <> old.idempotency_key
     or new.access_token <> old.access_token
     or new.subtotal <> old.subtotal or new.delivery_fee <> old.delivery_fee
     or new.total <> old.total or new.discount_total <> old.discount_total
     or new.status <> old.status or new.payment_status <> old.payment_status
     or new.delivery_status <> old.delivery_status or new.stock_released <> old.stock_released
     or new.created_at <> old.created_at then
    raise exception 'Utilisez admin_update_order pour modifier une commande' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger orders_guard before update on public.orders
  for each row execute function public.orders_guard_update();

-- ---------------------------------------------------------------------
-- Prix : promotions actives et prix unitaire effectif
-- (logique identique à src/lib/pricing.ts — testée des deux côtés)
-- ---------------------------------------------------------------------
create or replace function public.product_discount_percent(p_product_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(max(pr.percent_off), 0)::int
  from public.promotions pr
  join public.products p on p.id = p_product_id
  where pr.is_active
    and (pr.starts_at is null or pr.starts_at <= now())
    and (pr.ends_at is null or pr.ends_at > now())
    and (
      pr.scope = 'all'
      or (pr.scope = 'category' and pr.category_id = p.category_id)
      or (pr.scope = 'products' and p_product_id = any (pr.product_ids))
      or (pr.scope = 'collection' and exists (
            select 1 from public.collection_products cp
            where cp.collection_id = pr.collection_id and cp.product_id = p_product_id))
    );
$$;

create or replace function public.apply_discount(p_base int, p_percent int)
returns int language sql immutable as $$
  select case when p_percent <= 0 then p_base
              else (round(p_base::numeric * (100 - p_percent) / 100 / 5) * 5)::int end;
$$;

-- ---------------------------------------------------------------------
-- Limitation des abus
-- ---------------------------------------------------------------------
create or replace function public.client_ip()
returns text language plpgsql stable as $$
declare
  h json;
begin
  begin
    h := current_setting('request.headers', true)::json;
  exception when others then
    return 'unknown';
  end;
  if h is null then return 'unknown'; end if;
  return coalesce(
    h ->> 'cf-connecting-ip',
    h ->> 'x-real-ip',
    split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1),
    'unknown');
end $$;

create or replace function public.hit_rate_limit(p_kind text, p_key text, p_max int, p_window interval)
returns void language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  if p_key is null or p_key = '' or p_key = 'unknown' then
    return;
  end if;
  select count(*) into n from public.request_log
    where kind = p_kind and key = p_key and created_at > now() - p_window;
  if n >= p_max then
    raise exception 'RATE_LIMITED' using errcode = 'P0001',
      hint = 'Trop de tentatives. Merci de patienter quelques minutes.';
  end if;
  insert into public.request_log (kind, key) values (p_kind, p_key);
  -- ménage opportuniste
  delete from public.request_log where created_at < now() - interval '2 days';
end $$;

-- ---------------------------------------------------------------------
-- Téléphone : normalisation (Sénégal par défaut)
-- ---------------------------------------------------------------------
create or replace function public.normalize_phone(p text)
returns text language plpgsql immutable as $$
declare
  d text := regexp_replace(coalesce(p, ''), '[^0-9+]', '', 'g');
begin
  if d like '00%' then d := '+' || substr(d, 3); end if;
  if d ~ '^[0-9]{9}$' then d := '+221' || d; end if;
  if d ~ '^221[0-9]{9}$' then d := '+' || d; end if;
  if d !~ '^\+[0-9]{8,15}$' then return null; end if;
  return d;
end $$;

-- ---------------------------------------------------------------------
-- Référence de commande lisible : BY-AAMMJJ-XXXX
-- ---------------------------------------------------------------------
create or replace function public.new_order_reference()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  ref text;
  i int;
begin
  loop
    ref := 'BY-' || to_char(now() at time zone 'Africa/Dakar', 'YYMMDD') || '-';
    for i in 1..4 loop
      ref := ref || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.orders where reference = ref);
  end loop;
  return ref;
end $$;

-- ---------------------------------------------------------------------
-- Passage de commande — SEUL point d'entrée pour créer une commande.
-- Recalcule tous les prix côté serveur, vérifie et réserve le stock,
-- empêche les doublons grâce à la clé d'idempotence.
-- ---------------------------------------------------------------------
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_key       uuid;
  v_existing  public.orders%rowtype;
  v_name      text := btrim(coalesce(payload #>> '{customer,name}', ''));
  v_phone     text := public.normalize_phone(payload #>> '{customer,phone}');
  v_email     text := nullif(lower(btrim(coalesce(payload #>> '{customer,email}', ''))), '');
  v_address   text := btrim(coalesce(payload #>> '{delivery,address}', ''));
  v_dnotes    text := nullif(btrim(coalesce(payload #>> '{delivery,notes}', '')), '');
  v_note      text := nullif(btrim(coalesce(payload ->> 'note', '')), '');
  v_method    text := payload ->> 'payment_method';
  v_zone      public.delivery_zones%rowtype;
  v_settings  jsonb;
  v_item      jsonb;
  v_lines     jsonb := '[]'::jsonb;
  v_variant   record;
  v_qty       int;
  v_pct       int;
  v_base      int;
  v_unit      int;
  v_subtotal  int := 0;
  v_discount  int := 0;
  v_fee       int;
  v_order_id  uuid;
  v_ref       text;
  v_token     uuid;
  v_missing   jsonb := '[]'::jsonb;
  v_label     text;
  v_image     text;
begin
  -- Pot de miel anti-robots
  if coalesce(payload ->> 'website', '') <> '' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  begin
    v_key := (payload ->> 'idempotency_key')::uuid;
  exception when others then
    v_key := null;
  end;
  if v_key is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001', hint = 'Clé de commande manquante.';
  end if;

  -- Commande déjà enregistrée avec cette clé : on renvoie la même (pas de doublon)
  select * into v_existing from public.orders where idempotency_key = v_key;
  if found then
    return jsonb_build_object('reference', v_existing.reference, 'access_token', v_existing.access_token,
      'total', v_existing.total, 'duplicate', true);
  end if;

  -- Validation des champs
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'customer.name', hint = 'Indiquez votre nom complet.';
  end if;
  if v_phone is null then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'customer.phone', hint = 'Numéro de téléphone invalide.';
  end if;
  if v_email is not null and (char_length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'customer.email', hint = 'Adresse e-mail invalide.';
  end if;
  if char_length(v_address) > 300 or char_length(coalesce(v_dnotes, '')) > 500 or char_length(coalesce(v_note, '')) > 1000 then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'delivery', hint = 'Texte trop long.';
  end if;
  if coalesce((payload ->> 'accept_terms')::boolean, false) is not true then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'accept_terms', hint = 'Veuillez accepter les conditions générales de vente.';
  end if;

  select * into v_zone from public.delivery_zones
    where id = nullif(payload #>> '{delivery,zone_id}', '')::uuid and is_active;
  if not found then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'delivery.zone_id', hint = 'Zone de livraison invalide.';
  end if;
  if not v_zone.is_pickup and char_length(v_address) < 4 then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'delivery.address', hint = 'Indiquez votre adresse de livraison.';
  end if;

  select data into v_settings from public.store_settings where id = 1;
  if v_method is null or v_method not in ('wave', 'orange_money', 'cash_on_delivery')
     or coalesce((v_settings #>> array['payments', v_method, 'enabled'])::boolean, false) is not true then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'payment_method', hint = 'Moyen de paiement indisponible.';
  end if;

  if jsonb_typeof(payload -> 'items') <> 'array'
     or jsonb_array_length(payload -> 'items') = 0
     or jsonb_array_length(payload -> 'items') > 50 then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'items', hint = 'Votre panier est vide.';
  end if;

  -- Limitation des abus : par téléphone et par adresse IP
  perform public.hit_rate_limit('order_phone', v_phone, 5, interval '1 hour');
  perform public.hit_rate_limit('order_ip', public.client_ip(), 15, interval '1 hour');

  -- Création de la commande (les montants sont complétés plus bas)
  v_ref := public.new_order_reference();
  begin
    insert into public.orders (reference, idempotency_key, customer_name, customer_phone, customer_email,
      delivery_zone_id, delivery_zone_name, delivery_address, delivery_notes, customer_note,
      payment_method, subtotal, delivery_fee, total, delivery_status)
    values (v_ref, v_key, v_name, v_phone, v_email, v_zone.id, v_zone.name,
      case when v_zone.is_pickup and v_address = '' then 'Retrait' else v_address end,
      v_dnotes, v_note, v_method, 0, 0, 0, 'pending')
    returning id, access_token into v_order_id, v_token;
  exception when unique_violation then
    -- Double envoi simultané : renvoyer la commande déjà créée
    select * into v_existing from public.orders where idempotency_key = v_key;
    return jsonb_build_object('reference', v_existing.reference, 'access_token', v_existing.access_token,
      'total', v_existing.total, 'duplicate', true);
  end;

  -- Lignes : regroupe les variantes identiques, verrouille le stock dans un ordre stable
  for v_item in
    select jsonb_build_object('variant_id', x.variant_id, 'quantity', sum(x.quantity))
    from (
      select (e ->> 'variant_id')::uuid as variant_id,
             greatest(0, least(99, coalesce((e ->> 'quantity')::int, 0))) as quantity
      from jsonb_array_elements(payload -> 'items') e
    ) x
    group by x.variant_id
    order by x.variant_id
  loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty < 1 or v_qty > 99 then
      raise exception 'VALIDATION' using errcode = 'P0001', detail = 'items.quantity', hint = 'Quantité invalide.';
    end if;

    select v.id, v.product_id, v.option1, v.option2, v.price_override, v.stock, v.is_active,
           p.name as product_name, p.price, p.status, p.option1_name, p.option2_name
      into v_variant
      from public.product_variants v
      join public.products p on p.id = v.product_id
      where v.id = (v_item ->> 'variant_id')::uuid
      for update of v;

    if not found or v_variant.status <> 'published' or not v_variant.is_active then
      v_missing := v_missing || jsonb_build_object('variant_id', v_item ->> 'variant_id', 'available', 0);
      continue;
    end if;
    if v_variant.stock < v_qty then
      v_missing := v_missing || jsonb_build_object('variant_id', v_variant.id, 'available', v_variant.stock);
      continue;
    end if;

    v_base := coalesce(v_variant.price_override, v_variant.price);
    v_pct  := public.product_discount_percent(v_variant.product_id);
    v_unit := public.apply_discount(v_base, v_pct);

    v_label := nullif(concat_ws(' · ',
      case when v_variant.option1 is not null then v_variant.option1_name || ' : ' || v_variant.option1 end,
      case when v_variant.option2 is not null then v_variant.option2_name || ' : ' || v_variant.option2 end), '');
    select url into v_image from public.product_images
      where product_id = v_variant.product_id order by position limit 1;

    update public.product_variants set stock = stock - v_qty where id = v_variant.id;

    insert into public.order_items (order_id, product_id, variant_id, product_name, variant_label, image_url,
      unit_price, base_price, quantity, line_total)
    values (v_order_id, v_variant.product_id, v_variant.id, v_variant.product_name, v_label, v_image,
      v_unit, v_base, v_qty, v_unit * v_qty);

    v_subtotal := v_subtotal + v_unit * v_qty;
    v_discount := v_discount + (v_base - v_unit) * v_qty;
  end loop;

  if jsonb_array_length(v_missing) > 0 then
    -- annule tout (commande + décréments de stock) et informe le client
    raise exception 'OUT_OF_STOCK' using errcode = 'P0001', detail = v_missing::text,
      hint = 'Certains articles ne sont plus disponibles dans la quantité demandée.';
  end if;

  v_fee := case when v_zone.free_from is not null and v_subtotal >= v_zone.free_from then 0 else v_zone.fee end;

  perform set_config('byamashop.internal', 'on', true);
  update public.orders
    set subtotal = v_subtotal, discount_total = v_discount, delivery_fee = v_fee, total = v_subtotal + v_fee
    where id = v_order_id;
  perform set_config('byamashop.internal', 'off', true);

  insert into public.order_events (order_id, kind, to_value, note)
    values (v_order_id, 'created', 'new', 'Commande passée sur le site');

  return jsonb_build_object('reference', v_ref, 'access_token', v_token,
    'total', v_subtotal + v_fee, 'duplicate', false);
end $$;

-- ---------------------------------------------------------------------
-- Suivi de commande côté client (référence + jeton secret obligatoires)
-- ---------------------------------------------------------------------
create or replace function public.get_order_status(p_reference text, p_token uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  o public.orders%rowtype;
begin
  select * into o from public.orders where reference = upper(btrim(p_reference)) and access_token = p_token;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'reference', o.reference,
    'created_at', o.created_at,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'delivery_zone_name', o.delivery_zone_name,
    'delivery_address', o.delivery_address,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'status', o.status,
    'delivery_status', o.delivery_status,
    'subtotal', o.subtotal,
    'discount_total', o.discount_total,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name, 'variant_label', i.variant_label, 'image_url', i.image_url,
        'unit_price', i.unit_price, 'quantity', i.quantity, 'line_total', i.line_total) order by i.product_name)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------
-- Administration des commandes : changements de statut tracés
-- ---------------------------------------------------------------------
create or replace function public.admin_update_order(
  p_order_id uuid,
  p_status text default null,
  p_payment_status text default null,
  p_delivery_status text default null,
  p_note text default null,
  p_payment_reference text default null
)
returns public.orders
language plpgsql security definer set search_path = public
as $$
declare
  o public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  perform set_config('byamashop.internal', 'on', true);

  if p_status is not null and p_status <> o.status then
    if p_status not in ('new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') then
      raise exception 'VALIDATION' using errcode = 'P0001', detail = 'status';
    end if;
    if o.status = 'cancelled' then
      raise exception 'VALIDATION' using errcode = 'P0001', detail = 'status',
        hint = 'Une commande annulée ne peut pas être réactivée. Créez une nouvelle commande.';
    end if;
    if p_status = 'cancelled' and not o.stock_released then
      -- remise en stock des articles réservés
      update public.product_variants v
        set stock = v.stock + i.quantity
        from public.order_items i
        where i.order_id = o.id and i.variant_id = v.id;
      update public.orders set stock_released = true where id = o.id;
      insert into public.order_events (order_id, kind, note, actor)
        values (o.id, 'stock_released', 'Articles remis en stock', auth.uid());
    end if;
    update public.orders set status = p_status where id = o.id;
    insert into public.order_events (order_id, kind, from_value, to_value, actor)
      values (o.id, 'status', o.status, p_status, auth.uid());
  end if;

  if p_payment_status is not null and p_payment_status <> o.payment_status then
    if p_payment_status not in ('pending', 'paid', 'refunded', 'failed') then
      raise exception 'VALIDATION' using errcode = 'P0001', detail = 'payment_status';
    end if;
    update public.orders
      set payment_status = p_payment_status,
          paid_at = case when p_payment_status = 'paid' then coalesce(paid_at, now()) else paid_at end
      where id = o.id;
    insert into public.order_events (order_id, kind, from_value, to_value, actor)
      values (o.id, 'payment', o.payment_status, p_payment_status, auth.uid());
  end if;

  if p_delivery_status is not null and p_delivery_status <> o.delivery_status then
    if p_delivery_status not in ('pending', 'in_transit', 'delivered', 'failed', 'returned') then
      raise exception 'VALIDATION' using errcode = 'P0001', detail = 'delivery_status';
    end if;
    update public.orders set delivery_status = p_delivery_status where id = o.id;
    insert into public.order_events (order_id, kind, from_value, to_value, actor)
      values (o.id, 'delivery', o.delivery_status, p_delivery_status, auth.uid());
  end if;

  if p_payment_reference is not null then
    update public.orders set payment_reference = nullif(btrim(p_payment_reference), '') where id = o.id;
  end if;

  if p_note is not null and btrim(p_note) <> '' then
    insert into public.order_events (order_id, kind, note, actor)
      values (o.id, 'note', left(btrim(p_note), 1000), auth.uid());
  end if;

  perform set_config('byamashop.internal', 'off', true);

  select * into o from public.orders where id = p_order_id;
  return o;
end $$;

-- ---------------------------------------------------------------------
-- Tableau de bord : uniquement des données réelles (commandes de test exclues)
-- ---------------------------------------------------------------------
create or replace function public.admin_dashboard(p_days int default 30)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 3650)));
  low_threshold int;
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select coalesce((data ->> 'low_stock_threshold')::int, 3) into low_threshold from public.store_settings where id = 1;

  select jsonb_build_object(
    'period_days', p_days,
    'orders_received', (select count(*) from public.orders where not is_test and created_at >= since),
    'orders_cancelled', (select count(*) from public.orders where not is_test and created_at >= since and status = 'cancelled'),
    'confirmed_sales', (select count(*) from public.orders where not is_test and created_at >= since and payment_status = 'paid' and status <> 'cancelled'),
    'revenue', (select coalesce(sum(total), 0) from public.orders where not is_test and created_at >= since and payment_status = 'paid' and status <> 'cancelled'),
    'pending_value', (select coalesce(sum(total), 0) from public.orders where not is_test and created_at >= since and payment_status = 'pending' and status <> 'cancelled'),
    'awaiting_action', (select count(*) from public.orders where not is_test and status not in ('completed', 'cancelled')
                          and (status = 'new' or payment_status = 'pending')),
    'total_real_orders', (select count(*) from public.orders where not is_test),
    'popular_products', coalesce((
      select jsonb_agg(t) from (
        select i.product_id, max(i.product_name) as name, sum(i.quantity)::int as quantity, sum(i.line_total)::int as amount
        from public.order_items i join public.orders o on o.id = i.order_id
        where not o.is_test and o.status <> 'cancelled' and o.created_at >= since
        group by i.product_id order by sum(i.quantity) desc limit 5) t), '[]'::jsonb),
    'low_stock', coalesce((
      select jsonb_agg(t) from (
        select v.id as variant_id, p.id as product_id, p.name, p.is_demo,
               nullif(concat_ws(' · ', v.option1, v.option2), '') as variant, v.stock
        from public.product_variants v join public.products p on p.id = v.product_id
        where p.status = 'published' and v.is_active and v.stock <= low_threshold
        order by v.stock asc, p.name limit 20) t), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(t order by t.day) from (
        select to_char(date_trunc('day', created_at at time zone 'Africa/Dakar'), 'YYYY-MM-DD') as day,
               count(*)::int as orders,
               coalesce(sum(total) filter (where payment_status = 'paid'), 0)::int as paid_revenue
        from public.orders
        where not is_test and status <> 'cancelled' and created_at >= since
        group by 1) t), '[]'::jsonb)
  ) into result;
  return result;
end $$;

-- ---------------------------------------------------------------------
-- Formulaires publics : contact et newsletter (avec limitation d'abus)
-- ---------------------------------------------------------------------
create or replace function public.submit_contact_message(payload jsonb)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_name text := btrim(coalesce(payload ->> 'name', ''));
  v_phone text := nullif(btrim(coalesce(payload ->> 'phone', '')), '');
  v_email text := nullif(lower(btrim(coalesce(payload ->> 'email', ''))), '');
  v_subject text := coalesce(nullif(payload ->> 'subject', ''), 'general');
  v_message text := btrim(coalesce(payload ->> 'message', ''));
begin
  if coalesce(payload ->> 'website', '') <> '' then
    return true; -- robot : on ignore silencieusement
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'name', hint = 'Indiquez votre nom.';
  end if;
  if v_phone is null and v_email is null then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'phone', hint = 'Indiquez un téléphone ou un e-mail pour que nous puissions vous répondre.';
  end if;
  if v_phone is not null and public.normalize_phone(v_phone) is null then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'phone', hint = 'Numéro de téléphone invalide.';
  end if;
  if v_email is not null and (char_length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'email', hint = 'Adresse e-mail invalide.';
  end if;
  if v_subject not in ('general', 'commande', 'gros', 'produit', 'autre') then
    v_subject := 'general';
  end if;
  if char_length(v_message) < 5 or char_length(v_message) > 3000 then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'message', hint = 'Votre message doit contenir entre 5 et 3000 caractères.';
  end if;
  perform public.hit_rate_limit('contact_ip', public.client_ip(), 5, interval '1 hour');
  insert into public.contact_messages (name, phone, email, subject, message)
    values (v_name, public.normalize_phone(v_phone), v_email, v_subject, v_message);
  return true;
end $$;

create or replace function public.subscribe_newsletter(p_email text, p_consent boolean, p_website text default '')
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if coalesce(p_website, '') <> '' then
    return true;
  end if;
  if not coalesce(p_consent, false) then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'consent', hint = 'Merci de cocher la case de consentement.';
  end if;
  if char_length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'email', hint = 'Adresse e-mail invalide.';
  end if;
  perform public.hit_rate_limit('newsletter_ip', public.client_ip(), 10, interval '1 hour');
  insert into public.newsletter_subscribers (email, consent_text)
    values (v_email, 'J''accepte de recevoir les actualités et offres de la boutique par e-mail. Désinscription possible à tout moment.')
    on conflict (email) do update set unsubscribed_at = null;
  return true;
end $$;

-- ---------------------------------------------------------------------
-- Remplacement du catalogue de démonstration
-- ---------------------------------------------------------------------
create or replace function public.admin_remove_demo_content()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  n_products int;
  n_collections int;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  -- les commandes conservent leurs lignes (nom, prix) : la suppression est sans risque
  delete from public.products where is_demo;
  get diagnostics n_products = row_count;
  delete from public.collections where is_demo;
  get diagnostics n_collections = row_count;
  return jsonb_build_object('products', n_products, 'collections', n_collections);
end $$;

-- Ajout d'un administrateur par adresse e-mail (à lancer dans l'éditeur SQL de Supabase)
create or replace function public.grant_admin(p_email text, p_role text default 'owner')
returns text
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then
    return 'Aucun compte trouvé pour ' || p_email || '. Créez d''abord l''utilisateur dans Authentication > Users.';
  end if;
  insert into public.admin_users (user_id, email, role) values (uid, lower(btrim(p_email)), p_role)
    on conflict (user_id) do update set role = excluded.role;
  return 'Accès administrateur accordé à ' || p_email;
end $$;


-- ---------------------------------------------------------------------
-- Enregistrement d'un produit complet (fiche + variantes + photos) en une
-- seule transaction : tout est enregistré, ou rien.
-- ---------------------------------------------------------------------
create or replace function public.admin_save_product(payload jsonb)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  r      public.products;
  v_id   uuid;
  v      jsonb;
  vr     public.product_variants;
  img    jsonb;
  ir     public.product_images;
  keep   uuid[];
  pos    int;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if jsonb_typeof(payload -> 'variants') <> 'array' or jsonb_array_length(payload -> 'variants') = 0 then
    raise exception 'VALIDATION' using errcode = 'P0001', detail = 'variants', hint = 'Ajoutez au moins une variante (même sans taille ni couleur).';
  end if;

  r := jsonb_populate_record(null::public.products, payload -> 'product');
  v_id := r.id;

  if v_id is null then
    insert into public.products (slug, name, category_id, short_description, description, details, price,
      compare_at_price, status, is_featured, is_new, condition_note, tags, option1_name, option2_name,
      seo_title, seo_description, sort_order, is_demo)
    values (r.slug, r.name, r.category_id, coalesce(r.short_description, ''), coalesce(r.description, ''),
      coalesce(r.details, ''), r.price, r.compare_at_price, coalesce(r.status, 'draft'), coalesce(r.is_featured, false),
      coalesce(r.is_new, false), r.condition_note, coalesce(r.tags, '{}'), coalesce(r.option1_name, 'Taille'),
      coalesce(r.option2_name, 'Couleur'), r.seo_title, r.seo_description, coalesce(r.sort_order, 0), coalesce(r.is_demo, false))
    returning id into v_id;
  else
    update public.products set
      slug = r.slug, name = r.name, category_id = r.category_id,
      short_description = coalesce(r.short_description, ''), description = coalesce(r.description, ''),
      details = coalesce(r.details, ''), price = r.price, compare_at_price = r.compare_at_price,
      status = coalesce(r.status, 'draft'), is_featured = coalesce(r.is_featured, false),
      is_new = coalesce(r.is_new, false), condition_note = r.condition_note, tags = coalesce(r.tags, '{}'),
      option1_name = coalesce(r.option1_name, 'Taille'), option2_name = coalesce(r.option2_name, 'Couleur'),
      seo_title = r.seo_title, seo_description = r.seo_description, sort_order = coalesce(r.sort_order, 0),
      is_demo = coalesce(r.is_demo, false)
    where id = v_id;
    if not found then
      raise exception 'NOT_FOUND' using errcode = 'P0001';
    end if;
  end if;

  -- Variantes
  keep := array(select (e ->> 'id')::uuid from jsonb_array_elements(payload -> 'variants') e
                where nullif(e ->> 'id', '') is not null);
  delete from public.product_variants where product_id = v_id and not (id = any (keep));
  pos := 0;
  for v in select * from jsonb_array_elements(payload -> 'variants') loop
    vr := jsonb_populate_record(null::public.product_variants, v);
    if vr.id is not null then
      update public.product_variants set sku = nullif(vr.sku, ''), option1 = nullif(vr.option1, ''),
        option2 = nullif(vr.option2, ''), color_hex = nullif(vr.color_hex, ''), price_override = vr.price_override,
        stock = coalesce(vr.stock, 0), is_active = coalesce(vr.is_active, true), position = pos
      where id = vr.id and product_id = v_id;
      if not found then
        raise exception 'VALIDATION' using errcode = 'P0001', detail = 'variants', hint = 'Variante inconnue.';
      end if;
    else
      insert into public.product_variants (product_id, sku, option1, option2, color_hex, price_override, stock, is_active, position)
      values (v_id, nullif(vr.sku, ''), nullif(vr.option1, ''), nullif(vr.option2, ''), nullif(vr.color_hex, ''),
        vr.price_override, coalesce(vr.stock, 0), coalesce(vr.is_active, true), pos);
    end if;
    pos := pos + 1;
  end loop;

  -- Photos
  keep := array(select (e ->> 'id')::uuid from jsonb_array_elements(coalesce(payload -> 'images', '[]')) e
                where nullif(e ->> 'id', '') is not null);
  delete from public.product_images where product_id = v_id and not (id = any (keep));
  pos := 0;
  for img in select * from jsonb_array_elements(coalesce(payload -> 'images', '[]')) loop
    ir := jsonb_populate_record(null::public.product_images, img);
    if ir.id is not null then
      update public.product_images set url = ir.url, thumb_url = ir.thumb_url, alt = coalesce(ir.alt, ''),
        width = ir.width, height = ir.height, storage_path = ir.storage_path, position = pos
      where id = ir.id and product_id = v_id;
    else
      insert into public.product_images (product_id, url, thumb_url, alt, width, height, storage_path, position)
      values (v_id, ir.url, ir.thumb_url, coalesce(ir.alt, ''), ir.width, ir.height, ir.storage_path, pos);
    end if;
    pos := pos + 1;
  end loop;

  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- Droits d'exécution des fonctions
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.get_order_status(text, uuid) to anon, authenticated;
grant execute on function public.submit_contact_message(jsonb) to anon, authenticated;
grant execute on function public.subscribe_newsletter(text, boolean, text) to anon, authenticated;
grant execute on function public.product_discount_percent(uuid) to anon, authenticated;
grant execute on function public.apply_discount(int, int) to anon, authenticated;
grant execute on function public.admin_update_order(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.admin_dashboard(int) to authenticated;
grant execute on function public.admin_remove_demo_content() to authenticated;
grant execute on function public.admin_save_product(jsonb) to authenticated;
-- grant_admin : volontairement non exposée à l'API (éditeur SQL uniquement)
-- Les fonctions de déclencheur et utilitaires internes restent non exécutables via l'API.
