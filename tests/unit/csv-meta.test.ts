import { describe, expect, it } from 'vitest';
import { demoCategories, demoProducts } from '../../src/data/demo/catalog';
import { CSV_TEMPLATE, parseProductCsv, productsToCsv } from '../../src/lib/csv';
import { buildSitemap, injectMeta } from '../../netlify/edge-functions/lib/meta';

describe('Import CSV', () => {
  it('lit le modèle fourni', () => {
    const r = parseProductCsv(CSV_TEMPLATE, demoCategories, []);
    expect(r.issues).toEqual([]);
    expect(r.products).toHaveLength(2);
    const robe = r.products.find((p) => p.product.slug === 'robe-priere-satin')!;
    expect(robe.variants.map((v) => v.option2)).toEqual(['Noir', 'Beige']);
    expect(robe.product.status).toBe('published');
    expect(robe.images).toHaveLength(2);
    expect(r.products[1].product.status).toBe('draft');
  });
  it('signale les erreurs ligne par ligne', () => {
    const csv = 'nom;prix;categorie;stock\nArticle A;12 000;parfums;3\nArticle B;douze;parfums;1\nArticle C;5000;inconnue;1\nArticle D;5000;;-2';
    const r = parseProductCsv(csv, demoCategories, []);
    expect(r.products.map((p) => p.product.name)).toEqual(['Article A']);
    expect(r.products[0].product.price).toBe(12000);
    expect(r.issues.map((i) => i.line)).toEqual([3, 4, 5]);
  });
  it('met à jour un produit existant au lieu de le dupliquer', () => {
    const existing = demoProducts.slice(0, 3);
    const csv = productsToCsv(existing, demoCategories);
    const r = parseProductCsv(csv, demoCategories, existing);
    expect(r.issues).toEqual([]);
    expect(r.products.every((p) => p.isUpdate)).toBe(true);
    expect(r.products[0].variants.every((v) => v.id)).toBe(true);
    expect(r.products[0].product.id).toBe(existing[0].id);
  });
});

describe('Métadonnées de partage et sitemap', () => {
  it('injecte titre, description et image Open Graph', () => {
    const html = '<html><head><title>X</title><meta name="description" content="old" /><meta property="og:title" content="old" /></head><body></body></html>';
    const out = injectMeta(html, { title: 'Robe « Lilas » <b>', description: 'Belle robe', url: 'https://b.sn/produit/robe', image: 'https://b.sn/a.webp', type: 'product', price: 12000 });
    expect(out).toContain('<title>Robe « Lilas » &lt;b&gt;</title>');
    expect(out).toContain('og:image" content="https://b.sn/a.webp"');
    expect(out).toContain('product:price:currency" content="XOF"');
    expect(out).not.toContain('content="old"');
  });
  it('génère un sitemap valide', () => {
    const xml = buildSitemap('https://b.sn/', [{ path: '/' }, { path: '/produit/a&b', lastmod: '2026-11-01T00:00:00Z' }]);
    expect(xml).toContain('<loc>https://b.sn/produit/a&amp;b</loc><lastmod>2026-11-01</lastmod>');
  });
});

import { createHmac } from 'node:crypto';
import { parseWaveEvent, verifyWaveSignature } from '../../netlify/functions/lib/wave';

describe('Intégration Wave (webhook)', () => {
  const secret = 'whsec_test';
  const body = JSON.stringify({ type: 'checkout.session.completed', data: { id: 'cos_1', amount: '4500', currency: 'XOF', client_reference: 'BY-261108-ABCD', payment_status: 'succeeded', transaction_id: 'T1' } });
  const t = 1_800_000_000;
  const sig = createHmac('sha256', secret).update(`${t}${body}`).digest('hex');
  it('accepte une signature valide et récente', () => {
    expect(verifyWaveSignature(`t=${t},v1=${sig}`, body, secret, t + 10)).toBe(true);
  });
  it('refuse une signature fausse, absente ou trop ancienne', () => {
    expect(verifyWaveSignature(`t=${t},v1=${'0'.repeat(64)}`, body, secret, t)).toBe(false);
    expect(verifyWaveSignature(null, body, secret, t)).toBe(false);
    expect(verifyWaveSignature(`t=${t},v1=${sig}`, body, secret, t + 3600)).toBe(false);
    expect(verifyWaveSignature(`t=${t},v1=${sig}`, body + ' ', secret, t)).toBe(false);
  });
  it('n’extrait que les paiements réussis', () => {
    expect(parseWaveEvent(JSON.parse(body))).toEqual({ reference: 'BY-261108-ABCD', amount: 4500, currency: 'XOF', providerRef: 'T1' });
    expect(parseWaveEvent({ type: 'checkout.session.completed', data: { payment_status: 'processing' } })).toBeNull();
  });
});
