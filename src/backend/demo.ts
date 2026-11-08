/**
 * Backend de DÉMONSTRATION — tout est stocké dans le navigateur (localStorage).
 * Utilisé quand Supabase n'est pas configuré (développement, aperçu, tests de bout en bout).
 * Reproduit les règles de la base (supabase/migrations) : prix recalculés, stock réservé,
 * idempotence, validation. Aucune commande n'est transmise à la boutique dans ce mode.
 */
import type {
  Category, Collection, ContactMessage, DashboardStats, DeliveryZone, NewsletterSubscriber, Order, OrderEvent, OrderItem,
  OrderWithItems, Page, PlaceOrderPayload, ProductWithRelations, Promotion, PublicOrder, StoreSettings,
} from '../lib/types';
import { ShopError } from '../lib/types';
import { demoCategories, demoCollections, demoProducts } from '../data/demo/catalog';
import { defaultSettings, defaultZones } from '../data/demo/settings';
import { mergeSettings } from '../lib/settings';
import { applyDiscount, deliveryFee, discountPercentFor } from '../lib/pricing';
import { normalizePhone } from '../lib/format';
import { messageFor } from './errors';
import type { AdminUser, Catalog, ShopBackend } from './types';

const legalPages = import.meta.glob('/content/legal/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const DEMO_ADMIN = { email: 'admin@demo.byamashop', password: 'demo-byamashop' };
const KEY = 'byamashop_demo_db_v1';
const SESSION_KEY = 'byamashop_demo_session';

interface DemoDb {
  categories: Category[];
  products: ProductWithRelations[];
  collections: Collection[];
  promotions: Promotion[];
  zones: DeliveryZone[];
  settings: StoreSettings;
  pages: Page[];
  orders: (Order & { idempotency_key: string; access_token: string; stock_released: boolean })[];
  items: OrderItem[];
  events: OrderEvent[];
  messages: ContactMessage[];
  subscribers: NewsletterSubscriber[];
  requestLog: { kind: string; key: string; at: number }[];
}

function initialDb(): DemoDb {
  const pages: Page[] = Object.entries(legalPages).map(([path, body]) => ({
    slug: path.split('/').pop()!.replace(/\.md$/, ''),
    title: /^# (.+)$/m.exec(body)?.[1] ?? '',
    body,
    is_published: true,
    updated_at: new Date().toISOString(),
  }));
  return {
    categories: structuredClone(demoCategories),
    products: structuredClone(demoProducts),
    collections: structuredClone(demoCollections),
    promotions: [],
    zones: structuredClone(defaultZones),
    settings: structuredClone(defaultSettings),
    pages,
    orders: [],
    items: [],
    events: [],
    messages: [],
    subscribers: [],
    requestLog: [],
  };
}

const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

let memoryDb: DemoDb | null = null;
function load(): DemoDb {
  const s = storage();
  if (s) {
    try {
      const raw = s.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoDb;
        parsed.settings = mergeSettings(parsed.settings);
        return parsed;
      }
    } catch { /* données corrompues : on repart de zéro */ }
  }
  if (!memoryDb) memoryDb = initialDb();
  return memoryDb;
}
function save(db: DemoDb) {
  memoryDb = db;
  try { storage()?.setItem(KEY, JSON.stringify(db)); } catch { /* quota : on garde en mémoire */ }
}
function mutate<T>(fn: (db: DemoDb) => T): T {
  const db = load();
  const r = fn(db);
  save(db);
  return r;
}

function fail(code: string, hint?: string, field?: string, details?: unknown): never {
  throw new ShopError(code, hint ?? messageFor(code), { field, details });
}

function rateLimit(db: DemoDb, kind: string, key: string, max: number, windowMs: number) {
  const t = Date.now();
  db.requestLog = db.requestLog.filter((r) => t - r.at < 2 * 86400000);
  const n = db.requestLog.filter((r) => r.kind === kind && r.key === key && t - r.at < windowMs).length;
  if (n >= max) fail('RATE_LIMITED', 'Trop de tentatives. Merci de patienter quelques minutes.');
  db.requestLog.push({ kind, key, at: t });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function newReference(db: DemoDb): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  for (;;) {
    let r = `BY-${ymd}-`;
    for (let i = 0; i < 4; i++) r += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (!db.orders.some((o) => o.reference === r)) return r;
  }
}

function isLoggedIn(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === '1' || storage()?.getItem(SESSION_KEY) === '1'; } catch { return false; }
}
function requireAdmin() {
  if (!isLoggedIn()) fail('FORBIDDEN');
}

const listeners = new Set<() => void>();

export function createDemoBackend(): ShopBackend {
  const backend: ShopBackend = {
    mode: 'demo',

    async getCatalog(): Promise<Catalog> {
      await delay(80);
      const db = load();
      const t = new Date();
      return structuredClone({
        categories: db.categories.filter((c) => c.is_published).sort((a, b) => a.sort_order - b.sort_order),
        products: db.products.filter((p) => p.status === 'published').sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at)),
        collections: db.collections.filter((c) => c.is_published).sort((a, b) => a.sort_order - b.sort_order),
        promotions: db.promotions.filter((p) => p.is_active && (!p.starts_at || new Date(p.starts_at) <= t) && (!p.ends_at || new Date(p.ends_at) > t)),
        zones: db.zones.filter((z) => z.is_active).sort((a, b) => a.sort_order - b.sort_order),
        settings: db.settings,
      });
    },

    async getPage(slug) {
      await delay(40);
      const p = load().pages.find((x) => x.slug === slug && x.is_published);
      return p ? structuredClone(p) : null;
    },

    async placeOrder(payload: PlaceOrderPayload) {
      await delay(350);
      return mutate((db) => {
        if (payload.website) fail('INVALID_REQUEST');
        if (!payload.idempotency_key) fail('INVALID_REQUEST', 'Clé de commande manquante.');
        const existing = db.orders.find((o) => o.idempotency_key === payload.idempotency_key);
        if (existing) return { reference: existing.reference, access_token: existing.access_token, total: existing.total, duplicate: true };

        const name = (payload.customer.name ?? '').trim();
        const phone = normalizePhone(payload.customer.phone ?? '');
        const email = (payload.customer.email ?? '').trim().toLowerCase() || null;
        const address = (payload.delivery.address ?? '').trim();
        if (name.length < 2 || name.length > 120) fail('VALIDATION', 'Indiquez votre nom complet.', 'customer.name');
        if (!phone) fail('VALIDATION', 'Numéro de téléphone invalide.', 'customer.phone');
        if (email && !EMAIL_RE.test(email)) fail('VALIDATION', 'Adresse e-mail invalide.', 'customer.email');
        if (!payload.accept_terms) fail('VALIDATION', 'Veuillez accepter les conditions générales de vente.', 'accept_terms');
        const zone = db.zones.find((z) => z.id === payload.delivery.zone_id && z.is_active);
        if (!zone) fail('VALIDATION', 'Zone de livraison invalide.', 'delivery.zone_id');
        if (!zone.is_pickup && address.length < 4) fail('VALIDATION', 'Indiquez votre adresse de livraison.', 'delivery.address');
        if (!db.settings.payments[payload.payment_method]?.enabled) fail('VALIDATION', 'Moyen de paiement indisponible.', 'payment_method');
        if (!payload.items?.length || payload.items.length > 50) fail('VALIDATION', 'Votre panier est vide.', 'items');

        rateLimit(db, 'order_phone', phone, 5, 3600000);

        const grouped = new Map<string, number>();
        for (const it of payload.items) grouped.set(it.variant_id, (grouped.get(it.variant_id) ?? 0) + Math.floor(it.quantity));
        const missing: { variant_id: string; available: number }[] = [];
        const lines: { product: ProductWithRelations; variantIndex: number; qty: number }[] = [];
        for (const [variantId, qty] of grouped) {
          if (qty < 1 || qty > 99) fail('VALIDATION', 'Quantité invalide.', 'items.quantity');
          const product = db.products.find((p) => p.variants.some((v) => v.id === variantId));
          const variantIndex = product?.variants.findIndex((v) => v.id === variantId) ?? -1;
          const variant = product?.variants[variantIndex];
          if (!product || !variant || product.status !== 'published' || !variant.is_active) { missing.push({ variant_id: variantId, available: 0 }); continue; }
          if (variant.stock < qty) { missing.push({ variant_id: variantId, available: variant.stock }); continue; }
          lines.push({ product, variantIndex, qty });
        }
        if (missing.length) fail('OUT_OF_STOCK', 'Certains articles ne sont plus disponibles dans la quantité demandée.', undefined, missing);

        const orderId = uuid();
        let subtotal = 0;
        let discount = 0;
        for (const { product, variantIndex, qty } of lines) {
          const v = product.variants[variantIndex];
          const base = v.price_override ?? product.price;
          const unit = applyDiscount(base, discountPercentFor(product, db.promotions, db.collections));
          v.stock -= qty;
          const label = [v.option1 && `${product.option1_name} : ${v.option1}`, v.option2 && `${product.option2_name} : ${v.option2}`].filter(Boolean).join(' · ') || null;
          db.items.push({
            id: uuid(), order_id: orderId, product_id: product.id, variant_id: v.id, product_name: product.name,
            variant_label: label, image_url: product.images[0]?.url ?? null, unit_price: unit, base_price: base,
            quantity: qty, line_total: unit * qty,
          });
          subtotal += unit * qty;
          discount += (base - unit) * qty;
        }
        const fee = deliveryFee(zone, subtotal);
        const order = {
          id: orderId, reference: newReference(db), idempotency_key: payload.idempotency_key, access_token: uuid(),
          customer_name: name, customer_phone: phone, customer_email: email, delivery_zone_id: zone.id,
          delivery_zone_name: zone.name, delivery_address: zone.is_pickup && !address ? 'Retrait' : address,
          delivery_notes: payload.delivery.notes?.trim() || null, customer_note: payload.note?.trim() || null,
          payment_method: payload.payment_method, payment_status: 'pending' as const, status: 'new' as const,
          delivery_status: 'pending' as const, subtotal, discount_total: discount, delivery_fee: fee, total: subtotal + fee,
          payment_reference: null, admin_note: null, is_test: false, stock_released: false, paid_at: null,
          created_at: now(), updated_at: now(),
        };
        db.orders.unshift(order);
        db.events.push({ id: db.events.length + 1, order_id: orderId, kind: 'created', from_value: null, to_value: 'new', note: 'Commande passée sur le site', created_at: now() });
        return { reference: order.reference, access_token: order.access_token, total: order.total, duplicate: false };
      });
    },

    async getOrderStatus(reference, token): Promise<PublicOrder | null> {
      await delay(80);
      const db = load();
      const o = db.orders.find((x) => x.reference === reference.trim().toUpperCase() && x.access_token === token);
      if (!o) return null;
      return {
        reference: o.reference, created_at: o.created_at, customer_name: o.customer_name, customer_phone: o.customer_phone,
        delivery_zone_name: o.delivery_zone_name, delivery_address: o.delivery_address, payment_method: o.payment_method,
        payment_status: o.payment_status, status: o.status, delivery_status: o.delivery_status, subtotal: o.subtotal,
        discount_total: o.discount_total, delivery_fee: o.delivery_fee, total: o.total,
        items: db.items.filter((i) => i.order_id === o.id).map((i) => ({
          product_name: i.product_name, variant_label: i.variant_label, image_url: i.image_url,
          unit_price: i.unit_price, quantity: i.quantity, line_total: i.line_total,
        })),
      };
    },

    async submitContact(p) {
      await delay(200);
      mutate((db) => {
        if (p.website) return;
        if (!p.name || p.name.trim().length < 2) fail('VALIDATION', 'Indiquez votre nom.', 'name');
        if (!p.phone && !p.email) fail('VALIDATION', 'Indiquez un téléphone ou un e-mail pour que nous puissions vous répondre.', 'phone');
        if (p.phone && !normalizePhone(p.phone)) fail('VALIDATION', 'Numéro de téléphone invalide.', 'phone');
        if (p.email && !EMAIL_RE.test(p.email.trim())) fail('VALIDATION', 'Adresse e-mail invalide.', 'email');
        const msg = (p.message ?? '').trim();
        if (msg.length < 5 || msg.length > 3000) fail('VALIDATION', 'Votre message doit contenir entre 5 et 3000 caractères.', 'message');
        db.messages.unshift({ id: uuid(), name: p.name.trim(), phone: p.phone ? normalizePhone(p.phone) : null, email: p.email?.trim().toLowerCase() || null, subject: p.subject, message: msg, is_handled: false, created_at: now() });
      });
    },

    async subscribeNewsletter(email, consent, website = '') {
      await delay(200);
      mutate((db) => {
        if (website) return;
        if (!consent) fail('VALIDATION', 'Merci de cocher la case de consentement.', 'consent');
        const e = email.trim().toLowerCase();
        if (!EMAIL_RE.test(e)) fail('VALIDATION', 'Adresse e-mail invalide.', 'email');
        const ex = db.subscribers.find((s) => s.email === e);
        if (ex) ex.unsubscribed_at = null;
        else db.subscribers.unshift({ id: uuid(), email: e, created_at: now(), unsubscribed_at: null });
      });
    },

    async getCurrentUser(): Promise<AdminUser | null> {
      return isLoggedIn() ? { id: 'demo-admin', email: DEMO_ADMIN.email, isAdmin: true } : null;
    },
    async signIn(email, password) {
      await delay(250);
      if (email.trim().toLowerCase() !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
        throw new ShopError('AUTH', 'E-mail ou mot de passe incorrect.');
      }
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
      listeners.forEach((l) => l());
      return { id: 'demo-admin', email: DEMO_ADMIN.email, isAdmin: true };
    },
    async signOut() {
      try { sessionStorage.removeItem(SESSION_KEY); storage()?.removeItem(SESSION_KEY); } catch { /* ignore */ }
      listeners.forEach((l) => l());
    },
    async requestPasswordReset() {
      throw new ShopError('DEMO', 'En mode démonstration, aucun e-mail n’est envoyé.');
    },
    async updatePassword() {
      throw new ShopError('DEMO', 'En mode démonstration, le mot de passe ne peut pas être modifié.');
    },
    onAuthChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    admin: {
      async listProducts() { requireAdmin(); await delay(); return structuredClone(load().products); },
      async saveProduct({ product, variants, images }) {
        requireAdmin();
        await delay(250);
        return mutate((db) => {
          if (!variants.length) fail('VALIDATION', 'Ajoutez au moins une variante (même sans taille ni couleur).', 'variants');
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(product.slug)) fail('VALIDATION', 'Adresse (URL) invalide.', 'slug');
          if (product.price < 0 || !Number.isInteger(product.price)) fail('VALIDATION', 'Prix invalide.', 'price');
          if (variants.some((v) => v.stock < 0 || !Number.isInteger(v.stock))) fail('VALIDATION', 'Stock invalide.', 'stock');
          if (db.products.some((p) => p.slug === product.slug && p.id !== product.id)) fail('VALIDATION', 'Cette valeur existe déjà (par exemple une adresse URL identique).', 'slug');
          const id = product.id ?? uuid();
          const prev = db.products.find((p) => p.id === id);
          if (product.id && !prev) fail('NOT_FOUND');
          const saved: ProductWithRelations = {
            ...product,
            id,
            created_at: prev?.created_at ?? now(),
            updated_at: now(),
            published_at: prev?.published_at ?? (product.status === 'published' ? now() : null),
            variants: variants.map((v, position) => ({ ...v, id: v.id ?? uuid(), product_id: id, position })),
            images: images.map((im, position) => ({ ...im, id: im.id ?? uuid(), product_id: id, position })),
          };
          if (prev) db.products[db.products.indexOf(prev)] = saved;
          else db.products.unshift(saved);
          return structuredClone(saved);
        });
      },
      async deleteProduct(id) {
        requireAdmin();
        mutate((db) => {
          db.products = db.products.filter((p) => p.id !== id);
          db.collections.forEach((c) => { c.product_ids = c.product_ids.filter((x) => x !== id); });
          db.items.forEach((i) => { if (i.product_id === id) { i.product_id = null; i.variant_id = null; } });
        });
      },
      async setProductStatus(id, status) {
        requireAdmin();
        mutate((db) => {
          const p = db.products.find((x) => x.id === id);
          if (p) { p.status = status; p.updated_at = now(); if (status === 'published' && !p.published_at) p.published_at = now(); }
        });
      },
      async updateVariantStock(variantId, stock) {
        requireAdmin();
        if (stock < 0 || !Number.isInteger(stock)) fail('VALIDATION', 'Stock invalide.', 'stock');
        mutate((db) => {
          for (const p of db.products) for (const v of p.variants) if (v.id === variantId) v.stock = stock;
        });
      },
      async uploadImage(file, thumb, meta) {
        requireAdmin();
        // En démo, l'image est conservée en data URL dans le navigateur (limité en taille).
        const toDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(b); });
        return { url: await toDataUrl(file), thumb_url: thumb ? await toDataUrl(thumb) : null, storage_path: null, width: meta.width, height: meta.height };
      },
      async deleteImageFile() { /* rien à supprimer en démo */ },

      async listCategories() { requireAdmin(); return structuredClone(load().categories).sort((a, b) => a.sort_order - b.sort_order); },
      async saveCategory(c) {
        requireAdmin();
        return mutate((db) => {
          if (db.categories.some((x) => x.slug === c.slug && x.id !== c.id)) fail('VALIDATION', 'Cette adresse (URL) est déjà utilisée.', 'slug');
          const row = { ...c, id: c.id ?? uuid() } as Category;
          const i = db.categories.findIndex((x) => x.id === row.id);
          if (i >= 0) db.categories[i] = row; else db.categories.push(row);
          return structuredClone(row);
        });
      },
      async deleteCategory(id) {
        requireAdmin();
        mutate((db) => {
          db.categories = db.categories.filter((c) => c.id !== id);
          db.products.forEach((p) => { if (p.category_id === id) p.category_id = null; });
        });
      },

      async listCollections() { requireAdmin(); return structuredClone(load().collections); },
      async saveCollection(c) {
        requireAdmin();
        return mutate((db) => {
          if (db.collections.some((x) => x.slug === c.slug && x.id !== c.id)) fail('VALIDATION', 'Cette adresse (URL) est déjà utilisée.', 'slug');
          const row = { ...c, id: c.id ?? uuid() } as Collection;
          const i = db.collections.findIndex((x) => x.id === row.id);
          if (i >= 0) db.collections[i] = row; else db.collections.push(row);
          return structuredClone(row);
        });
      },
      async deleteCollection(id) { requireAdmin(); mutate((db) => { db.collections = db.collections.filter((c) => c.id !== id); }); },

      async listPromotions() { requireAdmin(); return structuredClone(load().promotions); },
      async savePromotion(p) {
        requireAdmin();
        if (p.percent_off < 1 || p.percent_off > 90) fail('VALIDATION', 'La remise doit être comprise entre 1 et 90 %.', 'percent_off');
        return mutate((db) => {
          const row = { ...p, id: p.id ?? uuid() } as Promotion;
          const i = db.promotions.findIndex((x) => x.id === row.id);
          if (i >= 0) db.promotions[i] = row; else db.promotions.unshift(row);
          return structuredClone(row);
        });
      },
      async deletePromotion(id) { requireAdmin(); mutate((db) => { db.promotions = db.promotions.filter((p) => p.id !== id); }); },

      async listZones() { requireAdmin(); return structuredClone(load().zones).sort((a, b) => a.sort_order - b.sort_order); },
      async saveZone(z) {
        requireAdmin();
        if (z.fee < 0) fail('VALIDATION', 'Frais invalides.', 'fee');
        return mutate((db) => {
          const row = { ...z, id: z.id ?? uuid() } as DeliveryZone;
          const i = db.zones.findIndex((x) => x.id === row.id);
          if (i >= 0) db.zones[i] = row; else db.zones.push(row);
          return structuredClone(row);
        });
      },
      async deleteZone(id) { requireAdmin(); mutate((db) => { db.zones = db.zones.filter((z) => z.id !== id); }); },

      async getSettings() { requireAdmin(); return structuredClone(load().settings); },
      async saveSettings(s) { requireAdmin(); await delay(); mutate((db) => { db.settings = structuredClone(s); }); },

      async listPages() { requireAdmin(); return structuredClone(load().pages); },
      async savePage(p) {
        requireAdmin();
        mutate((db) => {
          const i = db.pages.findIndex((x) => x.slug === p.slug);
          const row = { ...p, updated_at: now() };
          if (i >= 0) db.pages[i] = row; else db.pages.push(row);
        });
      },

      async listOrders(f) {
        requireAdmin();
        await delay(80);
        const s = f.search?.trim().toLowerCase() ?? '';
        const digits = s.replace(/\D/g, '');
        return structuredClone(load().orders)
          .filter((o) => f.include_test || !o.is_test)
          .filter((o) => !f.status || (f.status === 'open' ? !['completed', 'cancelled'].includes(o.status) : o.status === f.status))
          .filter((o) => !f.payment_status || o.payment_status === f.payment_status)
          .filter((o) => !f.delivery_status || o.delivery_status === f.delivery_status)
          .filter((o) => !s || o.reference.toLowerCase().includes(s) || o.customer_name.toLowerCase().includes(s) || (digits.length >= 4 && o.customer_phone.includes(digits)))
          .slice(0, f.limit ?? 200)
          .map(({ idempotency_key: _k, access_token: _t, stock_released: _s, ...o }) => o);
      },
      async getOrder(id) {
        requireAdmin();
        const db = load();
        const o = db.orders.find((x) => x.id === id);
        if (!o) return null;
        const { idempotency_key: _k, access_token: _t, stock_released: _s, ...rest } = structuredClone(o);
        return { ...rest, items: structuredClone(db.items.filter((i) => i.order_id === id)), events: structuredClone(db.events.filter((e) => e.order_id === id)) } as OrderWithItems;
      },
      async updateOrder(id, u) {
        requireAdmin();
        await delay();
        mutate((db) => {
          const o = db.orders.find((x) => x.id === id);
          if (!o) fail('NOT_FOUND');
          const ev = (kind: string, from: string | null, to: string | null, note: string | null = null) =>
            db.events.push({ id: db.events.length + 1, order_id: id, kind, from_value: from, to_value: to, note, created_at: now() });
          if (u.status && u.status !== o.status) {
            if (o.status === 'cancelled') fail('VALIDATION', 'Une commande annulée ne peut pas être réactivée. Créez une nouvelle commande.', 'status');
            if (u.status === 'cancelled' && !o.stock_released) {
              for (const it of db.items.filter((i) => i.order_id === id)) {
                for (const p of db.products) for (const v of p.variants) if (v.id === it.variant_id) v.stock += it.quantity;
              }
              o.stock_released = true;
              ev('stock_released', null, null, 'Articles remis en stock');
            }
            ev('status', o.status, u.status);
            o.status = u.status;
          }
          if (u.payment_status && u.payment_status !== o.payment_status) {
            ev('payment', o.payment_status, u.payment_status);
            o.payment_status = u.payment_status;
            if (u.payment_status === 'paid' && !o.paid_at) o.paid_at = now();
          }
          if (u.delivery_status && u.delivery_status !== o.delivery_status) {
            ev('delivery', o.delivery_status, u.delivery_status);
            o.delivery_status = u.delivery_status;
          }
          if (u.payment_reference !== undefined) o.payment_reference = u.payment_reference.trim() || null;
          if (u.note?.trim()) ev('note', null, null, u.note.trim().slice(0, 1000));
          o.updated_at = now();
        });
      },
      async setOrderFlags(id, flags) {
        requireAdmin();
        mutate((db) => {
          const o = db.orders.find((x) => x.id === id);
          if (!o) return;
          if (flags.is_test !== undefined) o.is_test = flags.is_test;
          if (flags.admin_note !== undefined) o.admin_note = flags.admin_note;
        });
      },

      async dashboard(days): Promise<DashboardStats> {
        requireAdmin();
        await delay(80);
        const db = load();
        const since = Date.now() - days * 86400000;
        const real = db.orders.filter((o) => !o.is_test);
        const period = real.filter((o) => Date.parse(o.created_at) >= since);
        const active = period.filter((o) => o.status !== 'cancelled');
        const paid = active.filter((o) => o.payment_status === 'paid');
        const pop = new Map<string, { product_id: string | null; name: string; quantity: number; amount: number }>();
        for (const it of db.items) {
          if (!active.some((o) => o.id === it.order_id)) continue;
          const k = it.product_id ?? it.product_name;
          const e = pop.get(k) ?? { product_id: it.product_id, name: it.product_name, quantity: 0, amount: 0 };
          e.quantity += it.quantity; e.amount += it.line_total;
          pop.set(k, e);
        }
        const daily = new Map<string, { day: string; orders: number; paid_revenue: number }>();
        for (const o of active) {
          const day = o.created_at.slice(0, 10);
          const e = daily.get(day) ?? { day, orders: 0, paid_revenue: 0 };
          e.orders++; if (o.payment_status === 'paid') e.paid_revenue += o.total;
          daily.set(day, e);
        }
        return {
          period_days: days,
          orders_received: period.length,
          orders_cancelled: period.filter((o) => o.status === 'cancelled').length,
          confirmed_sales: paid.length,
          revenue: paid.reduce((s, o) => s + o.total, 0),
          pending_value: active.filter((o) => o.payment_status === 'pending').reduce((s, o) => s + o.total, 0),
          awaiting_action: real.filter((o) => !['completed', 'cancelled'].includes(o.status) && (o.status === 'new' || o.payment_status === 'pending')).length,
          total_real_orders: real.length,
          popular_products: [...pop.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
          low_stock: db.products.filter((p) => p.status === 'published').flatMap((p) => p.variants.filter((v) => v.is_active && v.stock <= db.settings.low_stock_threshold).map((v) => ({
            variant_id: v.id, product_id: p.id, name: p.name, is_demo: p.is_demo, variant: [v.option1, v.option2].filter(Boolean).join(' · ') || null, stock: v.stock,
          }))).sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name)).slice(0, 20),
          daily: [...daily.values()].sort((a, b) => a.day.localeCompare(b.day)),
        };
      },

      async listMessages() { requireAdmin(); return structuredClone(load().messages); },
      async setMessageHandled(id, handled) { requireAdmin(); mutate((db) => { const m = db.messages.find((x) => x.id === id); if (m) m.is_handled = handled; }); },
      async deleteMessage(id) { requireAdmin(); mutate((db) => { db.messages = db.messages.filter((m) => m.id !== id); }); },
      async listSubscribers() { requireAdmin(); return structuredClone(load().subscribers); },
      async deleteSubscriber(id) { requireAdmin(); mutate((db) => { db.subscribers = db.subscribers.filter((s) => s.id !== id); }); },

      async removeDemoContent() {
        requireAdmin();
        return mutate((db) => {
          const ids = new Set(db.products.filter((p) => p.is_demo).map((p) => p.id));
          const n = ids.size;
          db.products = db.products.filter((p) => !p.is_demo);
          const nc = db.collections.filter((c) => c.is_demo).length;
          db.collections = db.collections.filter((c) => !c.is_demo);
          db.items.forEach((i) => { if (i.product_id && ids.has(i.product_id)) { i.product_id = null; i.variant_id = null; } });
          return { products: n, collections: nc };
        });
      },
    },
  };
  return backend;
}

/** Réinitialise les données de démonstration (bouton dans l'administration démo). */
export function resetDemoData() {
  memoryDb = null;
  try { storage()?.removeItem(KEY); } catch { /* ignore */ }
}
