import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { asRole, createTestDatabase, createUser } from './helpers';
import { applyDiscount } from '../../src/lib/pricing';
import { normalizePhone } from '../../src/lib/format';

let db: pg.Client;
let adminId: string;
let customerUserId: string;

beforeAll(async () => {
  db = await createTestDatabase('byamashop_test');
  adminId = await createUser(db, 'owner@example.test', true);
  customerUserId = await createUser(db, 'someone@example.test', false);
});
afterAll(async () => {
  await db?.end();
});
beforeEach(async () => {
  await db.query('truncate public.request_log');
});

async function variantOf(slug: string, index = 0) {
  const { rows } = await db.query(
    `select v.*, p.price from product_variants v join products p on p.id = v.product_id
     where p.slug = $1 order by v.position offset $2 limit 1`, [slug, index]);
  return rows[0] as { id: string; stock: number; price: number; price_override: number | null; product_id: string };
}
async function zone(name: string) {
  const { rows } = await db.query('select * from delivery_zones where name = $1', [name]);
  return rows[0] as { id: string; fee: number };
}

function payload(over: Partial<Record<string, unknown>> & { items: { variant_id: string; quantity: number }[]; zone_id: string }) {
  return {
    idempotency_key: randomUUID(),
    customer: { name: 'Awa Diop', phone: '77 123 45 67', email: '' },
    delivery: { zone_id: over.zone_id, address: 'Sacré-Cœur 3, villa 12', notes: '' },
    payment_method: 'wave',
    accept_terms: true,
    note: '',
    website: '',
    ...over,
  };
}

async function placeOrder(p: unknown, headers: Record<string, string> = {}) {
  const rows = await asRole<{ r: { reference: string; access_token: string; total: number; duplicate: boolean } }>(
    db, 'anon', null, 'select public.place_order($1::jsonb) as r', [JSON.stringify(p)], headers);
  return rows[0].r;
}

describe('Lecture publique du catalogue (RLS)', () => {
  it('un visiteur voit les produits publiés mais pas les brouillons', async () => {
    await db.query(`update products set status = 'draft' where slug = 'gourde-isotherme'`);
    const rows = await asRole<{ slug: string }>(db, 'anon', null, 'select slug from products');
    expect(rows.length).toBe(33);
    expect(rows.find((r) => r.slug === 'gourde-isotherme')).toBeUndefined();
    const variants = await asRole(db, 'anon', null,
      `select v.id from product_variants v join products p on p.id = v.product_id where p.slug = 'gourde-isotherme'`);
    expect(variants).toHaveLength(0);
    await db.query(`update products set status = 'published' where slug = 'gourde-isotherme'`);
  });

  it('un visiteur ne peut ni lire les commandes ni modifier le catalogue', async () => {
    await expect(asRole(db, 'anon', null, 'select * from orders')).rejects.toThrow(/permission denied/);
    await expect(asRole(db, 'anon', null, `update products set price = 1`)).rejects.toThrow(/permission denied/);
    await expect(asRole(db, 'anon', null, `select * from request_log`)).rejects.toThrow(/permission denied/);
  });

  it('un utilisateur connecté non administrateur ne peut rien modifier', async () => {
    const updated = await asRole(db, 'authenticated', customerUserId, `update products set price = 1 returning id`);
    expect(updated).toHaveLength(0);
    const orders = await asRole(db, 'authenticated', customerUserId, `select * from orders`);
    expect(orders).toHaveLength(0);
    await expect(asRole(db, 'authenticated', customerUserId, `select public.admin_dashboard(30)`)).rejects.toThrow(/FORBIDDEN/);
    await expect(asRole(db, 'authenticated', customerUserId, `update store_settings set data = '{}'::jsonb returning id`))
      .resolves.toHaveLength(0);
    await expect(asRole(db, 'anon', null, `select public.grant_admin('someone@example.test')`)).rejects.toThrow(/permission denied/);
  });
});

describe('Passage de commande (place_order)', () => {
  it('recalcule les prix côté serveur, applique la livraison et réserve le stock', async () => {
    const v = await variantOf('tapis-priere-velours-medine');
    await db.query('update product_variants set stock = 10 where id = $1', [v.id]);
    const z = await zone('Dakar (centre & banlieue)');
    const res = await placeOrder(payload({
      zone_id: z.id,
      items: [{ variant_id: v.id, quantity: 2 }],
      // tentative de fraude : un prix fourni par le client est ignoré
      unit_price: 1,
    } as never));
    expect(res.reference).toMatch(/^BY-\d{6}-[A-Z2-9]{4}$/);
    expect(res.duplicate).toBe(false);
    expect(res.total).toBe(2 * v.price + z.fee);
    const after = await variantOf('tapis-priere-velours-medine');
    expect(after.stock).toBe(8);
    const { rows } = await db.query('select * from orders where reference = $1', [res.reference]);
    expect(rows[0].customer_phone).toBe('+221771234567');
    expect(rows[0].payment_status).toBe('pending');
    expect(rows[0].status).toBe('new');
  });

  it('ne crée jamais de doublon avec la même clé', async () => {
    const v = await variantOf('savon-noir-beldi');
    await db.query('update product_variants set stock = 5 where id = $1', [v.id]);
    const z = await zone('Dakar (centre & banlieue)');
    const p = payload({ zone_id: z.id, items: [{ variant_id: v.id, quantity: 1 }] });
    const a = await placeOrder(p);
    const b = await placeOrder(p);
    expect(b.duplicate).toBe(true);
    expect(b.reference).toBe(a.reference);
    const { rows } = await db.query('select count(*)::int as n from orders where idempotency_key = $1', [p.idempotency_key]);
    expect(rows[0].n).toBe(1);
    expect((await variantOf('savon-noir-beldi')).stock).toBe(4);
  });

  it('refuse une quantité supérieure au stock et annule tout', async () => {
    const v1 = await variantOf('ghassoul-argile');
    const v2 = await variantOf('caftan-brode');
    await db.query('update product_variants set stock = 3 where id = $1', [v1.id]);
    await db.query('update product_variants set stock = 1 where id = $1', [v2.id]);
    const z = await zone('Thiès / Mbour');
    const before = (await db.query('select count(*)::int n from orders')).rows[0].n;
    await expect(placeOrder(payload({ zone_id: z.id, items: [{ variant_id: v1.id, quantity: 2 }, { variant_id: v2.id, quantity: 2 }] })))
      .rejects.toMatchObject({ message: 'OUT_OF_STOCK' });
    expect((await variantOf('ghassoul-argile')).stock).toBe(3);
    expect((await db.query('select count(*)::int n from orders')).rows[0].n).toBe(before);
  });

  it('valide les champs obligatoires', async () => {
    const v = await variantOf('savon-noir-beldi');
    const z = await zone('Dakar (centre & banlieue)');
    const base = { zone_id: z.id, items: [{ variant_id: v.id, quantity: 1 }] };
    await expect(placeOrder({ ...payload(base), customer: { name: 'A', phone: '771234567' } })).rejects.toMatchObject({ detail: 'customer.name' });
    await expect(placeOrder({ ...payload(base), customer: { name: 'Awa', phone: '123' } })).rejects.toMatchObject({ detail: 'customer.phone' });
    await expect(placeOrder({ ...payload(base), accept_terms: false })).rejects.toMatchObject({ detail: 'accept_terms' });
    await expect(placeOrder({ ...payload(base), payment_method: 'bitcoin' })).rejects.toMatchObject({ detail: 'payment_method' });
    await expect(placeOrder({ ...payload(base), items: [] })).rejects.toMatchObject({ detail: 'items' });
    await expect(placeOrder({ ...payload(base), delivery: { zone_id: randomUUID(), address: 'x x x x' } })).rejects.toMatchObject({ detail: 'delivery.zone_id' });
    await expect(placeOrder({ ...payload(base), website: 'http://spam' })).rejects.toMatchObject({ message: 'INVALID_REQUEST' });
    await expect(placeOrder({ ...payload(base), items: [{ variant_id: v.id, quantity: 0 }] })).rejects.toMatchObject({ detail: 'items.quantity' });
  });

  it('refuse un moyen de paiement désactivé dans les réglages', async () => {
    await db.query(`update store_settings set data = jsonb_set(data, '{payments,cash_on_delivery,enabled}', 'false')`);
    const v = await variantOf('savon-noir-beldi');
    const z = await zone('Dakar (centre & banlieue)');
    await expect(placeOrder(payload({ zone_id: z.id, items: [{ variant_id: v.id, quantity: 1 }], payment_method: 'cash_on_delivery' })))
      .rejects.toMatchObject({ detail: 'payment_method' });
    await db.query(`update store_settings set data = jsonb_set(data, '{payments,cash_on_delivery,enabled}', 'true')`);
  });

  it('livraison offerte au-delà du seuil configuré, retrait sans adresse', async () => {
    const v = await variantOf('caftan-brode', 1);
    await db.query('update product_variants set stock = 5 where id = $1', [v.id]);
    const z = await zone('Autres régions');
    await db.query('update delivery_zones set free_from = 30000 where id = $1', [z.id]);
    const res = await placeOrder(payload({ zone_id: z.id, items: [{ variant_id: v.id, quantity: 1 }] }));
    expect(res.total).toBe(35000);
    await db.query('update delivery_zones set free_from = null where id = $1', [z.id]);

    const pickup = await zone('Retrait sur place');
    const res2 = await placeOrder({ ...payload({ zone_id: pickup.id, items: [{ variant_id: v.id, quantity: 1 }] }), delivery: { zone_id: pickup.id, address: '' } });
    expect(res2.total).toBe(35000);
  });

  it('applique les promotions actives et les prix par variante', async () => {
    const small = await variantOf('eau-de-parfum-oud-royal', 0); // 50 ml
    const big = await variantOf('eau-de-parfum-oud-royal', 1); // 100 ml
    await db.query('update product_variants set stock = 5 where product_id = $1', [small.product_id]);
    expect(small.price_override).toBeNull();
    expect(big.price_override).toBe(15000);
    await db.query(`insert into promotions (name, percent_off, scope, category_id)
                    select 'Test', 15, 'category', category_id from products where slug = 'eau-de-parfum-oud-royal'`);
    const z = await zone('Retrait sur place');
    const res = await placeOrder(payload({ zone_id: z.id, items: [{ variant_id: small.id, quantity: 1 }, { variant_id: big.id, quantity: 1 }] }));
    expect(res.total).toBe(applyDiscount(9000, 15) + applyDiscount(15000, 15));
    const { rows } = await db.query(`select discount_total from orders where reference = $1`, [res.reference]);
    expect(rows[0].discount_total).toBe(9000 + 15000 - res.total);
    await db.query(`delete from promotions`);
  });

  it('limite le nombre de commandes par téléphone', async () => {
    const v = await variantOf('huile-parfumee-musc-blanc');
    await db.query('update product_variants set stock = 99 where id = $1', [v.id]);
    const z = await zone('Dakar (centre & banlieue)');
    const p = (i: number) => ({ ...payload({ zone_id: z.id, items: [{ variant_id: v.id, quantity: 1 }] }), customer: { name: 'Robot ' + i, phone: '+221 78 000 00 01' } });
    for (let i = 0; i < 5; i++) await placeOrder(p(i));
    await expect(placeOrder(p(6))).rejects.toMatchObject({ message: 'RATE_LIMITED' });
  });

  it('le suivi de commande exige la référence ET le jeton secret', async () => {
    const v = await variantOf('savon-noir-beldi');
    await db.query('update product_variants set stock = 5 where id = $1', [v.id]);
    const z = await zone('Dakar (centre & banlieue)');
    const res = await placeOrder(payload({ zone_id: z.id, items: [{ variant_id: v.id, quantity: 1 }] }));
    const ok = await asRole<{ r: { reference: string; items: unknown[] } }>(db, 'anon', null, 'select public.get_order_status($1, $2) as r', [res.reference, res.access_token]);
    expect(ok[0].r.reference).toBe(res.reference);
    expect(ok[0].r.items).toHaveLength(1);
    const ko = await asRole<{ r: unknown }>(db, 'anon', null, 'select public.get_order_status($1, $2) as r', [res.reference, randomUUID()]);
    expect(ko[0].r).toBeNull();
  });
});

describe('Administration', () => {
  it('annuler une commande remet le stock, une seule fois, et ne peut pas être annulé', async () => {
    const v = await variantOf('tapis-priere-enfant');
    await db.query('update product_variants set stock = 4 where id = $1', [v.id]);
    const z = await zone('Dakar (centre & banlieue)');
    const res = await placeOrder(payload({ zone_id: z.id, items: [{ variant_id: v.id, quantity: 3 }] }));
    expect((await variantOf('tapis-priere-enfant')).stock).toBe(1);
    const id = (await db.query('select id from orders where reference = $1', [res.reference])).rows[0].id;

    await asRole(db, 'authenticated', adminId, `select public.admin_update_order($1, 'cancelled')`, [id]);
    expect((await variantOf('tapis-priere-enfant')).stock).toBe(4);
    await expect(asRole(db, 'authenticated', adminId, `select public.admin_update_order($1, 'confirmed')`, [id])).rejects.toThrow(/VALIDATION/);
    expect((await variantOf('tapis-priere-enfant')).stock).toBe(4);
    const events = (await db.query('select kind from order_events where order_id = $1 order by id', [id])).rows.map((r) => r.kind);
    expect(events).toEqual(['created', 'stock_released', 'status']);
  });

  it('les statuts de paiement et de livraison sont tracés ; les montants sont protégés', async () => {
    const v = await variantOf('savon-noir-beldi');
    await db.query('update product_variants set stock = 5 where id = $1', [v.id]);
    const z = await zone('Dakar (centre & banlieue)');
    const res = await placeOrder(payload({ zone_id: z.id, items: [{ variant_id: v.id, quantity: 1 }] }));
    const id = (await db.query('select id from orders where reference = $1', [res.reference])).rows[0].id;
    await asRole(db, 'authenticated', adminId, `select public.admin_update_order($1, null, 'paid', 'in_transit', 'Reçu Wave vérifié', 'TX-123')`, [id]);
    const { rows } = await db.query('select * from orders where id = $1', [id]);
    expect(rows[0].payment_status).toBe('paid');
    expect(rows[0].paid_at).not.toBeNull();
    expect(rows[0].delivery_status).toBe('in_transit');
    expect(rows[0].payment_reference).toBe('TX-123');
    await expect(asRole(db, 'authenticated', adminId, `update orders set total = 1 where id = $1`, [id])).rejects.toThrow(/admin_update_order/);
    await expect(asRole(db, 'authenticated', adminId, `update orders set payment_status = 'refunded' where id = $1`, [id])).rejects.toThrow(/admin_update_order/);
    const note = await asRole(db, 'authenticated', adminId, `update orders set admin_note = 'Client fidèle', is_test = true where id = $1 returning id`, [id]);
    expect(note).toHaveLength(1);
  });

  it('crée puis modifie un produit complet en une transaction', async () => {
    const cat = (await db.query(`select id from categories where slug = 'parfums'`)).rows[0].id;
    const input = {
      product: { slug: 'nouveau-parfum-test', name: 'Nouveau parfum test', category_id: cat, price: 10000, status: 'published', tags: ['test'] },
      variants: [{ option1: '30 ml', stock: 4 }, { option1: '60 ml', stock: 2, price_override: 16000 }],
      images: [{ url: 'https://example.test/a.webp', alt: 'Flacon' }],
    };
    const [{ id }] = await asRole<{ id: string }>(db, 'authenticated', adminId, 'select public.admin_save_product($1::jsonb) as id', [JSON.stringify(input)]);
    const vs = (await db.query('select * from product_variants where product_id = $1 order by position', [id])).rows;
    expect(vs.map((v) => v.option1)).toEqual(['30 ml', '60 ml']);

    // Édition : prix, suppression d'une variante, mise à jour du stock
    const edit = {
      product: { ...input.product, id, price: 12000, name: 'Parfum test modifié' },
      variants: [{ id: vs[0].id, option1: '30 ml', stock: 9 }],
      images: [],
    };
    await asRole(db, 'authenticated', adminId, 'select public.admin_save_product($1::jsonb)', [JSON.stringify(edit)]);
    const p = (await db.query('select * from products where id = $1', [id])).rows[0];
    expect(p.price).toBe(12000);
    expect(p.name).toBe('Parfum test modifié');
    const vs2 = (await db.query('select * from product_variants where product_id = $1', [id])).rows;
    expect(vs2).toHaveLength(1);
    expect(vs2[0].stock).toBe(9);
    expect((await db.query('select count(*)::int n from product_images where product_id = $1', [id])).rows[0].n).toBe(0);

    // Données invalides : prix négatif refusé, rien n'est modifié
    await expect(asRole(db, 'authenticated', adminId, 'select public.admin_save_product($1::jsonb)',
      [JSON.stringify({ ...edit, product: { ...edit.product, price: -5 } })])).rejects.toThrow(/check constraint/);
    expect((await db.query('select price from products where id = $1', [id])).rows[0].price).toBe(12000);

    // Un non-administrateur est refusé
    await expect(asRole(db, 'authenticated', customerUserId, 'select public.admin_save_product($1::jsonb)', [JSON.stringify(edit)]))
      .rejects.toThrow(/FORBIDDEN/);
  });

  it('mise à jour directe du stock par un administrateur, stock négatif refusé', async () => {
    const v = await variantOf('gourde-isotherme');
    await asRole(db, 'authenticated', adminId, 'update product_variants set stock = 42 where id = $1', [v.id]);
    expect((await variantOf('gourde-isotherme')).stock).toBe(42);
    await expect(asRole(db, 'authenticated', adminId, 'update product_variants set stock = -1 where id = $1', [v.id])).rejects.toThrow(/check constraint/);
  });

  it('le tableau de bord n’inclut que les commandes réelles', async () => {
    const [{ r }] = await asRole<{ r: { orders_received: number; revenue: number; confirmed_sales: number } }>(
      db, 'authenticated', adminId, 'select public.admin_dashboard(30) as r');
    const real = (await db.query('select count(*)::int n from orders where not is_test')).rows[0].n;
    expect(r.orders_received).toBe(real);
    const paid = (await db.query(`select coalesce(sum(total),0)::int s from orders where not is_test and payment_status='paid' and status <> 'cancelled'`)).rows[0].s;
    expect(r.revenue).toBe(paid);
  });

  it('suppression du catalogue de démonstration sans casser les commandes', async () => {
    const before = (await db.query('select count(*)::int n from order_items')).rows[0].n;
    const [{ r }] = await asRole<{ r: { products: number } }>(db, 'authenticated', adminId, 'select public.admin_remove_demo_content() as r');
    expect(r.products).toBe(34);
    expect((await db.query('select count(*)::int n from products')).rows[0].n).toBe(1); // le produit créé par l’admin reste
    expect((await db.query('select count(*)::int n from order_items')).rows[0].n).toBe(before);
    expect((await db.query('select count(*)::int n from order_items where product_name is null')).rows[0].n).toBe(0);
  });
});

describe('Formulaires publics', () => {
  it('message de contact enregistré, lisible uniquement par l’administration', async () => {
    await asRole(db, 'anon', null, `select public.submit_contact_message($1::jsonb)`,
      [JSON.stringify({ name: 'Fatou', phone: '76 111 22 33', subject: 'gros', message: 'Bonjour, je souhaite un devis.' })]);
    await expect(asRole(db, 'anon', null, 'select * from contact_messages')).rejects.toThrow(/permission denied/);
    const rows = await asRole<{ phone: string }>(db, 'authenticated', adminId, 'select * from contact_messages');
    expect(rows[0].phone).toBe('+221761112233');
    await expect(asRole(db, 'anon', null, `select public.submit_contact_message($1::jsonb)`,
      [JSON.stringify({ name: 'Fatou', message: 'Bonjour test' })])).rejects.toThrow(/VALIDATION/);
  });

  it('newsletter : consentement obligatoire, pas de doublon', async () => {
    await expect(asRole(db, 'anon', null, `select public.subscribe_newsletter('a@b.sn', false)`)).rejects.toThrow(/VALIDATION/);
    await asRole(db, 'anon', null, `select public.subscribe_newsletter('A@b.sn', true)`);
    await asRole(db, 'anon', null, `select public.subscribe_newsletter('a@b.sn', true)`);
    expect((await db.query(`select count(*)::int n from newsletter_subscribers`)).rows[0].n).toBe(1);
  });
});

describe('Parité des règles TypeScript / SQL', () => {
  it('arrondi des remises identique', async () => {
    for (const [base, pct] of [[12000, 15], [3500, 10], [9999, 33], [7, 50], [15000, 0], [25000, 90]]) {
      const { rows } = await db.query('select public.apply_discount($1, $2) as v', [base, pct]);
      expect(rows[0].v).toBe(applyDiscount(base, pct));
    }
  });
  it('normalisation des téléphones identique', async () => {
    for (const input of ['77 123 45 67', '+221 77 123 45 67', '00221771234567', '221771234567', '+33 6 12 34 56 78', '123', '']) {
      const { rows } = await db.query('select public.normalize_phone($1) as v', [input]);
      expect(rows[0].v).toBe(normalizePhone(input));
    }
  });
});
