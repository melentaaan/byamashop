import type { Catalog } from '../backend/types';
import type { ProductWithRelations } from './types';
import { normalizeText } from './format';
import { priceFor } from './pricing';

/** Recherche plein texte côté navigateur, insensible aux accents et à la casse. */
export function searchProducts(catalog: Catalog, query: string): ProductWithRelations[] {
  const terms = normalizeText(query).split(' ').filter((t) => t.length > 1);
  if (!terms.length) return catalog.products;
  const catName = new Map(catalog.categories.map((c) => [c.id, normalizeText(c.name)]));
  const scored: { p: ProductWithRelations; score: number }[] = [];
  for (const p of catalog.products) {
    const name = normalizeText(p.name);
    const cat = catName.get(p.category_id ?? '') ?? '';
    const tags = normalizeText(p.tags.join(' '));
    const opts = normalizeText(p.variants.map((v) => `${v.option1 ?? ''} ${v.option2 ?? ''}`).join(' '));
    const body = normalizeText(`${p.short_description} ${p.description}`);
    let score = 0;
    let all = true;
    for (const t of terms) {
      const stem = t.length > 4 ? t.replace(/s$/, '') : t;
      let s = 0;
      if (name.split(' ').some((w) => w.startsWith(stem))) s += 10;
      else if (name.includes(stem)) s += 6;
      if (cat.includes(stem)) s += 5;
      if (tags.includes(stem)) s += 4;
      if (opts.includes(stem)) s += 2;
      if (body.includes(stem)) s += 1;
      if (s === 0) all = false;
      score += s;
    }
    if (all && score > 0) scored.push({ p, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((x) => x.p);
}

export type SortKey = 'pertinence' | 'nouveautes' | 'prix-croissant' | 'prix-decroissant' | 'nom';
export const SORT_LABELS: Record<SortKey, string> = {
  pertinence: 'Recommandés',
  nouveautes: 'Nouveautés',
  'prix-croissant': 'Prix croissant',
  'prix-decroissant': 'Prix décroissant',
  nom: 'Nom (A → Z)',
};

export interface CatalogFilters {
  q?: string;
  category?: string; // slug
  collection?: string; // slug
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  sizes?: string[];
  colors?: string[];
  sort?: SortKey;
}

function minPrice(catalog: Catalog, p: ProductWithRelations) {
  const vs = p.variants.filter((v) => v.is_active);
  return Math.min(...(vs.length ? vs : [null]).map((v) => priceFor(p, v, catalog.promotions, catalog.collections).price));
}

export function filterProducts(catalog: Catalog, f: CatalogFilters): ProductWithRelations[] {
  let list = f.q ? searchProducts(catalog, f.q) : [...catalog.products];
  if (f.category) {
    const c = catalog.categories.find((x) => x.slug === f.category);
    list = list.filter((p) => c && p.category_id === c.id);
  }
  if (f.collection) {
    const col = catalog.collections.find((x) => x.slug === f.collection);
    const ids = col?.product_ids ?? [];
    list = list.filter((p) => ids.includes(p.id));
    if (!f.q && (!f.sort || f.sort === 'pertinence')) list.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  }
  if (f.inStock) list = list.filter((p) => p.variants.some((v) => v.is_active && v.stock > 0));
  if (f.onSale) list = list.filter((p) => p.variants.some((v) => priceFor(p, v, catalog.promotions, catalog.collections).compareAt));
  if (f.sizes?.length) list = list.filter((p) => p.variants.some((v) => v.is_active && v.option1 && f.sizes!.includes(v.option1)));
  if (f.colors?.length) list = list.filter((p) => p.variants.some((v) => v.is_active && v.option2 && f.colors!.includes(v.option2)));
  if (f.minPrice != null || f.maxPrice != null) {
    list = list.filter((p) => {
      const m = minPrice(catalog, p);
      return (f.minPrice == null || m >= f.minPrice) && (f.maxPrice == null || m <= f.maxPrice);
    });
  }
  switch (f.sort) {
    case 'prix-croissant': list.sort((a, b) => minPrice(catalog, a) - minPrice(catalog, b)); break;
    case 'prix-decroissant': list.sort((a, b) => minPrice(catalog, b) - minPrice(catalog, a)); break;
    case 'nom': list.sort((a, b) => a.name.localeCompare(b.name, 'fr')); break;
    case 'nouveautes': list.sort((a, b) => Number(b.is_new) - Number(a.is_new) || (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at)); break;
    default:
      if (!f.q && !f.collection) {
        // en stock d'abord, puis mis en avant, puis ordre défini par la boutique
        const avail = (p: ProductWithRelations) => (p.variants.some((v) => v.is_active && v.stock > 0) ? 0 : 1);
        list.sort((a, b) => avail(a) - avail(b) || Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order);
      }
  }
  return list;
}

/** Valeurs de filtres disponibles pour une liste de produits. */
export function facetValues(products: ProductWithRelations[]) {
  const sizes = new Map<string, number>();
  const colors = new Map<string, string | null>();
  for (const p of products) {
    for (const v of p.variants) {
      if (!v.is_active) continue;
      if (v.option1 && p.option1_name === 'Taille') sizes.set(v.option1, (sizes.get(v.option1) ?? 0) + 1);
      if (v.option2) colors.set(v.option2, v.color_hex);
    }
  }
  const sizeOrder = ['XS', 'S', 'S/M', 'M', 'L', 'L/XL', 'XL', 'XXL', 'Taille unique'];
  const sortSize = (a: string, b: string) => {
    const ia = sizeOrder.indexOf(a), ib = sizeOrder.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    const na = parseFloat(a), nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b, 'fr');
  };
  return {
    sizes: [...sizes.keys()].sort(sortSize),
    colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  };
}
