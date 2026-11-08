import type { Config, Context } from '@netlify/edge-functions';
import { injectMeta, supabaseGet } from './lib/meta.ts';
import { demoProducts } from '../../src/data/demo/catalog.ts';

interface Row { name: string; short_description: string; seo_title: string | null; seo_description: string | null; price: number; product_images: { url: string; position: number }[] }

export default async (request: Request, context: Context) => {
  const response = await context.next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const url = new URL(request.url);
  const slug = decodeURIComponent(url.pathname.split('/')[2] ?? '');
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return response;
  try {
    const sbUrl = Netlify.env.get('VITE_SUPABASE_URL');
    const sbKey = Netlify.env.get('VITE_SUPABASE_ANON_KEY');
    let p: Row | undefined;
    if (sbUrl && sbKey) {
      const rows = await supabaseGet<Row[]>(sbUrl, sbKey, `products?select=name,short_description,seo_title,seo_description,price,product_images(url,position)&slug=eq.${slug}&status=eq.published&limit=1`);
      p = rows[0];
    } else {
      const d = demoProducts.find((x) => x.slug === slug);
      if (d) p = { ...d, product_images: d.images };
    }
    if (!p) return response;
    const img = [...p.product_images].sort((a, b) => a.position - b.position)[0]?.url;
    const image = img && !img.endsWith('.svg') && !img.startsWith('data:') ? new URL(img, url.origin).href : `${url.origin}/og-image.png`;
    const html = injectMeta(await response.text(), {
      title: `${p.seo_title || p.name} — Byamashop`,
      description: p.seo_description || p.short_description || p.name,
      url: `${url.origin}/produit/${slug}`,
      image,
      type: 'product',
      price: p.price,
    });
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(html, { status: response.status, headers });
  } catch (e) {
    console.error('product-meta', e);
    return response;
  }
};

export const config: Config = { path: '/produit/*' };
