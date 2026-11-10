import type { Config } from '@netlify/edge-functions';

/** Même règle que src/lib/config.ts : sans Supabase configuré, le site tourne en démonstration. */
function isDemoDeployment(): boolean {
  return (
    Netlify.env.get('VITE_DEMO_MODE') === 'true' ||
    !Netlify.env.get('VITE_SUPABASE_URL') ||
    !Netlify.env.get('VITE_SUPABASE_ANON_KEY')
  );
}

export default (request: Request) => {
  const headers = { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' };
  // Une démonstration (produits fictifs) ne doit pas être indexée ni concurrencer le vrai site.
  if (isDemoDeployment()) return new Response('User-agent: *\nDisallow: /\n', { headers });
  const origin = Netlify.env.get('VITE_SITE_URL') || new URL(request.url).origin;
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /panier', 'Disallow: /commande', 'Disallow: /favoris', '', `Sitemap: ${origin.replace(/\/$/, '')}/sitemap.xml`, ''].join('\n');
  return new Response(body, { headers });
};

export const config: Config = { path: '/robots.txt' };
