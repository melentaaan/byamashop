import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { Catalog } from '../backend/types';
import { Icon, WhatsAppIcon } from '../components/Icon';
import { FavoriteButton, Price, ProductCard } from '../components/ProductCard';
import { NoPhoto, ProductImg } from '../components/ProductImage';
import { QtyInput } from '../components/QtyInput';
import { Seo, absoluteUrl } from '../components/Seo';
import { useModal, useUi } from '../components/ui';
import { productFromPrice, productPrice, useCatalog, useCart } from '../hooks/useCatalog';
import { cart } from '../lib/cart';
import { formatFCFA } from '../lib/format';
import { PAYMENT_METHOD_LABELS } from '../lib/labels';
import type { PaymentMethod, ProductImage, ProductVariant, ProductWithRelations } from '../lib/types';
import { waLink } from '../lib/whatsapp';
import NotFound, { ErrorState, PageLoader } from './states';

function ZoomDialog({ images, index, onClose }: { images: ProductImage[]; index: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(index);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  useModal(true, onClose, ref);
  const img = images[i];
  const move = (d: number) => { setZoomed(false); setI((x) => (x + d + images.length) % images.length); };
  return (
    <>
      <div className="backdrop backdrop--dark" onClick={onClose} />
      <div className="zoom" role="dialog" aria-modal="true" aria-label="Agrandissement de la photo" ref={ref} tabIndex={-1}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') move(1); if (e.key === 'ArrowLeft') move(-1); }}>
        <button className="icon-btn zoom-close" onClick={onClose} aria-label="Fermer l’agrandissement"><Icon name="x" /></button>
        <div
          className={`zoom-stage ${zoomed ? 'is-zoomed' : ''}`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
            setZoomed((z) => !z);
          }}
          onMouseMove={(e) => { if (!zoomed) return; const r = e.currentTarget.getBoundingClientRect(); setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); }}
        >
          <img src={img.url} alt={img.alt} style={{ transformOrigin: origin }} />
        </div>
        <p className="zoom-hint">{zoomed ? 'Touchez à nouveau pour dézoomer' : 'Touchez l’image pour zoomer'}</p>
        {images.length > 1 && (
          <>
            <button className="icon-btn zoom-nav zoom-prev" onClick={() => move(-1)} aria-label="Photo précédente"><Icon name="chevron-left" /></button>
            <button className="icon-btn zoom-nav zoom-next" onClick={() => move(1)} aria-label="Photo suivante"><Icon name="chevron-right" /></button>
            <p className="zoom-count">{i + 1} / {images.length}</p>
          </>
        )}
      </div>
    </>
  );
}

function Gallery({ product }: { product: ProductWithRelations }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const images = product.images;
  useEffect(() => { setActive(0); track.current?.scrollTo({ left: 0 }); }, [product.id]);
  if (!images.length) return <div className="gallery"><NoPhoto className="gallery-nophoto" /></div>;
  const goTo = (i: number) => {
    setActive(i);
    const el = track.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' });
  };
  return (
    <div className="gallery">
      <div className="gallery-main">
        <div className="gallery-track" ref={track} onScroll={(e) => { const el = e.currentTarget; setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }}>
          {images.map((img, i) => (
            <button key={img.id} type="button" className="gallery-slide" onClick={() => setZoom(i)} aria-label={`Agrandir la photo ${i + 1} sur ${images.length}`}>
              <ProductImg image={img} eager={i === 0} sizes="(min-width: 960px) 50vw, 100vw" />
            </button>
          ))}
        </div>
        <span className="gallery-zoom-hint" aria-hidden="true"><Icon name="zoom" size={18} /></span>
        {images.length > 1 && (
          <div className="gallery-dots" aria-hidden="true">
            {images.map((img, i) => <span key={img.id} className={i === active ? 'is-active' : ''} />)}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs" role="group" aria-label="Choisir une photo">
          {images.map((img, i) => (
            <button key={img.id} type="button" className={i === active ? 'is-active' : ''} aria-pressed={i === active} onClick={() => goTo(i)} aria-label={`Photo ${i + 1}`}>
              <img src={img.thumb_url ?? img.url} alt="" width={120} height={150} loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {zoom !== null && <ZoomDialog images={images} index={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}

function pickDefault(p: ProductWithRelations): ProductVariant | null {
  const active = p.variants.filter((v) => v.is_active);
  return active.find((v) => v.stock > 0) ?? active[0] ?? null;
}

function stockMessage(v: ProductVariant | null, threshold: number) {
  if (!v || v.stock <= 0) return { tone: 'out', text: 'Épuisé dans cette option' };
  if (v.stock <= threshold) return { tone: 'low', text: `Plus que ${v.stock} en stock` };
  return { tone: 'ok', text: 'En stock' };
}

function Related({ catalog, product }: { catalog: Catalog; product: ProductWithRelations }) {
  const list = useMemo(() => {
    const same = catalog.products.filter((p) => p.id !== product.id && p.category_id === product.category_id);
    const others = catalog.products.filter((p) => p.id !== product.id && p.category_id !== product.category_id && p.is_featured);
    return [...same, ...others].slice(0, 4);
  }, [catalog, product]);
  if (!list.length) return null;
  return (
    <section className="section section--tint" aria-labelledby="related-title">
      <div className="container">
        <div className="section-head"><div><p className="eyebrow">À découvrir aussi</p><h2 id="related-title">Vous aimerez aussi</h2></div></div>
        <div className="product-grid product-grid--scroll-mobile">{list.map((p) => <ProductCard key={p.id} product={p} catalog={catalog} />)}</div>
      </div>
    </section>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const { data: catalog, isLoading, error, refetch } = useCatalog();
  const product = catalog?.products.find((p) => p.slug === slug);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error2, setError2] = useState('');
  const { toast, openCart } = useUi();
  const { lines } = useCart();
  const buyRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => { if (product) { setVariantId(pickDefault(product)?.id ?? null); setQty(1); setError2(''); } }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = buyRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [product?.id]);

  if (error) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading || !catalog) return <PageLoader />;
  if (!product) return <NotFound />;

  const s = catalog.settings;
  const active = product.variants.filter((v) => v.is_active);
  const variant = active.find((v) => v.id === variantId) ?? null;
  const price = variant ? productPrice(catalog, product, variant) : productFromPrice(catalog, product);
  const category = catalog.categories.find((c) => c.id === product.category_id);
  const opt1 = [...new Set(active.map((v) => v.option1).filter((x): x is string => !!x))];
  const opt2 = [...new Map(active.filter((v) => v.option2).map((v) => [v.option2 as string, v.color_hex])).entries()];
  const inCart = lines.find((l) => l.variantId === variant?.id)?.quantity ?? 0;
  const maxQty = Math.max(0, Math.min(99, (variant?.stock ?? 0) - inCart));
  const stock = stockMessage(variant, s.low_stock_threshold);

  const findVariant = (o1: string | null, o2: string | null) => active.find((v) => (v.option1 ?? null) === o1 && (v.option2 ?? null) === o2);
  const select = (o1: string | null, o2: string | null, changed: 1 | 2) => {
    let v = findVariant(o1, o2);
    if (!v) v = active.find((x) => (changed === 1 ? x.option1 === o1 : x.option2 === o2) && x.stock > 0) ?? active.find((x) => (changed === 1 ? x.option1 === o1 : x.option2 === o2));
    if (v) { setVariantId(v.id); setQty(1); setError2(''); }
  };
  const optAvailable = (o1: string | null, o2: string | null) => {
    const v = findVariant(o1, o2);
    return !!v && v.stock > 0;
  };

  const add = () => {
    if (!variant) return setError2('Choisissez une option.');
    if (variant.stock <= 0) return setError2('Cette option est épuisée.');
    if (maxQty <= 0) return setError2('Vous avez déjà tout le stock disponible dans votre panier.');
    cart.add(product.id, variant.id, Math.min(qty, maxQty), variant.stock);
    toast('Ajouté au panier', { action: { label: 'Voir le panier', to: '/panier' } });
    openCart();
  };

  const paymentNames = (Object.keys(s.payments) as PaymentMethod[]).filter((k) => s.payments[k].enabled).map((k) => PAYMENT_METHOD_LABELS[k]);
  const description = product.seo_description || product.short_description || product.description.slice(0, 160);
  const anyStock = active.some((v) => v.stock > 0);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || product.short_description,
      image: product.images.filter((i) => !i.url.startsWith('data:')).map((i) => absoluteUrl(i.url)),
      sku: variant?.sku ?? product.id,
      category: category?.name,
      brand: { '@type': 'Brand', name: s.business_name },
      itemCondition: product.condition_note ? 'https://schema.org/UsedCondition' : 'https://schema.org/NewCondition',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'XOF',
        lowPrice: productFromPrice(catalog, product).price,
        highPrice: Math.max(...active.map((v) => productPrice(catalog, product, v).price)),
        offerCount: active.length,
        availability: anyStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: absoluteUrl(`/produit/${product.slug}`),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: absoluteUrl('/') },
        ...(category ? [{ '@type': 'ListItem', position: 2, name: category.name, item: absoluteUrl(`/categorie/${category.slug}`) }] : []),
        { '@type': 'ListItem', position: category ? 3 : 2, name: product.name, item: absoluteUrl(`/produit/${product.slug}`) },
      ],
    },
  ];

  return (
    <>
      <Seo title={product.seo_title || product.name} description={description} path={`/produit/${product.slug}`} image={product.images[0]?.url} type="product" jsonLd={jsonLd} />
      <div className="container">
        <nav className="breadcrumbs" aria-label="Fil d’Ariane">
          <ol>
            <li><Link to="/">Accueil</Link></li>
            {category && <li><Link to={`/categorie/${category.slug}`}>{category.name}</Link></li>}
            <li><span aria-current="page">{product.name}</span></li>
          </ol>
        </nav>
        <div className="pdp">
          <Gallery product={product} />
          <div className="pdp-info">
            {category && <Link to={`/categorie/${category.slug}`} className="eyebrow eyebrow--plain pdp-cat">{category.name}</Link>}
            <div className="pdp-title-row">
              <h1 className="pdp-title">{product.name}</h1>
              <FavoriteButton product={product} className="pdp-fav" />
            </div>
            <div className="pdp-price" data-testid="pdp-price">
              <Price price={price.price} compareAt={price.compareAt} from={!variant && 'varies' in price && Boolean(price.varies)} />
              {price.percentOff > 0 && <span className="badge badge--sale">−{price.percentOff} %</span>}
            </div>
            {product.short_description && <p className="pdp-short">{product.short_description}</p>}
            {product.condition_note && (
              <p className="pdp-condition"><Icon name="info" size={18} /> <span><strong>Article de seconde main.</strong> État : {product.condition_note}</span></p>
            )}
            {product.is_demo && (
              <p className="pdp-demo"><span className="badge badge--demo">Démonstration</span> Produit d’exemple : nom, prix et visuels illustratifs.</p>
            )}

            {opt1.length > 0 && (
              <fieldset className="option-group">
                <legend>{product.option1_name} : <strong>{variant?.option1 ?? '—'}</strong></legend>
                <div className="option-buttons">
                  {opt1.map((o) => {
                    const available = opt2.length ? active.some((v) => v.option1 === o && v.stock > 0) : optAvailable(o, null);
                    return (
                      <button key={o} type="button" className={`size-btn ${available ? '' : 'is-out'}`} aria-pressed={variant?.option1 === o}
                        onClick={() => select(o, variant?.option2 ?? null, 1)} aria-label={`${o}${available ? '' : ' (épuisé)'}`}>
                        {o}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
            {opt2.length > 0 && (
              <fieldset className="option-group">
                <legend>{product.option2_name} : <strong>{variant?.option2 ?? '—'}</strong></legend>
                <div className="option-buttons">
                  {opt2.map(([name, hex]) => {
                    const available = optAvailable(variant?.option1 ?? (opt1.length ? opt1[0] : null), name);
                    return (
                      <button key={name} type="button" className={`swatch ${available ? '' : 'is-out'}`} aria-pressed={variant?.option2 === name}
                        onClick={() => select(variant?.option1 ?? null, name, 2)} aria-label={`${name}${available ? '' : ' (épuisé)'}`} title={name}>
                        <span style={{ background: hex ?? '#ddd' }} />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <p className={`stock-note stock-note--${stock.tone}`} data-testid="stock-note"><span className="dot" /> {stock.text}</p>

            <div className="pdp-buy" ref={buyRef}>
              {variant && variant.stock > 0 ? (
                <>
                  <QtyInput value={Math.min(qty, Math.max(1, maxQty))} max={Math.max(1, maxQty)} onChange={setQty} />
                  <button type="button" className="btn btn--primary btn--lg pdp-add" onClick={add} disabled={maxQty <= 0} data-testid="add-to-cart">
                    <Icon name="bag" size={20} /> Ajouter au panier
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn--secondary btn--lg btn--block" disabled>Épuisé</button>
              )}
            </div>
            {inCart > 0 && <p className="small muted">Déjà {inCart} dans votre panier.</p>}
            {error2 && <p className="field-error" role="alert">{error2}</p>}
            {s.whatsapp && (
              <a className="btn btn--whatsapp btn--block" target="_blank" rel="noopener noreferrer"
                href={waLink(s.whatsapp, `Bonjour Byamashop, j’ai une question sur « ${product.name} »${variant?.option1 || variant?.option2 ? ` (${[variant.option1, variant.option2].filter(Boolean).join(', ')})` : ''} : ${absoluteUrl(`/produit/${product.slug}`)}`)}>
                <WhatsAppIcon /> Poser une question sur WhatsApp
              </a>
            )}

            <div className="accordion pdp-accordion">
              <details open>
                <summary>Description</summary>
                <div className="acc-body">{product.description.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
              </details>
              {product.details && (
                <details>
                  <summary>Détails & entretien</summary>
                  <div className="acc-body"><ul className="detail-list">{product.details.split('\n').filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}</ul></div>
                </details>
              )}
              <details>
                <summary>Livraison</summary>
                <div className="acc-body">
                  <ul className="zone-mini">
                    {catalog.zones.map((z) => (
                      <li key={z.id}><span>{z.name}{z.estimate ? <small> · {z.estimate}</small> : null}</span><strong>{z.fee ? formatFCFA(z.fee) : 'Gratuit'}</strong></li>
                    ))}
                  </ul>
                  <p><Link to="/livraison" className="text-link">Toutes les informations de livraison</Link></p>
                </div>
              </details>
              <details>
                <summary>Paiement & retours</summary>
                <div className="acc-body">
                  <p>Moyens de paiement : {paymentNames.join(', ')}. Le paiement est confirmé par notre équipe ; vous recevez une référence de commande.</p>
                  <p>{s.returns_summary} <Link to="/retours-et-remboursements" className="text-link">Voir la politique de retour</Link></p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
      <Related catalog={catalog} product={product} />

      {showSticky && variant && variant.stock > 0 && (
        <div className="sticky-buy" aria-hidden="false">
          <div>
            <strong>{product.name}</strong>
            <span>{formatFCFA(price.price)}</span>
          </div>
          <button type="button" className="btn btn--primary" onClick={add} disabled={maxQty <= 0}>Ajouter</button>
        </div>
      )}
    </>
  );
}
