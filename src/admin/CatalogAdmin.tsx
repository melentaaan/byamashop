import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { backend } from '../backend';
import { Icon } from '../components/Icon';
import { useUi } from '../components/ui';
import { formatDate, slugify } from '../lib/format';
import { isPromotionLive } from '../lib/pricing';
import { ShopError, type Category, type Collection, type Promotion } from '../lib/types';
import { PageLoader } from '../pages/states';
import { useAdminInvalidate } from './hooks';
import { ImageField } from './ImageField';

function useSaver<T>(fn: (v: T) => Promise<unknown>, done: string, after?: () => void) {
  const invalidate = useAdminInvalidate();
  const { toast } = useUi();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { invalidate(); toast(done); after?.(); },
    onError: (e) => toast(e instanceof ShopError ? e.message : 'Action impossible', { tone: 'error' }),
  });
}

/* ------------------------------------------------------------ Catégories */
function CategoryForm({ initial, onClose }: { initial: Partial<Category>; onClose: () => void }) {
  const [c, setC] = useState<Partial<Category>>({ is_published: true, sort_order: 0, description: '', ...initial });
  const save = useSaver(() => backend.admin.saveCategory({
    id: c.id, slug: c.slug || slugify(c.name ?? ''), name: (c.name ?? '').trim(), description: c.description ?? '',
    image_url: c.image_url ?? null, sort_order: c.sort_order ?? 0, is_published: c.is_published ?? true,
  }), 'Catégorie enregistrée', onClose);
  return (
    <form className="admin-card form-grid" onSubmit={(e) => { e.preventDefault(); if ((c.name ?? '').trim()) save.mutate(undefined); }}>
      <h3>{c.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="c-n">Nom</label><input id="c-n" className="input" required value={c.name ?? ''} onChange={(e) => setC({ ...c, name: e.target.value, slug: c.id ? c.slug : slugify(e.target.value) })} /></div>
        <div className="field"><label htmlFor="c-s">Adresse</label><input id="c-s" className="input" value={c.slug ?? ''} onChange={(e) => setC({ ...c, slug: slugify(e.target.value) })} /><p className="field-hint">/categorie/{c.slug}</p></div>
      </div>
      <div className="field"><label htmlFor="c-d">Description</label><textarea id="c-d" className="textarea" rows={2} value={c.description ?? ''} onChange={(e) => setC({ ...c, description: e.target.value })} /></div>
      <ImageField id="c-img" label="Image de couverture (format portrait conseillé)" value={c.image_url ?? null} onChange={(url) => setC({ ...c, image_url: url })} />
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="c-o">Ordre d’affichage</label><input id="c-o" className="input" type="number" value={c.sort_order ?? 0} onChange={(e) => setC({ ...c, sort_order: Number(e.target.value) })} /></div>
        <label className="check"><input type="checkbox" checked={c.is_published ?? true} onChange={(e) => setC({ ...c, is_published: e.target.checked })} /> Visible sur le site</label>
      </div>
      <div className="cluster"><button className="btn btn--primary btn--sm" disabled={save.isPending}>Enregistrer</button><button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>Annuler</button></div>
    </form>
  );
}

function Categories() {
  const q = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => backend.admin.listCategories() });
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => backend.admin.listProducts() });
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const del = useSaver((id: string) => backend.admin.deleteCategory(id), 'Catégorie supprimée');
  if (q.isLoading) return <PageLoader />;
  return (
    <div className="stack">
      <div className="cluster"><button className="btn btn--primary btn--sm" onClick={() => setEditing({})}><Icon name="plus" size={16} /> Nouvelle catégorie</button></div>
      {editing && <CategoryForm initial={editing} onClose={() => setEditing(null)} />}
      <ul className="admin-list">
        {q.data?.map((c) => {
          const n = products.data?.filter((p) => p.category_id === c.id).length ?? 0;
          return (
            <li key={c.id} className="admin-list-row">
              <span className="thumb" style={{ width: 44, height: 55 }}>{c.image_url && <img src={c.image_url} alt="" />}</span>
              <span className="grow"><strong>{c.name}</strong><small>{n} produit{n > 1 ? 's' : ''} · /categorie/{c.slug}{c.is_published ? '' : ' · masquée'}</small></span>
              <button className="btn btn--ghost btn--sm" onClick={() => setEditing(c)}><Icon name="edit" size={16} /> Modifier</button>
              <button className="btn btn--ghost btn--sm" onClick={() => { if (window.confirm(n ? `${n} produits seront sans catégorie. Supprimer « ${c.name} » ?` : `Supprimer « ${c.name} » ?`)) del.mutate(c.id); }} aria-label={`Supprimer ${c.name}`}><Icon name="trash" size={16} /></button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ Collections */
function CollectionForm({ initial, onClose }: { initial: Partial<Collection>; onClose: () => void }) {
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => backend.admin.listProducts() });
  const [c, setC] = useState<Partial<Collection>>({ is_published: true, is_featured: true, sort_order: 0, description: '', product_ids: [], ...initial });
  const [filter, setFilter] = useState('');
  const save = useSaver(() => backend.admin.saveCollection({
    id: c.id, slug: c.slug || slugify(c.name ?? ''), name: (c.name ?? '').trim(), description: c.description ?? '', image_url: c.image_url ?? null,
    is_featured: !!c.is_featured, is_published: c.is_published ?? true, sort_order: c.sort_order ?? 0, is_demo: c.is_demo ?? false, product_ids: c.product_ids ?? [],
  }), 'Collection enregistrée', onClose);
  const ids = c.product_ids ?? [];
  const toggle = (id: string) => setC({ ...c, product_ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] });
  return (
    <form className="admin-card form-grid" onSubmit={(e) => { e.preventDefault(); if ((c.name ?? '').trim()) save.mutate(undefined); }}>
      <h3>{c.id ? 'Modifier la collection' : 'Nouvelle collection'}</h3>
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="k-n">Nom</label><input id="k-n" className="input" required value={c.name ?? ''} onChange={(e) => setC({ ...c, name: e.target.value, slug: c.id ? c.slug : slugify(e.target.value) })} /></div>
        <div className="field"><label htmlFor="k-s">Adresse</label><input id="k-s" className="input" value={c.slug ?? ''} onChange={(e) => setC({ ...c, slug: slugify(e.target.value) })} /><p className="field-hint">/collections/{c.slug}</p></div>
      </div>
      <div className="field"><label htmlFor="k-d">Description</label><textarea id="k-d" className="textarea" rows={2} value={c.description ?? ''} onChange={(e) => setC({ ...c, description: e.target.value })} /></div>
      <ImageField id="k-img" label="Image" value={c.image_url ?? null} onChange={(url) => setC({ ...c, image_url: url })} />
      <div className="cluster">
        <label className="check"><input type="checkbox" checked={!!c.is_featured} onChange={(e) => setC({ ...c, is_featured: e.target.checked })} /> Afficher sur l’accueil</label>
        <label className="check"><input type="checkbox" checked={c.is_published ?? true} onChange={(e) => setC({ ...c, is_published: e.target.checked })} /> Visible</label>
      </div>
      <fieldset className="pick-products">
        <legend className="field-label">Produits de la collection ({ids.length})</legend>
        <input className="input input--sm" placeholder="Filtrer les produits" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrer les produits" />
        <ul>
          {products.data?.filter((p) => p.status !== 'archived' && p.name.toLowerCase().includes(filter.toLowerCase())).map((p) => (
            <li key={p.id}><label className="check"><input type="checkbox" checked={ids.includes(p.id)} onChange={() => toggle(p.id)} /> {p.name}</label></li>
          ))}
        </ul>
      </fieldset>
      <div className="cluster"><button className="btn btn--primary btn--sm" disabled={save.isPending}>Enregistrer</button><button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>Annuler</button></div>
    </form>
  );
}

function Collections() {
  const q = useQuery({ queryKey: ['admin', 'collections'], queryFn: () => backend.admin.listCollections() });
  const [editing, setEditing] = useState<Partial<Collection> | null>(null);
  const del = useSaver((id: string) => backend.admin.deleteCollection(id), 'Collection supprimée');
  if (q.isLoading) return <PageLoader />;
  return (
    <div className="stack">
      <div className="cluster"><button className="btn btn--primary btn--sm" onClick={() => setEditing({})}><Icon name="plus" size={16} /> Nouvelle collection</button></div>
      {editing && <CollectionForm key={editing.id ?? 'new'} initial={editing} onClose={() => setEditing(null)} />}
      {!q.data?.length && <p className="muted">Aucune collection. Les collections regroupent des produits autour d’un thème (cadeaux, Ramadan, été…).</p>}
      <ul className="admin-list">
        {q.data?.map((c) => (
          <li key={c.id} className="admin-list-row">
            <span className="thumb" style={{ width: 44, height: 55 }}>{c.image_url && <img src={c.image_url} alt="" />}</span>
            <span className="grow"><strong>{c.name}</strong> {c.is_demo && <span className="badge badge--demo">démo</span>}<small>{c.product_ids.length} produits{c.is_featured ? ' · sur l’accueil' : ''}{c.is_published ? '' : ' · masquée'}</small></span>
            <button className="btn btn--ghost btn--sm" onClick={() => setEditing(c)}><Icon name="edit" size={16} /> Modifier</button>
            <button className="btn btn--ghost btn--sm" onClick={() => { if (window.confirm(`Supprimer la collection « ${c.name} » ? (les produits ne sont pas supprimés)`)) del.mutate(c.id); }} aria-label={`Supprimer ${c.name}`}><Icon name="trash" size={16} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ Promotions */
function toLocalInput(iso: string | null) { if (!iso) return ''; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }

function PromotionForm({ initial, onClose }: { initial: Partial<Promotion>; onClose: () => void }) {
  const cats = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => backend.admin.listCategories() });
  const cols = useQuery({ queryKey: ['admin', 'collections'], queryFn: () => backend.admin.listCollections() });
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => backend.admin.listProducts() });
  const [p, setP] = useState<Partial<Promotion>>({ scope: 'category', percent_off: 10, is_active: true, product_ids: [], ...initial });
  const [err, setErr] = useState('');
  const save = useSaver(() => backend.admin.savePromotion({
    id: p.id, name: (p.name ?? '').trim(), percent_off: Number(p.percent_off), scope: p.scope!, category_id: p.scope === 'category' ? p.category_id ?? null : null,
    collection_id: p.scope === 'collection' ? p.collection_id ?? null : null, product_ids: p.scope === 'products' ? p.product_ids ?? [] : [],
    starts_at: p.starts_at ?? null, ends_at: p.ends_at ?? null, is_active: p.is_active ?? true,
  }), 'Promotion enregistrée', onClose);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pct = Number(p.percent_off);
    if (!(p.name ?? '').trim()) return setErr('Donnez un nom à la promotion.');
    if (!Number.isInteger(pct) || pct < 1 || pct > 90) return setErr('La remise doit être un nombre entre 1 et 90 %.');
    if (p.scope === 'category' && !p.category_id) return setErr('Choisissez une catégorie.');
    if (p.scope === 'collection' && !p.collection_id) return setErr('Choisissez une collection.');
    if (p.scope === 'products' && !p.product_ids?.length) return setErr('Choisissez au moins un produit.');
    if (p.starts_at && p.ends_at && p.ends_at <= p.starts_at) return setErr('La date de fin doit être après la date de début.');
    setErr('');
    save.mutate(undefined);
  };
  return (
    <form className="admin-card form-grid" onSubmit={submit}>
      <h3>{p.id ? 'Modifier la promotion' : 'Nouvelle promotion'}</h3>
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="pr-n">Nom (interne)</label><input id="pr-n" className="input" value={p.name ?? ''} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder="Ex. Spécial Tabaski" /></div>
        <div className="field"><label htmlFor="pr-p">Remise (%)</label><input id="pr-p" className="input" type="number" min={1} max={90} value={p.percent_off ?? ''} onChange={(e) => setP({ ...p, percent_off: Number(e.target.value) })} /></div>
      </div>
      <div className="field"><label htmlFor="pr-s">S’applique à</label>
        <select id="pr-s" className="select" value={p.scope} onChange={(e) => setP({ ...p, scope: e.target.value as Promotion['scope'] })}>
          <option value="category">Une catégorie</option><option value="collection">Une collection</option><option value="products">Des produits choisis</option><option value="all">Toute la boutique</option>
        </select></div>
      {p.scope === 'category' && <div className="field"><label htmlFor="pr-c">Catégorie</label><select id="pr-c" className="select" value={p.category_id ?? ''} onChange={(e) => setP({ ...p, category_id: e.target.value || null })}><option value="">—</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
      {p.scope === 'collection' && <div className="field"><label htmlFor="pr-k">Collection</label><select id="pr-k" className="select" value={p.collection_id ?? ''} onChange={(e) => setP({ ...p, collection_id: e.target.value || null })}><option value="">—</option>{cols.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
      {p.scope === 'products' && (
        <fieldset className="pick-products"><legend className="field-label">Produits ({p.product_ids?.length ?? 0})</legend>
          <ul>{products.data?.filter((x) => x.status === 'published').map((x) => (
            <li key={x.id}><label className="check"><input type="checkbox" checked={p.product_ids?.includes(x.id) ?? false} onChange={() => setP({ ...p, product_ids: p.product_ids?.includes(x.id) ? p.product_ids.filter((i) => i !== x.id) : [...(p.product_ids ?? []), x.id] })} /> {x.name}</label></li>
          ))}</ul>
        </fieldset>
      )}
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="pr-d1">Début (facultatif)</label><input id="pr-d1" className="input" type="datetime-local" value={toLocalInput(p.starts_at ?? null)} onChange={(e) => setP({ ...p, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
        <div className="field"><label htmlFor="pr-d2">Fin (facultatif)</label><input id="pr-d2" className="input" type="datetime-local" value={toLocalInput(p.ends_at ?? null)} onChange={(e) => setP({ ...p, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
      </div>
      <label className="check"><input type="checkbox" checked={p.is_active ?? true} onChange={(e) => setP({ ...p, is_active: e.target.checked })} /> Promotion active</label>
      <p className="field-hint">Le prix réduit est calculé automatiquement (arrondi à 5 FCFA) et affiché avec l’ancien prix barré. Si plusieurs promotions s’appliquent, la plus forte l’emporte.</p>
      {err && <p className="field-error" role="alert">{err}</p>}
      <div className="cluster"><button className="btn btn--primary btn--sm" disabled={save.isPending}>Enregistrer</button><button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>Annuler</button></div>
    </form>
  );
}

function Promotions() {
  const q = useQuery({ queryKey: ['admin', 'promotions'], queryFn: () => backend.admin.listPromotions() });
  const [editing, setEditing] = useState<Partial<Promotion> | null>(null);
  const del = useSaver((id: string) => backend.admin.deletePromotion(id), 'Promotion supprimée');
  if (q.isLoading) return <PageLoader />;
  const scopeLabel = { all: 'Toute la boutique', category: 'Catégorie', collection: 'Collection', products: 'Produits choisis' };
  return (
    <div className="stack">
      <div className="cluster"><button className="btn btn--primary btn--sm" onClick={() => setEditing({})}><Icon name="plus" size={16} /> Nouvelle promotion</button></div>
      {editing && <PromotionForm key={editing.id ?? 'new'} initial={editing} onClose={() => setEditing(null)} />}
      {!q.data?.length && <p className="muted">Aucune promotion.</p>}
      <ul className="admin-list">
        {q.data?.map((p) => {
          const live = isPromotionLive(p);
          return (
            <li key={p.id} className="admin-list-row">
              <span className="promo-pct">−{p.percent_off} %</span>
              <span className="grow"><strong>{p.name}</strong><small>{scopeLabel[p.scope]}{p.starts_at ? ` · du ${formatDate(p.starts_at)}` : ''}{p.ends_at ? ` au ${formatDate(p.ends_at)}` : ''}</small></span>
              <span className={`status-pill ${live ? 'status-pill--completed' : ''}`}>{live ? 'En cours' : p.is_active ? 'Programmée / terminée' : 'Désactivée'}</span>
              <button className="btn btn--ghost btn--sm" onClick={() => setEditing(p)}><Icon name="edit" size={16} /> Modifier</button>
              <button className="btn btn--ghost btn--sm" onClick={() => { if (window.confirm(`Supprimer la promotion « ${p.name} » ?`)) del.mutate(p.id); }} aria-label={`Supprimer ${p.name}`}><Icon name="trash" size={16} /></button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function CatalogAdmin() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('onglet') ?? 'categories';
  const tabs = [['categories', 'Catégories'], ['collections', 'Collections'], ['promotions', 'Promotions']];
  return (
    <div className="admin-page">
      <div className="admin-head"><div><h1>Catégories, collections & promotions</h1><p className="muted">Organisez votre boutique et créez des offres.</p></div></div>
      <div className="chips admin-tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className="chip" aria-pressed={tab === k} onClick={() => setSp({ onglet: k }, { replace: true })}>{l}</button>)}
      </div>
      {tab === 'categories' && <Categories />}
      {tab === 'collections' && <Collections />}
      {tab === 'promotions' && <Promotions />}
    </div>
  );
}
