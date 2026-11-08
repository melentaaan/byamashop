import Papa from 'papaparse';
import type { ProductInput } from '../backend/types';
import { normalizeText, slugify } from './format';
import type { Category, ProductWithRelations } from './types';

/**
 * Format CSV d'import / export des produits (une ligne par variante).
 * Les lignes ayant le même « slug » forment un seul produit.
 */
export const CSV_COLUMNS = [
  'slug', 'nom', 'categorie', 'prix', 'prix_barre', 'description_courte', 'description', 'details',
  'statut', 'nouveaute', 'mis_en_avant', 'etat_seconde_main', 'etiquettes',
  'option1_nom', 'option1', 'option2_nom', 'option2', 'couleur_hex', 'prix_variante', 'stock', 'sku', 'images',
] as const;

export const CSV_TEMPLATE = [
  CSV_COLUMNS.join(';'),
  'robe-priere-satin;Robe de prière satin;robes-de-priere;15000;;Voile long et jupe ample;Description complète du produit.;Entretien : lavage à 30 °C;en_ligne;oui;non;;prière|satin;Taille;Taille unique;Couleur;Noir;#1F1A24;;5;RP-SAT-N;https://exemple.com/photo1.jpg|https://exemple.com/photo2.jpg',
  'robe-priere-satin;;;;;;;;;;;;;Taille;Taille unique;Couleur;Beige;#D8C7A8;;3;RP-SAT-B;',
  'huile-argan-50ml;Huile d’argan 50 ml;produits-du-maroc;5000;;Flacon compte-gouttes;;;brouillon;non;non;;;;;;;;;12;;',
].join('\r\n');

export interface CsvIssue { line: number; message: string }
export interface CsvParseResult { products: (ProductInput & { line: number; isUpdate: boolean })[]; issues: CsvIssue[] }

const yes = (v: string | undefined) => /^(oui|yes|1|true|vrai|x)$/i.test((v ?? '').trim());
const int = (v: string | undefined): number | null => {
  const s = (v ?? '').replace(/[\s  ]/g, '').replace(/fcfa|cfa|xof/i, '');
  if (!s) return null;
  return /^\d+$/.test(s) ? Number(s) : NaN;
};

export function parseProductCsv(text: string, categories: Category[], existing: ProductWithRelations[]): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => normalizeText(h).replace(/ /g, '_'),
  });
  const issues: CsvIssue[] = parsed.errors.slice(0, 20).map((e) => ({ line: (e.row ?? 0) + 2, message: `Format CSV : ${e.message}` }));
  const missing = ['nom', 'prix'].filter((c) => !parsed.meta.fields?.includes(c));
  if (missing.length) return { products: [], issues: [{ line: 1, message: `Colonnes obligatoires manquantes : ${missing.join(', ')}` }] };

  const groups = new Map<string, { line: number; rows: Record<string, string>[] }>();
  parsed.data.forEach((row, i) => {
    const slug = (row.slug?.trim() ? slugify(row.slug) : slugify(row.nom ?? '')) || `ligne-${i + 2}`;
    const g = groups.get(slug) ?? { line: i + 2, rows: [] };
    g.rows.push(row);
    groups.set(slug, g);
  });

  const products: CsvParseResult['products'] = [];
  for (const [slug, { line, rows }] of groups) {
    const first = rows[0];
    const prev = existing.find((p) => p.slug === slug);
    const err = (m: string) => issues.push({ line, message: `${first.nom || slug} : ${m}` });
    const name = (first.nom ?? '').trim() || prev?.name || '';
    if (name.length < 2) { err('le nom est obligatoire.'); continue; }
    const price = int(first.prix) ?? prev?.price ?? null;
    if (price == null || Number.isNaN(price)) { err('prix invalide (nombre entier en FCFA, sans décimales).'); continue; }
    const compare = int(first.prix_barre);
    if (Number.isNaN(compare)) { err('prix barré invalide.'); continue; }
    const catKey = normalizeText(first.categorie ?? '');
    const category = catKey ? categories.find((c) => c.slug === slugify(first.categorie) || normalizeText(c.name) === catKey) : undefined;
    if (catKey && !category) { err(`catégorie « ${first.categorie} » inconnue — créez-la d’abord.`); continue; }
    const statusRaw = normalizeText(first.statut ?? '');
    const status = !statusRaw ? (prev?.status ?? 'draft') : /ligne|publi/.test(statusRaw) ? 'published' : /archiv/.test(statusRaw) ? 'archived' : 'draft';

    const variants: ProductInput['variants'] = [];
    let bad = false;
    rows.forEach((r, idx) => {
      const stock = int(r.stock) ?? 0;
      const vp = int(r.prix_variante);
      if (Number.isNaN(stock) || Number.isNaN(vp)) { issues.push({ line: line + idx, message: `${name} : stock ou prix de variante invalide.` }); bad = true; return; }
      const hex = (r.couleur_hex ?? '').trim();
      if (hex && !/^#[0-9a-f]{6}$/i.test(hex)) { issues.push({ line: line + idx, message: `${name} : couleur_hex doit ressembler à #A1B2C3.` }); bad = true; return; }
      const option1 = (r.option1 ?? '').trim() || null;
      const option2 = (r.option2 ?? '').trim() || null;
      const match = prev?.variants.find((v) => (v.option1 ?? null) === option1 && (v.option2 ?? null) === option2);
      variants.push({
        id: match?.id, sku: (r.sku ?? '').trim() || null, option1, option2, color_hex: hex || null,
        price_override: vp && vp !== price ? vp : null, stock, is_active: true, position: idx,
      });
    });
    if (bad) continue;
    const imageUrls = (first.images ?? '').split('|').map((u) => u.trim()).filter((u) => /^https?:\/\//.test(u) || u.startsWith('/'));
    const images: ProductInput['images'] = imageUrls.length
      ? imageUrls.map((url, i) => ({ url, thumb_url: null, alt: name, width: null, height: null, position: i }))
      : (prev?.images ?? []).map(({ id, url, thumb_url, alt, width, height, position, storage_path }) => ({ id, url, thumb_url, alt, width, height, position, storage_path }));

    products.push({
      line,
      isUpdate: !!prev,
      product: {
        id: prev?.id,
        slug,
        name,
        category_id: category?.id ?? prev?.category_id ?? null,
        short_description: (first.description_courte ?? '').trim() || prev?.short_description || '',
        description: (first.description ?? '').trim() || prev?.description || '',
        details: (first.details ?? '').trim() || prev?.details || '',
        price,
        compare_at_price: compare && compare > price ? compare : null,
        status,
        is_featured: first.mis_en_avant ? yes(first.mis_en_avant) : prev?.is_featured ?? false,
        is_new: first.nouveaute ? yes(first.nouveaute) : prev?.is_new ?? false,
        condition_note: (first.etat_seconde_main ?? '').trim() || null,
        tags: (first.etiquettes ?? '').split(/[|,]/).map((t) => t.trim()).filter(Boolean),
        option1_name: (first.option1_nom ?? '').trim() || prev?.option1_name || 'Taille',
        option2_name: (first.option2_nom ?? '').trim() || prev?.option2_name || 'Couleur',
        seo_title: prev?.seo_title ?? null,
        seo_description: prev?.seo_description ?? null,
        sort_order: prev?.sort_order ?? 0,
        is_demo: false,
      },
      variants,
      images,
    });
  }
  return { products, issues };
}

export function productsToCsv(products: ProductWithRelations[], categories: Category[]): string {
  const rows: Record<string, string | number>[] = [];
  for (const p of products) {
    const cat = categories.find((c) => c.id === p.category_id)?.slug ?? '';
    p.variants.forEach((v, i) => {
      const head = i === 0;
      rows.push({
        slug: p.slug, nom: head ? p.name : '', categorie: head ? cat : '', prix: head ? p.price : '',
        prix_barre: head ? p.compare_at_price ?? '' : '', description_courte: head ? p.short_description : '',
        description: head ? p.description : '', details: head ? p.details : '',
        statut: head ? ({ published: 'en_ligne', draft: 'brouillon', archived: 'archive' } as const)[p.status] : '',
        nouveaute: head ? (p.is_new ? 'oui' : 'non') : '', mis_en_avant: head ? (p.is_featured ? 'oui' : 'non') : '',
        etat_seconde_main: head ? p.condition_note ?? '' : '', etiquettes: head ? p.tags.join('|') : '',
        option1_nom: p.option1_name, option1: v.option1 ?? '', option2_nom: p.option2_name, option2: v.option2 ?? '',
        couleur_hex: v.color_hex ?? '', prix_variante: v.price_override ?? '', stock: v.stock, sku: v.sku ?? '',
        images: head ? p.images.filter((im) => !im.url.startsWith('data:')).map((im) => im.url).join('|') : '',
      });
    });
  }
  return Papa.unparse({ fields: [...CSV_COLUMNS], data: rows.map((r) => CSV_COLUMNS.map((c) => r[c] ?? '')) }, { delimiter: ';' });
}
