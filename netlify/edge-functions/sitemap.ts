import type { Config } from '@netlify/edge-functions';
import { buildSitemap, STATIC_PATHS, supabaseGet, type SitemapEntry } from './lib/meta.ts';
import { demoCategories, demoProducts } from '../../src/data/demo/catalog.ts';

export default async (request: Request) => {
  const origin = Netlify.env.get('VITE_SITE_URL') || new URL(request.url).origin;
  const entries: SitemapEntry[] = STATIC_PATHS.map((path) => ({ path }));
  try {
    const sbUrl = Netlify.env.get('VITE_SUPABASE_URL');
    const sbKey = Netlify.env.get('VITE_SUPABASE_ANON_KEY');
    if (sbUrl && sbKey) {
      const cats = await supabaseGet<{ slug: string; updated_at: string }[]>(sbUrl, sbKey, 'categories?select=slug,updated_at&is_published=eq.true');
      const prods = await supabaseGet<{ slug: string; updated_at: string }[]>(sbUrl, sbKey, 'products?select=slug,updated_at&status=eq.published');
      entries.push(...cats.map((c) => ({ path: `/categorie/${c.slug}`, lastmod: c.updated_at })), ...prods.map((p) => ({ path: `/produit/${p.slug}`, lastmod: p.updated_at })));
    } else {
      entries.push(...demoCategories.map((c) => ({ path: `/categorie/${c.slug}` })), ...demoProducts.map((p) => ({ path: `/produit/${p.slug}`, lastmod: p.updated_at })));
    }
  } catch (e) {
    console.error('sitemap', e);
  }
  return new Response(buildSitemap(origin, entries), { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};

export const config: Config = { path: '/sitemap.xml' };
