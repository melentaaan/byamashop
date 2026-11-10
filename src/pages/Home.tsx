import { Link } from 'react-router';
import type { Catalog } from '../backend/types';
import { Icon, WhatsAppIcon } from '../components/Icon';
import { ProductGridSkeleton } from '../components/ProductCard';
import { ProductRail } from '../components/ProductRail';
import { Reveal } from '../components/Reveal';
import { RichTitle, plainTitle } from '../components/RichTitle';
import { Seo, absoluteUrl } from '../components/Seo';
import { NewsletterForm } from '../components/NewsletterForm';
import { useCatalog } from '../hooks/useCatalog';
import { formatFCFA } from '../lib/format';
import { PAYMENT_METHOD_LABELS } from '../lib/labels';
import type { PaymentMethod } from '../lib/types';
import { waLink } from '../lib/whatsapp';
import { ErrorState } from './states';

function enabledPayments(c: Catalog) {
  return (Object.keys(c.settings.payments) as PaymentMethod[]).filter((k) => c.settings.payments[k].enabled);
}

function Hero({ c }: { c: Catalog }) {
  const h = c.settings.hero;
  const methods = enabledPayments(c);
  const featured = c.products.find((p) => p.is_featured && p.variants.some((v) => v.stock > 0));
  return (
    <section className="hero hero--enter">
      <div className="container hero-grid">
        <div className="hero-copy">
          {h.eyebrow && <p className="eyebrow">{h.eyebrow}</p>}
          <h1 className="hero-title"><RichTitle text={h.title} /></h1>
          {h.subtitle && <p className="lead">{h.subtitle}</p>}
          <div className="hero-ctas">
            <Link to={h.cta_href || '/boutique'} className="btn btn--primary btn--lg">{h.cta_label || 'Découvrir la boutique'} <Icon name="arrow-right" size={18} /></Link>
            <Link to="/categorie/robes-de-priere" className="btn btn--secondary btn--lg">Robes de prière</Link>
          </div>
          <ul className="hero-facts">
            <li><Icon name="truck" /> <span>Livraison {c.zones.some((z) => !z.is_pickup) ? 'à Dakar et dans les régions' : 'selon zones'}</span></li>
            {methods.length > 0 && <li><Icon name="wallet" /> <span>{methods.map((m) => PAYMENT_METHOD_LABELS[m]).join(' · ')}</span></li>}
          </ul>
        </div>
        <div className="hero-media">
          <span className="hero-glow" aria-hidden="true" />
          <span className="sparkle sparkle--1" aria-hidden="true" />
          <span className="sparkle sparkle--2" aria-hidden="true" />
          <span className="sparkle sparkle--3" aria-hidden="true" />
          <div className="hero-arch">
            <img src={h.image_url || '/demo/editorial/hero.svg'} alt="" width={1200} height={1400} fetchPriority="high" />
          </div>
          {featured && (
            <Link to={`/produit/${featured.slug}`} className="hero-chip">
              <img src={featured.images[0]?.thumb_url ?? featured.images[0]?.url ?? '/brand/mark.svg'} alt="" width={56} height={70} />
              <span>
                <small>Coup de cœur</small>
                <strong>{featured.name}</strong>
              </span>
              <Icon name="arrow-right" size={18} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/** Bandeau défilant décoratif (les catégories elles-mêmes sont listées juste en dessous). */
function Marquee({ c }: { c: Catalog }) {
  const words = c.categories.map((x) => x.name);
  if (words.length < 3) return null;
  const run = (k: string) => (
    <span className="marquee-run" key={k}>
      {words.map((w) => <span key={w} className="marquee-item">{w}<span className="marquee-star">✦</span></span>)}
    </span>
  );
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{run('a')}{run('b')}</div>
    </div>
  );
}

function Categories({ c }: { c: Catalog }) {
  return (
    <section className="section section--tight" aria-labelledby="cats-title">
      <div className="container">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">Nos univers</p>
            <h2 id="cats-title">Parcourir par catégorie</h2>
          </div>
          <Link to="/boutique" className="link-arrow">Toute la boutique <Icon name="arrow-right" /></Link>
        </Reveal>
        <ul className="category-rail">
          {c.categories.map((cat, i) => {
            const n = c.products.filter((p) => p.category_id === cat.id).length;
            return (
              <Reveal as="li" key={cat.id} delay={(i % 4) * 70}>
                <Link to={`/categorie/${cat.slug}`} className="category-card">
                  <span className="category-media">
                    {cat.image_url ? <img src={cat.image_url} alt="" width={800} height={1000} loading="lazy" /> : <img src="/brand/mark.svg" alt="" />}
                  </span>
                  <span className="category-name">{cat.name}</span>
                  <span className="category-count">{n} article{n > 1 ? 's' : ''}</span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ProductRow({ c, title, eyebrow, products, link, id, tint }: { c: Catalog; title: string; eyebrow: string; products: Catalog['products']; link: { to: string; label: string }; id: string; tint?: boolean }) {
  if (!products.length) return null;
  return (
    <section className={`section ${tint ? 'section--tint' : ''}`} aria-labelledby={id}>
      <div className="container">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id={id}>{title}</h2>
          </div>
          <Link to={link.to} className="link-arrow">{link.label} <Icon name="arrow-right" /></Link>
        </Reveal>
        <Reveal><ProductRail products={products} catalog={c} label={title} /></Reveal>
      </div>
    </section>
  );
}

function Collections({ c }: { c: Catalog }) {
  const cols = c.collections.filter((x) => x.is_featured && x.product_ids.length);
  if (!cols.length) return null;
  return (
    <section className="section" aria-labelledby="col-title">
      <div className="container">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">Sélections</p>
            <h2 id="col-title">Nos collections du moment</h2>
          </div>
        </Reveal>
        <div className="collection-grid">
          {cols.slice(0, 3).map((col, i) => (
            <Reveal key={col.id} className={`collection-cell ${i === 0 ? 'collection-cell--lead' : ''}`} delay={i * 90}>
            <Link to={`/collections/${col.slug}`} className={`collection-card ${i === 0 ? 'collection-card--lead' : ''}`}>
              <img src={col.image_url ?? '/demo/editorial/story.svg'} alt="" width={800} height={1000} loading="lazy" />
              <span className="collection-copy">
                <span className="collection-count">{col.product_ids.length} articles</span>
                <span className="collection-name">{col.name}</span>
                <span className="collection-desc">{col.description}</span>
                <span className="link-arrow on-dark">Découvrir <Icon name="arrow-right" /></span>
              </span>
            </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Banners({ c }: { c: Catalog }) {
  const banners = c.settings.banners.filter((b) => b.enabled && b.title);
  if (!banners.length) return null;
  return (
    <>
      {banners.map((b) => (
        <section key={b.id} className="promo-band" aria-label={b.title}>
          <div className="container">
            <Reveal className="promo-inner">
              {b.image_url && <img className="promo-img" src={b.image_url} alt="" width={1600} height={900} loading="lazy" />}
              <div className="promo-copy">
                {b.eyebrow && <p className="eyebrow">{b.eyebrow}</p>}
                <h2>{b.title}</h2>
                {b.text && <p>{b.text}</p>}
                {b.cta_href && <Link to={b.cta_href} className="btn btn--primary">{b.cta_label || 'Découvrir'} <Icon name="arrow-right" size={18} /></Link>}
              </div>
            </Reveal>
          </div>
        </section>
      ))}
    </>
  );
}

function Story({ c }: { c: Catalog }) {
  const paragraphs = c.settings.about.split(/\n\n+/).filter(Boolean);
  return (
    <section className="section section--blush" aria-labelledby="story-title">
      <div className="container story">
        <Reveal className="story-media">
          <img src="/demo/editorial/story.svg" alt="" width={800} height={1000} loading="lazy" />
        </Reveal>
        <Reveal className="story-copy" delay={120}>
          <p className="eyebrow">Notre maison</p>
          <h2 id="story-title">Une boutique sénégalaise, <em className="accent-italic">pensée pour vous</em></h2>
          {paragraphs.slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
          <Link to="/a-propos" className="link-arrow">Lire notre histoire <Icon name="arrow-right" /></Link>
        </Reveal>
      </div>
    </section>
  );
}

function ServiceStrip({ c }: { c: Catalog }) {
  const delivery = c.zones.filter((z) => !z.is_pickup && z.fee > 0);
  const minFee = delivery.length ? Math.min(...delivery.map((z) => z.fee)) : null;
  const pickup = c.zones.some((z) => z.is_pickup);
  const methods = enabledPayments(c);
  return (
    <section className="section section--tight" aria-label="Livraison, paiement et assistance">
      <div className="container service-grid">
        <Reveal className="service" delay={0}>
          <span className="service-icon"><Icon name="truck" /></span>
          <h3>Livraison au Sénégal</h3>
          <p>{minFee != null ? <>À partir de {formatFCFA(minFee)} selon votre zone</> : 'Selon votre zone'}{pickup ? ', ou retrait sur place' : ''}. Les frais s’affichent avant validation.</p>
          <Link to="/livraison" className="text-link">Zones et tarifs</Link>
        </Reveal>
        <Reveal className="service" delay={90}>
          <span className="service-icon"><Icon name="wallet" /></span>
          <h3>Paiement simple</h3>
          <p>{methods.map((m) => PAYMENT_METHOD_LABELS[m]).join(', ')}. Votre paiement est confirmé par notre équipe, sans frais cachés.</p>
        </Reveal>
        <Reveal className="service" delay={180}>
          <span className="service-icon"><Icon name="chat" /></span>
          <h3>Un conseil ?</h3>
          <p>Taille, couleur, disponibilité : écrivez-nous, nous vous répondons personnellement.</p>
          {c.settings.whatsapp && <a className="text-link" href={waLink(c.settings.whatsapp, 'Bonjour Byamashop, j’ai une question.')} target="_blank" rel="noopener noreferrer">Écrire sur WhatsApp</a>}
        </Reveal>
      </div>
    </section>
  );
}

function Wholesale({ c }: { c: Catalog }) {
  const w = c.settings.wholesale;
  if (!w.enabled) return null;
  return (
    <section className="wholesale-band" aria-labelledby="ws-title">
      <Reveal className="container wholesale-inner">
        <img src="/demo/editorial/wholesale.svg" alt="" width={1600} height={900} loading="lazy" className="wholesale-img" />
        <div className="wholesale-copy">
          <p className="eyebrow eyebrow--light">Professionnels</p>
          <h2 id="ws-title">{w.title}</h2>
          <p>{w.text}</p>
          <div className="cluster">
            <Link to="/revendeurs" className="btn btn--light">Demander un devis</Link>
            {c.settings.whatsapp && (
              <a className="btn btn--ghost on-dark" href={waLink(c.settings.whatsapp, 'Bonjour Byamashop, je souhaite un devis pour une commande en gros.')} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function Home() {
  const { data: c, isLoading, error, refetch } = useCatalog();
  if (error) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading || !c) {
    return (
      <div className="container section"><div className="skeleton" style={{ height: 420 }} /><div style={{ height: 32 }} /><ProductGridSkeleton count={4} /></div>
    );
  }
  const featured = c.products.filter((p) => p.is_featured).slice(0, 8);
  const news = c.products.filter((p) => p.is_new).slice(0, 8);
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: c.settings.business_name,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/brand/logo.svg'),
    telephone: c.settings.phone || undefined,
    address: c.settings.address ? { '@type': 'PostalAddress', addressLocality: c.settings.address, addressCountry: 'SN' } : undefined,
    currenciesAccepted: 'XOF',
  };
  return (
    <>
      <Seo path="/" description={`${plainTitle(c.settings.hero.title)}. ${c.settings.hero.subtitle}`.slice(0, 300)} jsonLd={org} />
      <Hero c={c} />
      <Marquee c={c} />
      <Categories c={c} />
      <ProductRow c={c} id="sel-title" eyebrow="Notre sélection" title="Les pièces que nous aimons" products={featured} link={{ to: '/boutique', label: 'Tout voir' }} tint />
      <Collections c={c} />
      <Banners c={c} />
      <ProductRow c={c} id="new-title" eyebrow="Fraîchement arrivés" title="Nouveautés" products={news} link={{ to: '/boutique?tri=nouveautes', label: 'Toutes les nouveautés' }} />
      <ServiceStrip c={c} />
      <Story c={c} />
      <Wholesale c={c} />
      {c.settings.newsletter_enabled && (
        <section className="section section--tight newsletter-section" aria-labelledby="nl-title">
          <Reveal className="container--narrow newsletter-box">
            <p className="eyebrow">Newsletter</p>
            <h2 id="nl-title">Soyez la première informée</h2>
            <p className="muted">Arrivages, collections et offres : un e-mail de temps en temps, jamais plus.</p>
            <NewsletterForm />
          </Reveal>
        </section>
      )}
    </>
  );
}
