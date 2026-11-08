import './storage-shim';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoBackend, DEMO_ADMIN, resetDemoData } from '../../src/backend/demo';
import { demoProducts } from '../../src/data/demo/catalog';
import { defaultZones } from '../../src/data/demo/settings';

const b = createDemoBackend();
const variant = (slug: string, i = 0) => demoProducts.find((p) => p.slug === slug)!.variants[i];
const payload = (items: { variant_id: string; quantity: number }[], key = crypto.randomUUID()) => ({
  idempotency_key: key, customer: { name: 'Awa Diop', phone: '771234567' }, delivery: { zone_id: defaultZones[0].id, address: 'Sacré-Cœur 3' },
  payment_method: 'wave' as const, accept_terms: true, items,
});

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); resetDemoData(); });

describe('Backend de démonstration (mêmes règles que la base)', () => {
  it('enregistre la commande, calcule le total et réserve le stock', async () => {
    const v = variant('huile-argan-cosmetique');
    const r = await b.placeOrder(payload([{ variant_id: v.id, quantity: 2 }]));
    expect(r.total).toBe(2 * 8000 + 1500);
    const cat = await b.getCatalog();
    expect(cat.products.find((p) => p.slug === 'huile-argan-cosmetique')!.variants[0].stock).toBe(v.stock - 2);
    const o = await b.getOrderStatus(r.reference, r.access_token);
    expect(o?.payment_status).toBe('pending');
    expect(await b.getOrderStatus(r.reference, crypto.randomUUID())).toBeNull();
  });
  it('ne crée pas de doublon', async () => {
    const v = variant('huile-argan-cosmetique');
    const p = payload([{ variant_id: v.id, quantity: 1 }]);
    const a = await b.placeOrder(p);
    const c = await b.placeOrder(p);
    expect(c.duplicate).toBe(true);
    expect(c.reference).toBe(a.reference);
  });
  it('refuse un stock insuffisant', async () => {
    const v = variant('jean-droit-femme');
    await expect(b.placeOrder(payload([{ variant_id: v.id, quantity: 5 }]))).rejects.toMatchObject({ code: 'OUT_OF_STOCK' });
  });
  it('protège l’administration', async () => {
    await expect(b.admin.listProducts()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(b.signIn(DEMO_ADMIN.email, 'mauvais')).rejects.toMatchObject({ code: 'AUTH' });
    await b.signIn(DEMO_ADMIN.email, DEMO_ADMIN.password);
    expect((await b.admin.listProducts()).length).toBe(demoProducts.length);
  });
  it('annulation : remise en stock', async () => {
    const v = variant('ghassoul-argile');
    const r = await b.placeOrder(payload([{ variant_id: v.id, quantity: 1 }]));
    await b.signIn(DEMO_ADMIN.email, DEMO_ADMIN.password);
    const [order] = await b.admin.listOrders({});
    await b.admin.updateOrder(order.id, { status: 'cancelled' });
    const p = (await b.admin.listProducts()).find((x) => x.slug === 'ghassoul-argile')!;
    expect(p.variants[0].stock).toBe(v.stock);
    await expect(b.admin.updateOrder(order.id, { status: 'confirmed' })).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(r.reference).toBe(order.reference);
  });
});
