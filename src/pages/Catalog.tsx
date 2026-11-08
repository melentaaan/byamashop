import { useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import type { Catalog as CatalogData } from '../backend/types';
import { Icon } from '../components/Icon';
import { ProductCard, ProductGridSkeleton } from '../components/ProductCard';
import { Seo } from '../components/Seo';
import { useModal } from '../components/ui';
import { useCatalog } from '../hooks/useCatalog';
import { formatFCFA } from '../lib/format';
import { facetValues, filterProducts, SORT_LABELS, type CatalogFilters, type SortKey } from '../lib/search';
import NotFound, { ErrorState } from './states';

const PAGE_SIZE = 24;
const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: 'Moins de 5 000', max: 4999 },
  { label: '5 000 – 10 000', min: 5000, max: 10000 },
  { label: '10 000 – 20 000', min: 10000, max: 20000 },
  { label: 'Plus de 20 000', min: 20000 },
];

function readFilters(sp: URLSearchParams): CatalogFilters {
  const num = (k: string) => { const v = sp.get(k); return v && /^\d+$/.test(v) ? Number(v) : undefined; };
  const list = (k: string) => sp.get(k)?.split(',').filter(Boolean) ?? [];
  const sort = sp.get('tri') as SortKey | null;
  return {
    q: sp.get('q') ?? undefined,
    minPrice: num('prix_min'),
    maxPrice: num('prix_max'),
    inStock: sp.get('dispo') === '1',
    onSale: sp.get('promo') === '1',
    sizes: list('taille'),
    colors: list('couleur'),
    sort: sort && sort in SORT_LABELS ? sort : 'pertinence',
  };
}

function FilterPanel({ catalog, base, filters, set }: { catalog: CatalogData; base: CatalogFilters; filters: CatalogFilters; set: (patch: Record<string, string | null>) => void }) {
  const facets = useMemo(() => facetValues(filterProducts(catalog, { category: base.category, collection: base.collection })), [catalog, base.category, base.collection]);
  const toggleList = (key: 'taille' | 'couleur', current: string[] = [], value: string) => {
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    set({ [key]: next.length ? next.join(',') : null });
  };
  return (
    <div className="filters">
      <fieldset className="filter-group">
        <legend>Disponibilité</legend>
        <label className="check"><input type="checkbox" checked={!!filters.inStock} onChange={(e) => set({ dispo: e.target.checked ? '1' : null })} /> En stock uniquement</label>
        <label className="check"><input type="checkbox" checked={!!filters.onSale} onChange={(e) => set({ promo: e.target.checked ? '1' : null })} /> En promotion</label>
      </fieldset>
      <fieldset className="filter-group">
        <legend>Prix (FCFA)</legend>
        <div className="chips chips--wrap">
          {PRICE_RANGES.map((r) => {
            const on = filters.minPrice === r.min && filters.maxPrice === r.max;
            return (
              <button key={r.label} type="button" className="chip" aria-pressed={on}
                onClick={() => set(on ? { prix_min: null, prix_max: null } : { prix_min: r.min != null ? String(r.min) : null, prix_max: r.max != null ? String(r.max) : null })}>
                {r.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      {facets.sizes.length > 0 && (
        <fieldset className="filter-group">
          <legend>Taille</legend>
          <div className="chips chips--wrap">
            {facets.sizes.map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={filters.sizes?.includes(s)} onClick={() => toggleList('taille', filters.sizes, s)}>{s}</button>
            ))}
          </div>
        </fieldset>
      )}
      {facets.colors.length > 0 && (
        <fieldset className="filter-group">
          <legend>Couleur</legend>
          <div className="chips chips--wrap">
            {facets.colors.map((c) => (
              <button key={c.name} type="button" className="chip" aria-pressed={filters.colors?.includes(c.name)} onClick={() => toggleList('couleur', filters.colors, c.name)}>
                <span className="swatch-dot" style={{ background: c.hex ?? '#ddd' }} aria-hidden="true" /> {c.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}

export default function Catalog({ kind }: { kind: 'all' | 'category' | 'collection' }) {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const { data: catalog, isLoading, error, refetch } = useCatalog();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  useModal(sheetOpen, () => setSheetOpen(false), sheetRef);

  const base: CatalogFilters = kind === 'category' ? { category: slug } : kind === 'collection' ? { collection: slug } : {};
  const filters = { ...base, ...readFilters(sp) };
  const page = Math.max(1, Number(sp.get('page')) || 1);

  const results = useMemo(() => (catalog ? filterProducts(catalog, filters) : []), [catalog, sp, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) { if (v == null || v === '') next.delete(k); else next.set(k, v); }
    if (!('page' in patch)) next.delete('page');
    setSp(next, { replace: true, preventScrollReset: true });
  };

  if (error) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading || !catalog) return <div className="container section"><ProductGridSkeleton /></div>;

  const category = kind === 'category' ? catalog.categories.find((c) => c.slug === slug) : undefined;
  const collection = kind === 'collection' ? catalog.collections.find((c) => c.slug === slug) : undefined;
  if ((kind === 'category' && !category) || (kind === 'collection' && !collection)) return <NotFound />;

  const title = category?.name ?? collection?.name ?? (filters.q ? `Résultats pour « ${filters.q} »` : 'La boutique');
  const description = category?.description ?? collection?.description ?? 'Toute la sélection Byamashop : robes et tapis de prière, parfums, friperie, ensembles, produits du Maroc et produits importés.';
  const path = kind === 'category' ? `/categorie/${slug}` : kind === 'collection' ? `/collections/${slug}` : '/boutique';
  const visible = results.slice(0, page * PAGE_SIZE);
  const activeCount = [filters.inStock, filters.onSale, filters.minPrice != null || filters.maxPrice != null].filter(Boolean).length + (filters.sizes?.length ?? 0) + (filters.colors?.length ?? 0);
  const clearAll = () => set({ dispo: null, promo: null, prix_min: null, prix_max: null, taille: null, couleur: null, q: null });

  return (
    <>
      <Seo title={title} description={description} path={path} noindex={!!filters.q} />
      <div className="catalog-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Fil d’Ariane">
            <ol>
              <li><Link to="/">Accueil</Link></li>
              {kind !== 'all' && <li><Link to="/boutique">Boutique</Link></li>}
              <li><span aria-current="page">{category?.name ?? collection?.name ?? 'Boutique'}</span></li>
            </ol>
          </nav>
          <h1>{title}</h1>
          <p className="lead">{description}</p>
        </div>
      </div>

      <div className="container catalog">
        <nav className="chips catalog-cats" aria-label="Catégories">
          <Link to="/boutique" className="chip" aria-current={kind === 'all' ? 'page' : undefined}>Tout</Link>
          {catalog.categories.map((c) => (
            <Link key={c.id} to={`/categorie/${c.slug}`} className="chip" aria-current={c.slug === slug && kind === 'category' ? 'page' : undefined}>{c.name}</Link>
          ))}
        </nav>

        <div className="catalog-toolbar">
          <button type="button" className="btn btn--secondary btn--sm show-tablet" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
            <Icon name="sliders" size={18} /> Filtrer {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
          </button>
          <p className="result-count" aria-live="polite" data-testid="result-count">{results.length} produit{results.length > 1 ? 's' : ''}</p>
          <label className="sort">
            <span className="sr-only">Trier par</span>
            <select className="select select--sm" value={filters.sort} onChange={(e) => set({ tri: e.target.value === 'pertinence' ? null : e.target.value })} aria-label="Trier par">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => <option key={k} value={k}>{SORT_LABELS[k]}</option>)}
            </select>
          </label>
        </div>

        {(activeCount > 0 || filters.q) && (
          <div className="active-filters" aria-label="Filtres actifs">
            {filters.q && <button className="chip" onClick={() => set({ q: null })}>« {filters.q} » <Icon name="x" className="x" /></button>}
            {filters.inStock && <button className="chip" onClick={() => set({ dispo: null })}>En stock <Icon name="x" className="x" /></button>}
            {filters.onSale && <button className="chip" onClick={() => set({ promo: null })}>En promotion <Icon name="x" className="x" /></button>}
            {(filters.minPrice != null || filters.maxPrice != null) && (
              <button className="chip" onClick={() => set({ prix_min: null, prix_max: null })}>
                {filters.minPrice != null ? formatFCFA(filters.minPrice) : '0'} – {filters.maxPrice != null ? formatFCFA(filters.maxPrice) : '∞'} <Icon name="x" className="x" />
              </button>
            )}
            {filters.sizes?.map((s) => <button key={s} className="chip" onClick={() => set({ taille: filters.sizes!.filter((x) => x !== s).join(',') || null })}>Taille {s} <Icon name="x" className="x" /></button>)}
            {filters.colors?.map((c) => <button key={c} className="chip" onClick={() => set({ couleur: filters.colors!.filter((x) => x !== c).join(',') || null })}>{c} <Icon name="x" className="x" /></button>)}
            <button className="btn btn--ghost btn--sm" onClick={clearAll}>Tout effacer</button>
          </div>
        )}

        <div className="catalog-body">
          <aside className="catalog-aside hide-tablet" aria-label="Filtres">
            <FilterPanel catalog={catalog} base={base} filters={filters} set={set} />
          </aside>
          <div>
            {results.length === 0 ? (
              <div className="empty-state" data-testid="empty-results">
                <span className="es-icon"><Icon name="search" /></span>
                <h2>Aucun produit ne correspond</h2>
                <p>Essayez un autre mot-clé ou retirez quelques filtres.</p>
                <button className="btn btn--primary" onClick={clearAll}>Effacer les filtres</button>
              </div>
            ) : (
              <>
                <div className="product-grid product-grid--catalog">
                  {visible.map((p, i) => <ProductCard key={p.id} product={p} catalog={catalog} eager={i < 4} />)}
                </div>
                {visible.length < results.length && (
                  <div className="load-more">
                    <p className="small muted">{visible.length} sur {results.length} produits</p>
                    <div className="load-more-bar"><span style={{ width: `${(visible.length / results.length) * 100}%` }} /></div>
                    <button className="btn btn--secondary" onClick={() => set({ page: String(page + 1) })}>Afficher plus de produits</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {sheetOpen && (
        <>
          <div className="backdrop" onClick={() => setSheetOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="filters-title" ref={sheetRef} tabIndex={-1}>
            <div className="drawer-head">
              <h2 id="filters-title">Filtres</h2>
              <button className="icon-btn" onClick={() => setSheetOpen(false)} aria-label="Fermer les filtres"><Icon name="x" /></button>
            </div>
            <div className="drawer-body"><FilterPanel catalog={catalog} base={base} filters={filters} set={set} /></div>
            <div className="drawer-foot sheet-foot">
              <button className="btn btn--ghost" onClick={clearAll}>Effacer</button>
              <button className="btn btn--primary" onClick={() => setSheetOpen(false)} data-autofocus>Voir {results.length} produit{results.length > 1 ? 's' : ''}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
