import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { backend } from '../backend';
import { Icon } from '../components/Icon';
import { ProductThumb } from '../components/ProductImage';
import { useUi } from '../components/ui';
import { formatFCFA, normalizeText } from '../lib/format';
import { productsToCsv } from '../lib/csv';
import type { ProductWithRelations } from '../lib/types';
import { ShopError } from '../lib/types';
import { ErrorState, PageLoader } from '../pages/states';
import { useAdminInvalidate } from './hooks';

const STATUS_LABEL = { published: 'En ligne', draft: 'Brouillon', archived: 'Archivé' } as const;

function StockEditor({ product, onDone }: { product: ProductWithRelations; onDone: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(product.variants.map((v) => [v.id, String(v.stock)])));
  const invalidate = useAdminInvalidate();
  const { toast } = useUi();
  const save = useMutation({
    mutationFn: async () => {
      for (const v of product.variants) {
        const n = Number(values[v.id]);
        if (!Number.isInteger(n) || n < 0) throw new ShopError('VALIDATION', 'Les stocks doivent être des nombres entiers positifs.');
        if (n !== v.stock) await backend.admin.updateVariantStock(v.id, n);
      }
    },
    onSuccess: () => { invalidate(); toast('Stock mis à jour'); onDone(); },
    onError: (e) => toast(e instanceof ShopError ? e.message : 'Erreur', { tone: 'error' }),
  });
  return (
    <div className="stock-editor">
      {product.variants.map((v) => (
        <label key={v.id} className="stock-row">
          <span>{[v.option1, v.option2].filter(Boolean).join(' · ') || 'Stock'}</span>
          <input className="input input--sm" type="number" min={0} inputMode="numeric" value={values[v.id]} onChange={(e) => setValues({ ...values, [v.id]: e.target.value })} aria-label={`Stock ${[v.option1, v.option2].filter(Boolean).join(' ') || product.name}`} />
        </label>
      ))}
      <div className="cluster">
        <button className="btn btn--primary btn--sm" onClick={() => save.mutate()} disabled={save.isPending}>Enregistrer le stock</button>
        <button className="btn btn--ghost btn--sm" onClick={onDone}>Annuler</button>
      </div>
    </div>
  );
}

export default function Products() {
  const [sp, setSp] = useSearchParams();
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => backend.admin.listProducts() });
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => backend.admin.listCategories() });
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const invalidate = useAdminInvalidate();
  const qc = useQueryClient();
  const { toast } = useUi();
  const status = sp.get('statut') ?? '';
  const cat = sp.get('categorie') ?? '';
  const stock = sp.get('stock') ?? '';

  const toggle = useMutation({
    mutationFn: (p: ProductWithRelations) => backend.admin.setProductStatus(p.id, p.status === 'published' ? 'draft' : 'published'),
    onSuccess: (_d, p) => { invalidate(); toast(p.status === 'published' ? 'Produit retiré de la boutique' : 'Produit publié'); },
    onError: () => toast('Action impossible', { tone: 'error' }),
  });

  const list = useMemo(() => {
    const term = normalizeText(q);
    return (products.data ?? []).filter((p) => {
      const total = p.variants.reduce((s, v) => s + (v.is_active ? v.stock : 0), 0);
      if (status && p.status !== status) return false;
      if (status === '' && p.status === 'archived') return false;
      if (cat && p.category_id !== cat) return false;
      if (stock === 'bas' && !p.variants.some((v) => v.is_active && v.stock <= 3)) return false;
      if (stock === 'epuise' && total > 0) return false;
      if (stock === 'demo' && !p.is_demo) return false;
      return !term || normalizeText(p.name).includes(term) || p.variants.some((v) => v.sku && normalizeText(v.sku).includes(term));
    });
  }, [products.data, q, status, cat, stock]);

  if (products.isLoading) return <PageLoader />;
  if (products.error) return <ErrorState onRetry={() => products.refetch()} />;
  const demoCount = products.data?.filter((p) => p.is_demo).length ?? 0;
  const catName = (id: string | null) => categories.data?.find((c) => c.id === id)?.name ?? '—';
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };

  const exportCsv = () => {
    const blob = new Blob(['﻿' + productsToCsv(products.data ?? [], categories.data ?? [])], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `byamashop-produits-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><h1>Produits & stock</h1><p className="muted">{products.data?.length ?? 0} produits au total</p></div>
        <div className="cluster">
          <Link to="/admin/produits/import" className="btn btn--soft btn--sm"><Icon name="upload" size={16} /> Importer</Link>
          <button className="btn btn--soft btn--sm" onClick={exportCsv}><Icon name="download" size={16} /> Exporter</button>
          <Link to="/admin/produits/nouveau" className="btn btn--primary btn--sm"><Icon name="plus" size={16} /> Nouveau produit</Link>
        </div>
      </div>

      {demoCount > 0 && (
        <div className="alert alert--warning">
          <Icon name="info" />
          <span><strong>{demoCount} produits de démonstration</strong> sont présents. Remplacez-les par vos vrais produits, puis supprimez-les depuis <Link to="/admin/reglages#demo">Réglages › Catalogue de démonstration</Link>.</span>
        </div>
      )}

      <div className="admin-filters">
        <div className="searchbox searchbox--panel">
          <Icon name="search" className="searchbox-icon" />
          <input className="searchbox-input" type="search" placeholder="Rechercher un produit ou une référence" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un produit" />
        </div>
        <select className="select select--sm" value={status} onChange={(e) => setParam('statut', e.target.value)} aria-label="Statut">
          <option value="">Tous (hors archivés)</option>
          <option value="published">En ligne</option>
          <option value="draft">Brouillons</option>
          <option value="archived">Archivés</option>
        </select>
        <select className="select select--sm" value={cat} onChange={(e) => setParam('categorie', e.target.value)} aria-label="Catégorie">
          <option value="">Toutes catégories</option>
          {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="select select--sm" value={stock} onChange={(e) => setParam('stock', e.target.value)} aria-label="Stock">
          <option value="">Tout le stock</option>
          <option value="bas">Stock bas (≤ 3)</option>
          <option value="epuise">Épuisés</option>
          <option value="demo">Démonstration</option>
        </select>
      </div>

      {list.length === 0 ? (
        <div className="admin-card empty-state"><h2>Aucun produit</h2><p>Aucun produit ne correspond à ces filtres.</p><Link to="/admin/produits/nouveau" className="btn btn--primary">Ajouter un produit</Link></div>
      ) : (
        <ul className="product-admin-list" data-testid="admin-product-list">
          {list.map((p) => {
            const total = p.variants.reduce((s, v) => s + (v.is_active ? v.stock : 0), 0);
            return (
              <li key={p.id} className="pal-item" data-testid="admin-product-row">
                <div className="pal-main">
                  <ProductThumb product={p} size={56} />
                  <div className="pal-info">
                    <Link to={`/admin/produits/${p.id}`} className="pal-name">{p.name}</Link>
                    <span className="small muted">{catName(p.category_id)} · {formatFCFA(p.price)}{p.variants.length > 1 ? ` · ${p.variants.length} variantes` : ''}</span>
                    <span className="cluster">
                      <span className={`status-pill status-pill--${p.status === 'published' ? 'completed' : p.status === 'draft' ? 'new' : 'cancelled'}`}>{STATUS_LABEL[p.status]}</span>
                      <span className={`status-pill ${total === 0 ? 'status-pill--cancelled' : total <= 3 ? 'status-pill--pending' : ''}`}>{total === 0 ? 'Épuisé' : `${total} en stock`}</span>
                      {p.is_demo && <span className="badge badge--demo">démo</span>}
                    </span>
                  </div>
                  <div className="pal-actions">
                    <button className="btn btn--soft btn--sm" onClick={() => setEditing(editing === p.id ? null : p.id)} aria-expanded={editing === p.id}>Stock</button>
                    {p.status !== 'archived' && (
                      <button className="btn btn--ghost btn--sm" onClick={() => toggle.mutate(p)} disabled={toggle.isPending}>
                        <Icon name={p.status === 'published' ? 'eye-off' : 'eye'} size={16} /> {p.status === 'published' ? 'Retirer' : 'Publier'}
                      </button>
                    )}
                    <Link to={`/admin/produits/${p.id}`} className="btn btn--ghost btn--sm" aria-label={`Modifier ${p.name}`}><Icon name="edit" size={16} /> Modifier</Link>
                  </div>
                </div>
                {editing === p.id && <StockEditor product={p} onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['admin', 'products'] }); }} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
