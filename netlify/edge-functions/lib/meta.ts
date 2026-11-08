/**
 * Logique pure (testée) des fonctions Edge : métadonnées de partage et sitemap.
 * Les aperçus WhatsApp / Facebook n'exécutent pas JavaScript : on injecte donc
 * titre, description et image directement dans le HTML des pages produit.
 */
export interface MetaInput { title: string; description: string; url: string; image?: string | null; type?: 'product' | 'website'; price?: number | null }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function injectMeta(html: string, m: MetaInput): string {
  const title = esc(m.title);
  const desc = esc(m.description.slice(0, 300));
  const tags = [
    `<meta name="description" content="${desc}" />`,
    `<link rel="canonical" href="${esc(m.url)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${esc(m.url)}" />`,
    `<meta property="og:type" content="${m.type ?? 'website'}" />`,
    m.image ? `<meta property="og:image" content="${esc(m.image)}" />` : '',
    m.price != null ? `<meta property="product:price:amount" content="${m.price}" /><meta property="product:price:currency" content="XOF" />` : '',
  ].filter(Boolean).join('\n    ');
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace(/\s*<meta property="og:(title|description|image|type|url)"[^>]*>/g, '')
    .replace('</head>', `    ${tags}\n  </head>`);
}

export interface SitemapEntry { path: string; lastmod?: string | null }

export function buildSitemap(base: string, entries: SitemapEntry[]): string {
  const b = base.replace(/\/$/, '');
  const urls = entries.map((e) => `  <url><loc>${esc(b + e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export const STATIC_PATHS = ['/', '/boutique', '/a-propos', '/contact', '/revendeurs', '/livraison', '/retours-et-remboursements', '/conditions-generales-de-vente', '/confidentialite', '/mentions-legales'];

/** Lecture publique via l'API REST Supabase (clé anon, données publiées uniquement grâce au RLS). */
export async function supabaseGet<T>(url: string, key: string, path: string): Promise<T> {
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return (await res.json()) as T;
}
