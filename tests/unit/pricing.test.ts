import { describe, expect, it } from 'vitest';
import { applyDiscount, deliveryFee, discountPercentFor, orderTotals, priceFor } from '../../src/lib/pricing';
import type { Promotion } from '../../src/lib/types';

const promo = (p: Partial<Promotion>): Promotion => ({ id: 'x', name: 'P', percent_off: 10, scope: 'all', category_id: null, collection_id: null, product_ids: [], starts_at: null, ends_at: null, is_active: true, ...p });
const product = { id: 'p1', category_id: 'c1', price: 12000, compare_at_price: null as number | null };

describe('Calcul des prix', () => {
  it('arrondit les remises au multiple de 5 FCFA', () => {
    expect(applyDiscount(12000, 15)).toBe(10200);
    expect(applyDiscount(3333, 10)).toBe(3000);
    expect(applyDiscount(9999, 33)).toBe(6700);
    expect(applyDiscount(5000, 0)).toBe(5000);
  });
  it('applique la meilleure promotion active seulement', () => {
    const now = new Date('2026-11-10T12:00:00Z');
    const promos = [
      promo({ percent_off: 10, scope: 'category', category_id: 'c1' }),
      promo({ percent_off: 30, scope: 'category', category_id: 'c2' }),
      promo({ percent_off: 25, scope: 'products', product_ids: ['p1'], ends_at: '2026-11-09T00:00:00Z' }), // terminée
      promo({ percent_off: 20, scope: 'collection', collection_id: 'k1' }),
      promo({ percent_off: 50, scope: 'all', is_active: false }),
    ];
    expect(discountPercentFor(product, promos, [], now)).toBe(10);
    expect(discountPercentFor(product, promos, [{ id: 'k1', product_ids: ['p1'] }], now)).toBe(20);
  });
  it('affiche un prix barré cohérent', () => {
    expect(priceFor({ ...product, compare_at_price: 15000 }, null, [], [])).toEqual({ price: 12000, compareAt: 15000, percentOff: 20 });
    expect(priceFor(product, { price_override: 9000 }, [promo({ percent_off: 10 })], [])).toEqual({ price: 8100, compareAt: 9000, percentOff: 10 });
    expect(priceFor(product, null, [], []).compareAt).toBeNull();
  });
});

describe('Frais de livraison', () => {
  it('ajoute les frais de la zone', () => {
    expect(orderTotals(10000, { fee: 1500, free_from: null })).toEqual({ subtotal: 10000, deliveryFee: 1500, total: 11500 });
  });
  it('offre la livraison au-delà du seuil', () => {
    expect(deliveryFee({ fee: 2000, free_from: 30000 }, 29995)).toBe(2000);
    expect(deliveryFee({ fee: 2000, free_from: 30000 }, 30000)).toBe(0);
  });
  it('retrait gratuit et zone non choisie', () => {
    expect(deliveryFee({ fee: 0, free_from: null }, 5000)).toBe(0);
    expect(orderTotals(5000, null).total).toBe(5000);
  });
});
