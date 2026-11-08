import { describe, expect, it } from 'vitest';
import { demoCategories, demoCollections, demoProducts } from '../../src/data/demo/catalog';
import { defaultSettings, defaultZones } from '../../src/data/demo/settings';
import { displayPhone, formatFCFA, normalizePhone, slugify } from '../../src/lib/format';
import { facetValues, filterProducts, searchProducts } from '../../src/lib/search';
import { fillPlaceholders, mergeSettings } from '../../src/lib/settings';
import type { Catalog } from '../../src/backend/types';

const catalog: Catalog = { categories: demoCategories, products: demoProducts, collections: demoCollections, promotions: [], zones: defaultZones, settings: defaultSettings };

describe('Formatage', () => {
  it('formate les montants en FCFA', () => {
    expect(formatFCFA(12500)).toBe('12 500 FCFA');
    expect(formatFCFA(0)).toBe('0 FCFA');
  });
  it('normalise les numéros sénégalais', () => {
    expect(normalizePhone('77 123 45 67')).toBe('+221771234567');
    expect(normalizePhone('+221 76-409-17-27')).toBe('+221764091727');
    expect(normalizePhone('12')).toBeNull();
    expect(displayPhone('+221771234567')).toBe('+221 77 123 45 67');
  });
  it('crée des adresses propres', () => {
    expect(slugify('Robe de prière « Lilas » !')).toBe('robe-de-priere-lilas');
  });
});

describe('Catalogue de démonstration', () => {
  it('contient 25 à 40 produits, tous marqués démo, avec photos et variantes', () => {
    expect(demoProducts.length).toBeGreaterThanOrEqual(25);
    expect(demoProducts.length).toBeLessThanOrEqual(40);
    for (const p of demoProducts) {
      expect(p.is_demo).toBe(true);
      expect(p.images.length).toBeGreaterThan(0);
      expect(p.variants.length).toBeGreaterThan(0);
      expect(demoCategories.some((c) => c.id === p.category_id)).toBe(true);
    }
    expect(new Set(demoProducts.map((p) => p.slug)).size).toBe(demoProducts.length);
    expect(new Set(demoProducts.flatMap((p) => p.variants.map((v) => v.id))).size).toBe(demoProducts.reduce((s, p) => s + p.variants.length, 0));
  });
  it('couvre toutes les catégories de la boutique', () => {
    for (const c of demoCategories) expect(demoProducts.some((p) => p.category_id === c.id)).toBe(true);
  });
});

describe('Recherche et filtres', () => {
  it('recherche sans tenir compte des accents', () => {
    expect(searchProducts(catalog, 'priere tapis')[0].slug).toMatch(/tapis-priere/);
    expect(searchProducts(catalog, 'ARGAN').map((p) => p.slug)).toContain('huile-argan-cosmetique');
    expect(searchProducts(catalog, 'zzzzzz')).toHaveLength(0);
  });
  it('filtre par catégorie, prix, taille, disponibilité', () => {
    const parfums = filterProducts(catalog, { category: 'parfums' });
    expect(parfums.length).toBeGreaterThan(0);
    expect(parfums.every((p) => p.category_id === demoCategories.find((c) => c.slug === 'parfums')!.id)).toBe(true);
    const cheap = filterProducts(catalog, { maxPrice: 5000 });
    expect(cheap.length).toBeGreaterThan(0);
    const sizeM = filterProducts(catalog, { sizes: ['M'] });
    expect(sizeM.every((p) => p.variants.some((v) => v.option1 === 'M'))).toBe(true);
    const inStock = filterProducts(catalog, { inStock: true });
    expect(inStock.find((p) => p.slug === 'mini-ventilateur-rechargeable')).toBeUndefined();
  });
  it('trie par prix', () => {
    const asc = filterProducts(catalog, { sort: 'prix-croissant' });
    const prices = asc.map((p) => Math.min(...p.variants.map((v) => v.price_override ?? p.price)));
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });
  it('propose les valeurs de filtres', () => {
    const f = facetValues(filterProducts(catalog, { category: 'friperie' }));
    expect(f.sizes).toEqual(expect.arrayContaining(['36', 'M']));
  });
});

describe('Réglages', () => {
  it('complète des réglages partiels avec les valeurs par défaut', () => {
    const s = mergeSettings({ business_name: 'Test', payments: { wave: { enabled: false } } });
    expect(s.business_name).toBe('Test');
    expect(s.payments.wave.enabled).toBe(false);
    expect(s.payments.wave.instructions).toBe(defaultSettings.payments.wave.instructions);
    expect(s.payments.orange_money.enabled).toBe(true);
  });
  it('remplit les pages légales sans inventer les informations manquantes', () => {
    const out = fillPlaceholders('{{nom_boutique}} — NINEA {{ninea}}', defaultSettings, 'https://x.sn');
    expect(out).toBe('Byamashop — NINEA [À COMPLÉTER : NINEA]');
  });
});
