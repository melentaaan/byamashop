import type { Collection, DeliveryZone, Product, ProductVariant, Promotion } from './types';

/** Même règle que public.apply_discount (SQL) : arrondi au multiple de 5 FCFA le plus proche. */
export function applyDiscount(base: number, percent: number): number {
  if (percent <= 0) return base;
  return Math.round((base * (100 - percent)) / 100 / 5) * 5;
}

export function isPromotionLive(p: Promotion, now = new Date()): boolean {
  if (!p.is_active) return false;
  if (p.starts_at && new Date(p.starts_at) > now) return false;
  if (p.ends_at && new Date(p.ends_at) <= now) return false;
  return true;
}

/** Même règle que public.product_discount_percent : la meilleure promotion active s'applique. */
export function discountPercentFor(
  product: Pick<Product, 'id' | 'category_id'>,
  promotions: Promotion[],
  collections: Pick<Collection, 'id' | 'product_ids'>[],
  now = new Date(),
): number {
  let best = 0;
  for (const promo of promotions) {
    if (!isPromotionLive(promo, now)) continue;
    const applies =
      promo.scope === 'all' ||
      (promo.scope === 'category' && promo.category_id === product.category_id) ||
      (promo.scope === 'products' && promo.product_ids.includes(product.id)) ||
      (promo.scope === 'collection' &&
        collections.some((c) => c.id === promo.collection_id && c.product_ids.includes(product.id)));
    if (applies && promo.percent_off > best) best = promo.percent_off;
  }
  return best;
}

export interface PriceInfo {
  /** Prix payé par le client */
  price: number;
  /** Prix barré à afficher, le cas échéant */
  compareAt: number | null;
  percentOff: number;
}

export function variantBasePrice(product: Pick<Product, 'price'>, variant?: Pick<ProductVariant, 'price_override'> | null): number {
  return variant?.price_override ?? product.price;
}

export function priceFor(
  product: Pick<Product, 'id' | 'category_id' | 'price' | 'compare_at_price'>,
  variant: Pick<ProductVariant, 'price_override'> | null | undefined,
  promotions: Promotion[],
  collections: Pick<Collection, 'id' | 'product_ids'>[],
  now = new Date(),
): PriceInfo {
  const base = variantBasePrice(product, variant);
  const pct = discountPercentFor(product, promotions, collections, now);
  const price = applyDiscount(base, pct);
  let compareAt: number | null = null;
  if (pct > 0) compareAt = Math.max(base, product.compare_at_price ?? 0);
  else if (product.compare_at_price && product.compare_at_price > price) compareAt = product.compare_at_price;
  const percentOff = compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  return { price, compareAt, percentOff };
}

/** Frais de livraison — même règle que place_order (SQL). */
export function deliveryFee(zone: Pick<DeliveryZone, 'fee' | 'free_from'> | null | undefined, subtotal: number): number {
  if (!zone) return 0;
  if (zone.free_from != null && subtotal >= zone.free_from) return 0;
  return zone.fee;
}

export function orderTotals(subtotal: number, zone: Pick<DeliveryZone, 'fee' | 'free_from'> | null | undefined) {
  const fee = deliveryFee(zone, subtotal);
  return { subtotal, deliveryFee: fee, total: subtotal + fee };
}
