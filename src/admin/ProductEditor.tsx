import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { backend } from '../backend';
import type { ProductInput } from '../backend/types';
import { Icon } from '../components/Icon';
import { Spinner, useUi } from '../components/ui';
import { slugify } from '../lib/format';
import { prepareImage } from '../lib/images';
import { ShopError, type ProductWithRelations } from '../lib/types';
import { ErrorState, PageLoader } from '../pages/states';
import { useAdminInvalidate } from './hooks';

type VariantDraft = ProductInput['variants'][number] & { key: string };
type ImageDraft = ProductInput['images'][number] & { key: string };
type ProductDraft = ProductInput['product'];

const newKey = () => Math.random().toString(36).slice(2);

function emptyProduct(): ProductDraft {
  return {
    slug: '', name: '', category_id: null, short_description: '', description: '', details: '', price: 0, compare_at_price: null,
    status: 'draft', is_featured: false, is_new: true, condition_note: null, tags: [], option1_name: 'Taille', option2_name: 'Couleur',
    seo_title: null, seo_description: null, sort_order: 0, is_demo: false,
  };
}
const emptyVariant = (): VariantDraft => ({ key: newKey(), sku: null, option1: null, option2: null, color_hex: null, price_override: null, stock: 0, is_active: true, position: 0 });

function fromProduct(p: ProductWithRelations) {
  const { variants, images, created_at: _c, updated_at: _u, published_at: _p, ...product } = p;
  return {
    product,
    variants: variants.map((v) => ({ ...v, key: v.id })) as VariantDraft[],
    images: images.map((i) => ({ ...i, key: i.id })) as ImageDraft[],
  };
}

function NumberInput({ value, onChange, id, min = 0, placeholder, ...rest }: { value: number | null; onChange: (v: number | null) => void; id?: string; min?: number; placeholder?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      id={id} className="input" type="number" inputMode="numeric" min={min} step={1} placeholder={placeholder}
      value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Math.floor(Number(e.target.value)))} {...rest}
    />
  );
}

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const invalidate = useAdminInvalidate();
  const { toast } = useUi();
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => backend.admin.listProducts() });
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => backend.admin.listCategories() });
  const existing = products.data?.find((p) => p.id === id);

  const [product, setProduct] = useState<ProductDraft>(emptyProduct);
  const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant()]);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(0);
  const [genSizes, setGenSizes] = useState('');
  const [genColors, setGenColors] = useState('');
  const [tagsText, setTagsText] = useState('');
  const loadedFor = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing && loadedFor.current !== existing.id) {
      const d = fromProduct(existing);
      setProduct(d.product);
      setVariants(d.variants.length ? d.variants : [emptyVariant()]);
      setImages(d.images);
      setTagsText(d.product.tags.join(', '));
      setSlugTouched(true);
      loadedFor.current = existing.id;
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      const errs: Record<string, string> = {};
      if (product.name.trim().length < 2) errs.name = 'Le nom est obligatoire.';
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(product.slug)) errs.slug = 'Utilisez uniquement des lettres minuscules, chiffres et tirets.';
      if (!Number.isInteger(product.price) || product.price < 0) errs.price = 'Prix invalide.';
      if (product.compare_at_price != null && product.compare_at_price <= product.price) errs.compare_at_price = 'Le prix barré doit être supérieur au prix de vente.';
      if (!variants.length) errs.variants = 'Ajoutez au moins une ligne de stock.';
      if (variants.some((v) => !Number.isInteger(v.stock) || v.stock < 0)) errs.variants = 'Chaque stock doit être un nombre entier positif ou nul.';
      const combos = variants.map((v) => `${v.option1 ?? ''}|${v.option2 ?? ''}`);
      if (new Set(combos).size !== combos.length) errs.variants = 'Deux variantes ont la même taille et la même couleur.';
      if (variants.length > 1 && variants.some((v) => !v.option1 && !v.option2)) errs.variants = 'Avec plusieurs variantes, chacune doit avoir une taille ou une couleur.';
      setErrors(errs);
      if (Object.keys(errs).length) throw new ShopError('VALIDATION', 'Corrigez les champs signalés.');
      return backend.admin.saveProduct({
        product: { ...product, name: product.name.trim(), tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean) },
        variants: variants.map(({ key: _k, ...v }, i) => ({ ...v, option1: v.option1?.trim() || null, option2: v.option2?.trim() || null, sku: v.sku?.trim() || null, position: i })),
        images: images.map(({ key: _k, ...im }, i) => ({ ...im, position: i })),
      });
    },
    onSuccess: (saved) => {
      invalidate();
      toast('Produit enregistré');
      loadedFor.current = null;
      if (isNew) navigate(`/admin/produits/${saved.id}`, { replace: true });
    },
    onError: (e) => {
      const se = e instanceof ShopError ? e : null;
      if (se?.field === 'slug') setErrors((x) => ({ ...x, slug: se.message }));
      toast(se?.message ?? 'Enregistrement impossible', { tone: 'error' });
    },
  });

  const remove = useMutation({
    mutationFn: () => backend.admin.deleteProduct(id!),
    onSuccess: () => { invalidate(); toast('Produit supprimé'); navigate('/admin/produits'); },
    onError: () => toast('Suppression impossible', { tone: 'error' }),
  });

  if (!isNew && products.isLoading) return <PageLoader />;
  if (products.error) return <ErrorState onRetry={() => products.refetch()} />;
  if (!isNew && !existing) return <div className="admin-page"><p>Produit introuvable. <Link to="/admin/produits">Retour à la liste</Link></p></div>;

  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => setProduct((p) => ({ ...p, [k]: v }));
  const setVariant = (key: string, patch: Partial<VariantDraft>) => setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  const move = <T,>(arr: T[], i: number, d: number) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 10);
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const prep = await prepareImage(f);
        const up = await backend.admin.uploadImage(prep.full, prep.thumb, { width: prep.width, height: prep.height, ext: prep.ext });
        setImages((imgs) => [...imgs, { key: newKey(), url: up.url, thumb_url: up.thumb_url, storage_path: up.storage_path, width: up.width, height: up.height, alt: product.name, position: imgs.length }]);
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Envoi impossible', { tone: 'error' });
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const generate = () => {
    const sizes = genSizes.split(',').map((s) => s.trim()).filter(Boolean);
    const colors = genColors.split(',').map((s) => s.trim()).filter(Boolean);
    if (!sizes.length && !colors.length) return;
    const next: VariantDraft[] = [];
    for (const s of sizes.length ? sizes : [null]) {
      for (const c of colors.length ? colors : [null]) {
        const prev = variants.find((v) => (v.option1 ?? null) === s && (v.option2 ?? null) === c);
        next.push(prev ?? { ...emptyVariant(), option1: s, option2: c });
      }
    }
    setVariants(next);
  };

  const err = (k: string) => errors[k] && <p className="field-error">{errors[k]}</p>;
  const totalStock = variants.reduce((s, v) => s + (v.is_active ? v.stock || 0 : 0), 0);

  return (
    <div className="admin-page product-editor">
      <div className="admin-head">
        <div>
          <Link to="/admin/produits" className="back-link"><Icon name="arrow-left" size={16} /> Produits</Link>
          <h1>{isNew ? 'Nouveau produit' : product.name || 'Produit'}</h1>
          {product.is_demo && <p className="small"><span className="badge badge--demo">Produit de démonstration</span> En l’enregistrant, il restera marqué « démo » tant que vous ne décochez pas l’option en bas de page.</p>}
        </div>
        {!isNew && product.status === 'published' && <a href={`/produit/${product.slug}`} target="_blank" rel="noopener" className="btn btn--ghost btn--sm"><Icon name="external" size={16} /> Voir sur le site</a>}
      </div>

      <form className="editor-grid" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} noValidate>
        <div className="stack">
          <section className="admin-card form-grid">
            <h2>Informations</h2>
            <div className="field">
              <label htmlFor="p-name">Nom du produit<span className="req">*</span></label>
              <input id="p-name" className="input" value={product.name} aria-invalid={!!errors.name || undefined}
                onChange={(e) => { set('name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} />
              {err('name')}
            </div>
            <div className="field">
              <label htmlFor="p-slug">Adresse de la page</label>
              <div className="prefix-input"><span>/produit/</span><input id="p-slug" className="input" value={product.slug} aria-invalid={!!errors.slug || undefined} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></div>
              {err('slug') ?? <p className="field-hint">Générée automatiquement. Évitez de la modifier une fois le produit partagé.</p>}
            </div>
            <div className="field">
              <label htmlFor="p-cat">Catégorie</label>
              <select id="p-cat" className="select" value={product.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)}>
                <option value="">— Sans catégorie —</option>
                {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-short">Phrase d’accroche</label>
              <input id="p-short" className="input" maxLength={300} value={product.short_description} onChange={(e) => set('short_description', e.target.value)} placeholder="Ex. Voile long et jupe ample, tissu fluide." />
            </div>
            <div className="field">
              <label htmlFor="p-desc">Description</label>
              <textarea id="p-desc" className="textarea" rows={6} maxLength={5000} value={product.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-details">Détails & entretien <span className="muted">(une information par ligne)</span></label>
              <textarea id="p-details" className="textarea" rows={4} maxLength={3000} value={product.details} onChange={(e) => set('details', e.target.value)} placeholder={'Composition : …\nEntretien : …'} />
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-head"><h2>Photos</h2><span className="small muted">{images.length} photo{images.length > 1 ? 's' : ''} · la première est la photo principale</span></div>
            <ul className="image-manager">
              {images.map((im, i) => (
                <li key={im.key}>
                  <img src={im.thumb_url ?? im.url} alt="" />
                  <input className="input input--sm" value={im.alt} onChange={(e) => setImages((a) => a.map((x) => (x.key === im.key ? { ...x, alt: e.target.value } : x)))} placeholder="Description de la photo" aria-label={`Description de la photo ${i + 1}`} />
                  <div className="im-actions">
                    <button type="button" className="icon-btn" onClick={() => setImages((a) => move(a, i, -1))} disabled={i === 0} aria-label="Déplacer avant"><Icon name="chevron-left" size={18} /></button>
                    <button type="button" className="icon-btn" onClick={() => setImages((a) => move(a, i, 1))} disabled={i === images.length - 1} aria-label="Déplacer après"><Icon name="chevron-right" size={18} /></button>
                    <button type="button" className="icon-btn" onClick={() => { if (im.storage_path) void backend.admin.deleteImageFile(im.storage_path).catch(() => undefined); setImages((a) => a.filter((x) => x.key !== im.key)); }} aria-label="Supprimer la photo"><Icon name="trash" size={18} /></button>
                  </div>
                </li>
              ))}
              <li className="image-drop">
                <label>
                  <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
                  {uploading > 0 ? <><Spinner /> Envoi ({uploading})…</> : <><Icon name="upload" /> <span>Ajouter des photos</span><small>JPG, PNG, WebP — redimensionnées automatiquement</small></>}
                </label>
              </li>
            </ul>
          </section>

          <section className="admin-card">
            <div className="admin-card-head"><h2>Tailles, couleurs & stock</h2><span className="small muted">Stock total : <strong>{totalStock}</strong></span></div>
            <div className="form-grid form-grid--2">
              <div className="field"><label htmlFor="o1">Nom de l’option 1</label><input id="o1" className="input" value={product.option1_name} onChange={(e) => set('option1_name', e.target.value)} placeholder="Taille, Contenance…" /></div>
              <div className="field"><label htmlFor="o2">Nom de l’option 2</label><input id="o2" className="input" value={product.option2_name} onChange={(e) => set('option2_name', e.target.value)} placeholder="Couleur…" /></div>
            </div>
            <details className="generator">
              <summary>Créer rapidement toutes les combinaisons</summary>
              <div className="form-grid form-grid--2">
                <div className="field"><label htmlFor="g1">{product.option1_name || 'Option 1'} (séparées par des virgules)</label><input id="g1" className="input" value={genSizes} onChange={(e) => setGenSizes(e.target.value)} placeholder="S, M, L, XL" /></div>
                <div className="field"><label htmlFor="g2">{product.option2_name || 'Option 2'} (séparées par des virgules)</label><input id="g2" className="input" value={genColors} onChange={(e) => setGenColors(e.target.value)} placeholder="Noir, Prune" /></div>
              </div>
              <button type="button" className="btn btn--soft btn--sm" onClick={generate}>Générer les variantes</button>
            </details>
            <div className="variant-table" role="table" aria-label="Variantes">
              <div className="vt-row vt-head" role="row">
                <span role="columnheader">{product.option1_name || 'Option 1'}</span><span role="columnheader">{product.option2_name || 'Option 2'}</span><span role="columnheader">Teinte</span>
                <span role="columnheader">Prix spécifique</span><span role="columnheader">Stock</span><span role="columnheader">Réf. (SKU)</span><span role="columnheader">Actif</span><span role="columnheader"><span className="sr-only">Actions</span></span>
              </div>
              {variants.map((v, i) => (
                <div className="vt-row" role="row" key={v.key} data-testid="variant-row">
                  <input className="input input--sm" aria-label={`${product.option1_name} ligne ${i + 1}`} value={v.option1 ?? ''} onChange={(e) => setVariant(v.key, { option1: e.target.value || null })} placeholder="—" />
                  <input className="input input--sm" aria-label={`${product.option2_name} ligne ${i + 1}`} value={v.option2 ?? ''} onChange={(e) => setVariant(v.key, { option2: e.target.value || null })} placeholder="—" />
                  <span className="vt-color">
                    <input type="color" aria-label={`Teinte ligne ${i + 1}`} value={v.color_hex ?? '#cccccc'} onChange={(e) => setVariant(v.key, { color_hex: e.target.value.toUpperCase() })} />
                    {v.color_hex && <button type="button" className="link-btn" onClick={() => setVariant(v.key, { color_hex: null })}>effacer</button>}
                  </span>
                  <NumberInput aria-label={`Prix spécifique ligne ${i + 1}`} className="input input--sm" value={v.price_override} onChange={(n) => setVariant(v.key, { price_override: n })} placeholder="= prix" />
                  <NumberInput aria-label={`Stock ligne ${i + 1}`} className="input input--sm" value={v.stock} onChange={(n) => setVariant(v.key, { stock: n ?? 0 })} />
                  <input className="input input--sm" aria-label={`Référence ligne ${i + 1}`} value={v.sku ?? ''} onChange={(e) => setVariant(v.key, { sku: e.target.value || null })} />
                  <input type="checkbox" aria-label={`Variante active ligne ${i + 1}`} checked={v.is_active} onChange={(e) => setVariant(v.key, { is_active: e.target.checked })} />
                  <button type="button" className="icon-btn" aria-label={`Supprimer la ligne ${i + 1}`} disabled={variants.length === 1} onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))}><Icon name="trash" size={18} /></button>
                </div>
              ))}
            </div>
            {err('variants')}
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setVariants((vs) => [...vs, emptyVariant()])}><Icon name="plus" size={16} /> Ajouter une ligne</button>
            <p className="field-hint">Sans taille ni couleur, gardez une seule ligne et indiquez simplement le stock. Le stock diminue automatiquement à chaque commande et revient si la commande est annulée.</p>
          </section>
        </div>

        <aside className="stack editor-aside">
          <section className="admin-card form-grid">
            <h2>Publication</h2>
            <div className="field">
              <label htmlFor="p-status">Statut</label>
              <select id="p-status" className="select" value={product.status} onChange={(e) => set('status', e.target.value as ProductDraft['status'])}>
                <option value="published">En ligne (visible)</option>
                <option value="draft">Brouillon (masqué)</option>
                <option value="archived">Archivé (masqué, conservé)</option>
              </select>
            </div>
            <label className="check"><input type="checkbox" checked={product.is_new} onChange={(e) => set('is_new', e.target.checked)} /> Afficher le badge « Nouveau »</label>
            <label className="check"><input type="checkbox" checked={product.is_featured} onChange={(e) => set('is_featured', e.target.checked)} /> Mettre en avant sur l’accueil</label>
          </section>

          <section className="admin-card form-grid">
            <h2>Prix</h2>
            <div className="field">
              <label htmlFor="p-price">Prix de vente (FCFA)<span className="req">*</span></label>
              <NumberInput id="p-price" value={product.price} onChange={(n) => set('price', n ?? 0)} aria-invalid={!!errors.price || undefined} />
              {err('price')}
            </div>
            <div className="field">
              <label htmlFor="p-compare">Prix barré (FCFA) <span className="muted">facultatif</span></label>
              <NumberInput id="p-compare" value={product.compare_at_price} onChange={(n) => set('compare_at_price', n || null)} />
              {err('compare_at_price') ?? <p className="field-hint">Affiché barré à côté du prix. Pour une remise temporaire sur plusieurs produits, utilisez plutôt une promotion.</p>}
            </div>
          </section>

          <section className="admin-card form-grid">
            <h2>Autres informations</h2>
            <div className="field">
              <label htmlFor="p-cond">État (articles de seconde main)</label>
              <input id="p-cond" className="input" value={product.condition_note ?? ''} onChange={(e) => set('condition_note', e.target.value || null)} placeholder="Ex. Très bon état" />
            </div>
            <div className="field">
              <label htmlFor="p-tags">Mots-clés pour la recherche</label>
              <input id="p-tags" className="input" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="prière, satin, cadeau" />
            </div>
            <details>
              <summary className="small">Référencement Google (facultatif)</summary>
              <div className="form-grid" style={{ marginTop: 12 }}>
                <div className="field"><label htmlFor="p-seot">Titre</label><input id="p-seot" className="input" maxLength={120} value={product.seo_title ?? ''} onChange={(e) => set('seo_title', e.target.value || null)} /></div>
                <div className="field"><label htmlFor="p-seod">Description</label><textarea id="p-seod" className="textarea" maxLength={320} rows={3} value={product.seo_description ?? ''} onChange={(e) => set('seo_description', e.target.value || null)} /></div>
              </div>
            </details>
            {product.is_demo && <label className="check"><input type="checkbox" checked={product.is_demo} onChange={(e) => set('is_demo', e.target.checked)} /> Produit de démonstration</label>}
          </section>

          {!isNew && (
            <section className="admin-card form-grid">
              <h2>Retirer ce produit</h2>
              <p className="small muted">L’archivage masque le produit en conservant son historique. La suppression est définitive (les commandes passées gardent le nom et le prix).</p>
              <div className="cluster">
                <button type="button" className="btn btn--soft btn--sm" onClick={() => { set('status', 'archived'); }}>Archiver</button>
                <button type="button" className="btn btn--danger btn--sm" disabled={remove.isPending} onClick={() => { if (window.confirm(`Supprimer définitivement « ${product.name} » ?`)) remove.mutate(); }}>Supprimer</button>
              </div>
            </section>
          )}
        </aside>

        <div className="editor-savebar">
          <span className="small muted hide-mobile">{save.isPending ? 'Enregistrement…' : 'Pensez à enregistrer vos modifications.'}</span>
          <button type="submit" className="btn btn--primary" disabled={save.isPending || uploading > 0} data-testid="save-product">{save.isPending ? <Spinner /> : <Icon name="check" size={18} />} Enregistrer</button>
        </div>
      </form>
    </div>
  );
}
