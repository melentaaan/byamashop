-- =====================================================================
-- Byamashop — confirmation de paiement par un prestataire (Wave…)
-- Appelée UNIQUEMENT côté serveur (fonction Netlify) avec la clé service_role,
-- après vérification de la signature du webhook. Jamais exposée aux visiteurs.
-- =====================================================================
create or replace function public.confirm_provider_payment(
  p_reference text, p_amount int, p_currency text, p_provider text, p_provider_ref text
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  o public.orders%rowtype;
begin
  select * into o from public.orders where reference = p_reference for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_order');
  end if;
  if o.status = 'cancelled' then
    return jsonb_build_object('ok', false, 'reason', 'order_cancelled');
  end if;
  if upper(coalesce(p_currency, '')) <> 'XOF' or p_amount <> o.total then
    insert into public.order_events (order_id, kind, note)
      values (o.id, 'note', format('Paiement %s reçu mais montant/devise incohérent (%s %s, attendu %s XOF) — à vérifier', p_provider, p_amount, p_currency, o.total));
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch');
  end if;
  if o.payment_status = 'paid' then
    return jsonb_build_object('ok', true, 'already_paid', true);
  end if;
  perform set_config('byamashop.internal', 'on', true);
  update public.orders set payment_status = 'paid', paid_at = now(), payment_reference = left(p_provider_ref, 120) where id = o.id;
  perform set_config('byamashop.internal', 'off', true);
  insert into public.order_events (order_id, kind, from_value, to_value, note)
    values (o.id, 'payment', o.payment_status, 'paid', format('Confirmé automatiquement par %s (%s)', p_provider, p_provider_ref));
  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.confirm_provider_payment(text, int, text, text, text) from public, anon, authenticated;
grant execute on function public.confirm_provider_payment(text, int, text, text, text) to service_role;
