import { config } from '../lib/config';

interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: object | object[];
}

export const SITE_NAME = 'Byamashop';

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const base = config.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return base + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl);
}

/** Métadonnées de page (React 19 les place automatiquement dans <head>). */
export function Seo({ title, description, path, image, type = 'website', noindex, jsonLd }: SeoProps) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Robes & tapis de prière, parfums, mode et produits du Maroc`;
  const url = path !== undefined ? absoluteUrl(path) : undefined;
  const img = absoluteUrl(image && !image.startsWith('data:') && !image.endsWith('.svg') ? image : '/og-image.png');
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {url && <link rel="canonical" href={url} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </>
  );
}
