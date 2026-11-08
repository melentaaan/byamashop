import { readJSON, writeJSON } from './storage';

/** Références des commandes passées depuis cet appareil (pour retrouver le lien de suivi). */
export interface LocalOrderRef { reference: string; token: string; total: number; created_at: string }
const KEY = 'byamashop_my_orders';

export function rememberOrder(o: LocalOrderRef) {
  const list = readJSON<LocalOrderRef[]>(KEY, []).filter((x) => x.reference !== o.reference);
  writeJSON(KEY, [o, ...list].slice(0, 10));
}
export function myOrders(): LocalOrderRef[] {
  const v = readJSON<unknown>(KEY, []);
  return Array.isArray(v) ? (v as LocalOrderRef[]).filter((x) => x && typeof x.reference === 'string') : [];
}

/** Clé d'idempotence : identique tant que le contenu du panier ne change pas. */
export function idempotencyKeyFor(signature: string): string {
  const k = 'byamashop_checkout_key';
  try {
    const raw = sessionStorage.getItem(k);
    if (raw) {
      const saved = JSON.parse(raw) as { sig: string; key: string };
      if (saved.sig === signature) return saved.key;
    }
    const key = crypto.randomUUID();
    sessionStorage.setItem(k, JSON.stringify({ sig: signature, key }));
    return key;
  } catch {
    return crypto.randomUUID();
  }
}
export function clearIdempotencyKey() {
  try { sessionStorage.removeItem('byamashop_checkout_key'); } catch { /* ignore */ }
}
