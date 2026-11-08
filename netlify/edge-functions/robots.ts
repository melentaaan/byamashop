import type { Config } from '@netlify/edge-functions';

export default (request: Request) => {
  const origin = Netlify.env.get('VITE_SITE_URL') || new URL(request.url).origin;
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /panier', 'Disallow: /commande', 'Disallow: /favoris', '', `Sitemap: ${origin.replace(/\/$/, '')}/sitemap.xml`, ''].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};

export const config: Config = { path: '/robots.txt' };
