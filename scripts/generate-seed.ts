/**
 * Génère supabase/seed.sql à partir du catalogue de démonstration (src/data/demo)
 * et des modèles de pages légales (content/legal). Usage : npm run seed:generate
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { demoCategories, demoCollections, demoProducts } from '../src/data/demo/catalog';
import { defaultSettings, defaultZones } from '../src/data/demo/settings';

const q = (v: unknown): string => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return `array[${v.map(q).join(', ')}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
const row = (vals: unknown[]) => `(${vals.map(q).join(', ')})`;

const out: string[] = [];
out.push('-- Généré par scripts/generate-seed.ts — ne pas modifier à la main.');
out.push('-- Contenu de DÉMONSTRATION (is_demo = true) : supprimable depuis l’administration.');
out.push('begin;');

out.push(`insert into public.store_settings (id, data) values (1, ${q(JSON.stringify(defaultSettings))}::jsonb)
  on conflict (id) do update set data = excluded.data;`);

out.push('insert into public.delivery_zones (id, name, description, fee, free_from, estimate, is_pickup, is_active, sort_order) values');
out.push(defaultZones.map((z) => row([z.id, z.name, z.description, z.fee, z.free_from, z.estimate, z.is_pickup, z.is_active, z.sort_order])).join(',\n') + '\non conflict (id) do nothing;');

out.push('insert into public.categories (id, slug, name, description, image_url, sort_order, is_published) values');
out.push(demoCategories.map((c) => row([c.id, c.slug, c.name, c.description, c.image_url, c.sort_order, c.is_published])).join(',\n') + '\non conflict (id) do nothing;');

out.push(`insert into public.products (id, slug, name, category_id, short_description, description, details, price, compare_at_price,
  status, is_featured, is_new, condition_note, tags, option1_name, option2_name, sort_order, is_demo, published_at, created_at) values`);
out.push(demoProducts.map((p) => row([p.id, p.slug, p.name, p.category_id, p.short_description, p.description, p.details, p.price,
  p.compare_at_price, p.status, p.is_featured, p.is_new, p.condition_note, p.tags, p.option1_name, p.option2_name, p.sort_order,
  p.is_demo, p.published_at, p.created_at])).join(',\n') + '\non conflict (id) do nothing;');

out.push('insert into public.product_variants (id, product_id, sku, option1, option2, color_hex, price_override, stock, is_active, position) values');
out.push(demoProducts.flatMap((p) => p.variants.map((v) => row([v.id, v.product_id, v.sku, v.option1, v.option2, v.color_hex, v.price_override, v.stock, v.is_active, v.position]))).join(',\n') + '\non conflict (id) do nothing;');

out.push('insert into public.product_images (id, product_id, url, thumb_url, alt, width, height, position) values');
out.push(demoProducts.flatMap((p) => p.images.map((i) => row([i.id, i.product_id, i.url, i.thumb_url, i.alt, i.width, i.height, i.position]))).join(',\n') + '\non conflict (id) do nothing;');

out.push('insert into public.collections (id, slug, name, description, image_url, is_featured, is_published, sort_order, is_demo) values');
out.push(demoCollections.map((c) => row([c.id, c.slug, c.name, c.description, c.image_url, c.is_featured, c.is_published, c.sort_order, c.is_demo])).join(',\n') + '\non conflict (id) do nothing;');
out.push('insert into public.collection_products (collection_id, product_id, position) values');
out.push(demoCollections.flatMap((c) => c.product_ids.map((pid, i) => row([c.id, pid, i]))).join(',\n') + '\non conflict do nothing;');

const legalDir = join(import.meta.dirname, '..', 'content', 'legal');
const pages = readdirSync(legalDir).filter((f) => f.endsWith('.md')).sort();
out.push('insert into public.pages (slug, title, body, is_published) values');
out.push(pages.map((f) => {
  const body = readFileSync(join(legalDir, f), 'utf8');
  const title = /^# (.+)$/m.exec(body)?.[1] ?? f;
  return row([f.replace(/\.md$/, ''), title, body, true]);
}).join(',\n') + '\non conflict (slug) do nothing;');

out.push('commit;');
const target = join(import.meta.dirname, '..', 'supabase', 'seed.sql');
writeFileSync(target, out.join('\n\n') + '\n');
console.log(`seed.sql généré : ${demoProducts.length} produits, ${demoCategories.length} catégories, ${pages.length} pages.`);
