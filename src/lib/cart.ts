import { createPersistentStore } from './store';

export interface CartLine {
  variantId: string;
  productId: string;
  quantity: number;
}

export const MAX_QTY = 99;

function sanitize(v: unknown): CartLine[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((l): l is CartLine => !!l && typeof l === 'object' && typeof (l as CartLine).variantId === 'string' && typeof (l as CartLine).productId === 'string')
    .map((l) => ({ variantId: l.variantId, productId: l.productId, quantity: Math.min(MAX_QTY, Math.max(1, Math.floor(Number(l.quantity) || 1))) }));
}

export const cartStore = createPersistentStore<CartLine[]>('byamashop_cart_v2', [], sanitize);

export const cart = {
  add(productId: string, variantId: string, quantity: number, maxStock?: number) {
    cartStore.set((lines) => {
      const existing = lines.find((l) => l.variantId === variantId);
      const cap = Math.min(MAX_QTY, maxStock ?? MAX_QTY);
      if (existing) {
        return lines.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(cap, l.quantity + quantity) } : l));
      }
      return [...lines, { productId, variantId, quantity: Math.min(cap, Math.max(1, quantity)) }];
    });
  },
  setQuantity(variantId: string, quantity: number) {
    cartStore.set((lines) =>
      quantity < 1 ? lines.filter((l) => l.variantId !== variantId) : lines.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY, Math.floor(quantity)) } : l)),
    );
  },
  remove(variantId: string) {
    cartStore.set((lines) => lines.filter((l) => l.variantId !== variantId));
  },
  clear() {
    cartStore.set([]);
  },
};

export const favoritesStore = createPersistentStore<string[]>('byamashop_favorites', [], (v) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [],
);

export function toggleFavorite(productId: string) {
  favoritesStore.set((ids) => (ids.includes(productId) ? ids.filter((x) => x !== productId) : [...ids, productId]));
}
