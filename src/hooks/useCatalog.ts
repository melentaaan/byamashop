import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { backend } from '../backend';
import type { Catalog } from '../backend/types';
import { priceFor, type PriceInfo } from '../lib/pricing';
import type { ProductVariant, ProductWithRelations } from '../lib/types';
import { cartStore, type CartLine } from '../lib/cart';

export const CATALOG_KEY = ['catalog'] as const;

export function useCatalog() {
  return useQuery({ queryKey: CATALOG_KEY, queryFn: () => backend.getCatalog(), staleTime: 60_000 });
}

export function productPrice(catalog: Catalog, product: ProductWithRelations, variant?: ProductVariant | null): PriceInfo {
  return priceFor(product, variant ?? null, catalog.promotions, catalog.collections);
}

/** Prix « à partir de » : la variante active la moins chère. */
export function productFromPrice(catalog: Catalog, product: ProductWithRelations): PriceInfo & { varies: boolean } {
  const active = product.variants.filter((v) => v.is_active);
  const prices = (active.length ? active : [null]).map((v) => productPrice(catalog, product, v));
  const min = prices.reduce((a, b) => (b.price < a.price ? b : a));
  return { ...min, varies: new Set(prices.map((p) => p.price)).size > 1 };
}

export function totalStock(product: ProductWithRelations): number {
  return product.variants.filter((v) => v.is_active).reduce((s, v) => s + v.stock, 0);
}

export interface ResolvedCartLine extends CartLine {
  product: ProductWithRelations | null;
  variant: ProductVariant | null;
  unitPrice: number;
  compareAt: number | null;
  lineTotal: number;
  /** Problème éventuel : produit retiré, variante indisponible, stock insuffisant */
  issue: null | 'unavailable' | 'insufficient';
  available: number;
}

export function resolveCart(catalog: Catalog | undefined, lines: CartLine[]): { lines: ResolvedCartLine[]; subtotal: number; count: number; hasIssues: boolean } {
  const resolved = lines.map((l): ResolvedCartLine => {
    const product = catalog?.products.find((p) => p.id === l.productId) ?? null;
    const variant = product?.variants.find((v) => v.id === l.variantId) ?? null;
    if (!catalog || !product || !variant || !variant.is_active) {
      return { ...l, product, variant, unitPrice: 0, compareAt: null, lineTotal: 0, issue: catalog ? 'unavailable' : null, available: 0 };
    }
    const price = productPrice(catalog, product, variant);
    return {
      ...l, product, variant, unitPrice: price.price, compareAt: price.compareAt, lineTotal: price.price * l.quantity,
      issue: variant.stock <= 0 ? 'unavailable' : variant.stock < l.quantity ? 'insufficient' : null,
      available: variant.stock,
    };
  });
  const ok = resolved.filter((l) => l.issue !== 'unavailable');
  return {
    lines: resolved,
    subtotal: ok.reduce((s, l) => s + l.lineTotal, 0),
    count: lines.reduce((s, l) => s + l.quantity, 0),
    hasIssues: resolved.some((l) => l.issue !== null),
  };
}

export function useCart() {
  const lines = cartStore.use();
  const { data } = useCatalog();
  return useMemo(() => resolveCart(data, lines), [data, lines]);
}

export function variantLabel(product: Pick<ProductWithRelations, 'option1_name' | 'option2_name'>, v: Pick<ProductVariant, 'option1' | 'option2'> | null): string {
  if (!v) return '';
  return [v.option1 && `${product.option1_name} : ${v.option1}`, v.option2 && `${product.option2_name} : ${v.option2}`].filter(Boolean).join(' · ');
}
