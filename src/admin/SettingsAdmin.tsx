import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { backend } from '../backend';
import { resetDemoData } from '../backend/demo';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { Spinner, useUi } from '../components/ui';
import { isDemoMode } from '../lib/config';
import { formatFCFA } from '../lib/format';
import { PAYMENT_METHOD_LABELS } from '../lib/labels';
import { ShopError, type DeliveryZone, type PaymentMethod, type StoreSettings } from '../lib/types';
import { ErrorState, PageLoader } from '../pages/states';
import { useAdminInvalidate } from './hooks';
import { ImageField } from './ImageField';

function Text({ id, label, value, onChange, hint, multiline, type = 'text', placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string; multiline?: boolean; type?: string; placeholder?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline
        ? <textarea id={id} className="textarea" rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        : <input id={id} className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

function StoreForm({ initial }: { initial: StoreSettings }) {
  const [s, setS] = useState(initial);
  const invalidate = useAdminInvalidate();
  const { toast } = useUi();
  useEffect(() => setS(initial), [initial]);
  const save = useMutation({
    mutationFn: () => {
      const wa = s.whatsapp.replace(/\D/g, '');
      if (wa && !/^\d{8,15}$/.test(wa)) throw new ShopError('VALIDATION', 'Numéro WhatsApp invalide : format international sans + (ex. 221771234567).');
      for (const [k, url] of Object.entries(s.socials)) if (url && !/^https:\/\//.test(url)) throw new ShopError('VALIDATION', `Le lien ${k} doit commencer par https://`);
      if (!Object.values(s.payments).some((p) => p.enabled)) throw new ShopError('VALIDATION', 'Activez au moins un moyen de paiement.');
      return backend.admin.saveSettings({ ...s, whatsapp: wa });
    },
    onSuccess: () => { invalidate(); toast('Réglages enregistrés'); },
    onError: (e) => toast(e instanceof ShopError ? e.message : 'Enregistrement impossible', { tone: 'error' }),
  });
  const up = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const pay = (m: PaymentMethod, patch: Partial<StoreSettings['payments'][PaymentMethod]>) => setS((x) => ({ ...x, payments: { ...x.payments, [m]: { ...x.payments[m], ...patch } } }));
  const banner = s.banners[0];

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="stack">
      <section className="admin-card form-grid" id="contact">
        <h2>Boutique & contact</h2>
        <div className="form-grid form-grid--2">
          <Text id="s-name" label="Nom de la boutique" value={s.business_name} onChange={(v) => up('business_name', v)} />
          <Text id="s-tag" label="Signature (slogan)" value={s.tagline} onChange={(v) => up('tagline', v)} />
          <Text id="s-wa" label="Numéro WhatsApp" value={s.whatsapp} onChange={(v) => up('whatsapp', v)} hint="Format international sans + ni espaces : 221771234567" />
          <Text id="s-phone" label="Téléphone affiché" value={s.phone} onChange={(v) => up('phone', v)} placeholder="+221 77 123 45 67" />
          <Text id="s-email" label="E-mail de contact" type="email" value={s.email} onChange={(v) => up('email', v)} />
          <Text id="s-addr" label="Adresse / quartier" value={s.address} onChange={(v) => up('address', v)} />
          <Text id="s-hours" label="Horaires" value={s.opening_hours} onChange={(v) => up('opening_hours', v)} placeholder="Lun–sam, 9 h – 19 h" />
          <Text id="s-url" label="Adresse du site" value={s.site_url} onChange={(v) => up('site_url', v)} placeholder="https://www.byamashop.sn" />
        </div>
        <Text id="s-ann" label="Bandeau d’annonce (haut de page)" value={s.announcement} onChange={(v) => up('announcement', v)} hint="Laissez vide pour masquer le bandeau." />
      </section>

      <section className="admin-card form-grid">
        <h2>Réseaux sociaux</h2>
        <div className="form-grid form-grid--2">
          {(['instagram', 'facebook', 'tiktok', 'snapchat'] as const).map((k) => (
            <Text key={k} id={`s-${k}`} label={k[0].toUpperCase() + k.slice(1)} value={s.socials[k]} onChange={(v) => up('socials', { ...s.socials, [k]: v.trim() })} placeholder="https://…" />
          ))}
        </div>
        <p className="field-hint">Seuls les liens renseignés apparaissent dans le pied de page.</p>
      </section>

      <section className="admin-card form-grid" id="paiement">
        <h2>Paiement</h2>
        <p className="alert"><Icon name="info" /> <span>Les paiements sont en <strong>confirmation manuelle</strong> : une commande reste « Paiement en attente » jusqu’à ce que vous la marquiez payée après vérification. Aucun paiement n’est validé automatiquement.</span></p>
        {(Object.keys(s.payments) as PaymentMethod[]).map((m) => (
          <fieldset key={m} className="pay-settings">
            <legend><label className="check"><input type="checkbox" checked={s.payments[m].enabled} onChange={(e) => pay(m, { enabled: e.target.checked })} /> <strong>{PAYMENT_METHOD_LABELS[m]}</strong></label></legend>
            {s.payments[m].enabled && (
              <div className="form-grid form-grid--2">
                {m !== 'cash_on_delivery' && <Text id={`p-${m}-n`} label="Numéro de réception" value={s.payments[m].account_number} onChange={(v) => pay(m, { account_number: v })} hint="Affiché au client après sa commande." />}
                {m !== 'cash_on_delivery' && <Text id={`p-${m}-a`} label="Au nom de" value={s.payments[m].account_name} onChange={(v) => pay(m, { account_name: v })} />}
                <div className="span-2"><Text id={`p-${m}-i`} label="Instructions au client" multiline value={s.payments[m].instructions} onChange={(v) => pay(m, { instructions: v })} /></div>
              </div>
            )}
          </fieldset>
        ))}
      </section>

      <section className="admin-card form-grid">
        <h2>Page d’accueil</h2>
        <div className="form-grid form-grid--2">
          <Text id="h-eye" label="Petit titre" value={s.hero.eyebrow} onChange={(v) => up('hero', { ...s.hero, eyebrow: v })} />
          <Text id="h-title" label="Grand titre" value={s.hero.title} onChange={(v) => up('hero', { ...s.hero, title: v })} hint="Entourez des mots d’*astérisques* pour les mettre en italique coloré." />
        </div>
        <Text id="h-sub" label="Texte d’introduction" multiline value={s.hero.subtitle} onChange={(v) => up('hero', { ...s.hero, subtitle: v })} />
        <div className="form-grid form-grid--2">
          <Text id="h-cta" label="Texte du bouton" value={s.hero.cta_label} onChange={(v) => up('hero', { ...s.hero, cta_label: v })} />
          <Text id="h-href" label="Lien du bouton" value={s.hero.cta_href} onChange={(v) => up('hero', { ...s.hero, cta_href: v })} placeholder="/boutique" />
        </div>
        <ImageField id="h-img" label="Image principale (portrait)" value={s.hero.image_url} onChange={(url) => up('hero', { ...s.hero, image_url: url ?? '' })} />
        {banner && (
          <fieldset className="pay-settings">
            <legend><label className="check"><input type="checkbox" checked={banner.enabled} onChange={(e) => up('banners', [{ ...banner, enabled: e.target.checked }])} /> <strong>Bannière promotionnelle</strong></label></legend>
            {banner.enabled && (
              <div className="form-grid form-grid--2">
                <Text id="b-eye" label="Petit titre" value={banner.eyebrow} onChange={(v) => up('banners', [{ ...banner, eyebrow: v }])} />
                <Text id="b-title" label="Titre" value={banner.title} onChange={(v) => up('banners', [{ ...banner, title: v }])} />
                <div className="span-2"><Text id="b-text" label="Texte" multiline value={banner.text} onChange={(v) => up('banners', [{ ...banner, text: v }])} /></div>
                <Text id="b-cta" label="Texte du bouton" value={banner.cta_label} onChange={(v) => up('banners', [{ ...banner, cta_label: v }])} />
                <Text id="b-href" label="Lien" value={banner.cta_href} onChange={(v) => up('banners', [{ ...banner, cta_href: v }])} placeholder="/collections/idees-cadeaux" />
                <div className="span-2"><ImageField id="b-img" label="Image (paysage)" value={banner.image_url} onChange={(url) => up('banners', [{ ...banner, image_url: url ?? '' }])} /></div>
              </div>
            )}
          </fieldset>
        )}
        <Text id="s-about" label="Texte « À propos »" multiline value={s.about} onChange={(v) => up('about', v)} hint="Séparez les paragraphes par une ligne vide." />
        <label className="check"><input type="checkbox" checked={s.wholesale.enabled} onChange={(e) => up('wholesale', { ...s.wholesale, enabled: e.target.checked })} /> Afficher la section « Revendeurs & commandes en gros »</label>
        {s.wholesale.enabled && <div className="form-grid form-grid--2"><Text id="w-t" label="Titre revendeurs" value={s.wholesale.title} onChange={(v) => up('wholesale', { ...s.wholesale, title: v })} /><Text id="w-x" label="Texte revendeurs" multiline value={s.wholesale.text} onChange={(v) => up('wholesale', { ...s.wholesale, text: v })} /></div>}
        <label className="check"><input type="checkbox" checked={s.newsletter_enabled} onChange={(e) => up('newsletter_enabled', e.target.checked)} /> Proposer l’inscription à la newsletter</label>
        <Text id="s-ret" label="Résumé retours (fiche produit)" value={s.returns_summary} onChange={(v) => up('returns_summary', v)} />
        <div className="field"><label htmlFor="s-low">Seuil d’alerte « stock bas »</label><input id="s-low" className="input" type="number" min={0} value={s.low_stock_threshold} onChange={(e) => up('low_stock_threshold', Math.max(0, Number(e.target.value)))} /></div>
      </section>

      <section className="admin-card form-grid" id="legal">
        <h2>Informations légales</h2>
        <p className="field-hint">Utilisées automatiquement dans les mentions légales et les CGV. Ne renseignez que des informations exactes et vérifiées.</p>
        <div className="form-grid form-grid--2">
          <Text id="l-rs" label="Raison sociale" value={s.legal.raison_sociale} onChange={(v) => up('legal', { ...s.legal, raison_sociale: v })} />
          <Text id="l-fj" label="Forme juridique" value={s.legal.forme_juridique} onChange={(v) => up('legal', { ...s.legal, forme_juridique: v })} placeholder="Entreprise individuelle, SARL, SUARL…" />
          <Text id="l-ninea" label="NINEA" value={s.legal.ninea} onChange={(v) => up('legal', { ...s.legal, ninea: v })} />
          <Text id="l-rccm" label="RCCM" value={s.legal.rccm} onChange={(v) => up('legal', { ...s.legal, rccm: v })} />
          <Text id="l-rp" label="Responsable de la publication" value={s.legal.responsable_publication} onChange={(v) => up('legal', { ...s.legal, responsable_publication: v })} />
        </div>
      </section>

      <div className="editor-savebar">
        <span className="small muted hide-mobile">Les modifications s’appliquent au site dès l’enregistrement.</span>
        <button className="btn btn--primary" disabled={save.isPending} data-testid="save-settings">{save.isPending ? <Spinner /> : <Icon name="check" size={18} />} Enregistrer les réglages</button>
      </div>
    </form>
  );
}

function ZoneRow({ zone, onDone }: { zone: Partial<DeliveryZone>; onDone?: () => void }) {
  const [z, setZ] = useState<Partial<DeliveryZone>>({ fee: 0, is_active: true, is_pickup: false, estimate: '', description: '', sort_order: 99, free_from: null, ...zone });
  const invalidate = useAdminInvalidate();
  const { toast } = useUi();
  const save = useMutation({
    mutationFn: () => {
      if (!(z.name ?? '').trim()) throw new ShopError('VALIDATION', 'Nom de zone obligatoire.');
      if (!Number.isInteger(z.fee) || (z.fee ?? 0) < 0) throw new ShopError('VALIDATION', 'Frais invalides.');
      return backend.admin.saveZone({ id: z.id, name: z.name!.trim(), description: z.description ?? '', fee: z.fee!, free_from: z.free_from || null, estimate: z.estimate ?? '', is_pickup: !!z.is_pickup, is_active: z.is_active ?? true, sort_order: z.sort_order ?? 0 });
    },
    onSuccess: () => { invalidate(); toast('Zone enregistrée'); onDone?.(); },
    onError: (e) => toast(e instanceof ShopError ? e.message : 'Erreur', { tone: 'error' }),
  });
  const del = useMutation({ mutationFn: () => backend.admin.deleteZone(z.id!), onSuccess: () => { invalidate(); toast('Zone supprimée'); } });
  return (
    <li className="zone-row" data-testid="zone-row">
      <input className="input input--sm" aria-label="Nom de la zone" value={z.name ?? ''} onChange={(e) => setZ({ ...z, name: e.target.value })} placeholder="Nom de la zone" />
      <label className="zr-fee"><span className="sr-only">Frais (FCFA)</span><input className="input input--sm" type="number" min={0} aria-label="Frais de livraison en FCFA" value={z.fee ?? 0} onChange={(e) => setZ({ ...z, fee: Math.floor(Number(e.target.value)) })} /><small>FCFA</small></label>
      <input className="input input--sm" aria-label="Délai indicatif" value={z.estimate ?? ''} onChange={(e) => setZ({ ...z, estimate: e.target.value })} placeholder="Délai (ex. 24 h)" />
      <label className="zr-fee"><span className="sr-only">Offerte à partir de</span><input className="input input--sm" type="number" min={0} aria-label="Livraison offerte à partir de (FCFA)" value={z.free_from ?? ''} onChange={(e) => setZ({ ...z, free_from: e.target.value ? Math.floor(Number(e.target.value)) : null })} placeholder="Offerte dès…" /></label>
      <label className="check small"><input type="checkbox" checked={!!z.is_pickup} onChange={(e) => setZ({ ...z, is_pickup: e.target.checked })} /> Retrait</label>
      <label className="check small"><input type="checkbox" checked={z.is_active ?? true} onChange={(e) => setZ({ ...z, is_active: e.target.checked })} /> Active</label>
      <span className="cluster">
        <button type="button" className="btn btn--soft btn--sm" onClick={() => save.mutate()} disabled={save.isPending}>Enregistrer</button>
        {z.id && <button type="button" className="icon-btn" aria-label={`Supprimer ${z.name}`} onClick={() => { if (window.confirm(`Supprimer la zone « ${z.name} » ? (vous pouvez aussi simplement la désactiver)`)) del.mutate(); }}><Icon name="trash" size={18} /></button>}
      </span>
    </li>
  );
}

function Zones() {
  const q = useQuery({ queryKey: ['admin', 'zones'], queryFn: () => backend.admin.listZones() });
  const [adding, setAdding] = useState(false);
  return (
    <section className="admin-card form-grid" id="livraison">
      <h2>Zones & frais de livraison</h2>
      <p className="field-hint">Les frais sont ajoutés automatiquement au panier selon la zone choisie. « Offerte dès » : livraison gratuite à partir de ce montant d’articles.</p>
      <ul className="zone-list">
        {q.data?.map((z) => <ZoneRow key={`${z.id}-${z.fee}-${z.name}-${z.is_active}`} zone={z} />)}
        {adding && <ZoneRow zone={{}} onDone={() => setAdding(false)} />}
      </ul>
      {!adding && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> Ajouter une zone</button>}
      {q.data && <p className="small muted">Aperçu : {q.data.filter((z) => z.is_active).map((z) => `${z.name} ${z.fee ? formatFCFA(z.fee) : 'gratuit'}`).join(' · ')}</p>}
    </section>
  );
}

function Pages() {
  const q = useQuery({ queryKey: ['admin', 'pages'], queryFn: () => backend.admin.listPages() });
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState(false);
  const invalidate = useAdminInvalidate();
  const { toast } = useUi();
  const page = q.data?.find((p) => p.slug === slug);
  useEffect(() => { if (!slug && q.data?.length) setSlug(q.data[0].slug); }, [q.data, slug]);
  useEffect(() => { if (page) { setBody(page.body); setTitle(page.title); } }, [page]);
  const save = useMutation({
    mutationFn: () => backend.admin.savePage({ slug, title, body, is_published: true }),
    onSuccess: () => { invalidate(); toast('Page enregistrée'); },
    onError: () => toast('Enregistrement impossible', { tone: 'error' }),
  });
  return (
    <section className="admin-card form-grid" id="pages">
      <h2>Pages légales et informations</h2>
      <p className="alert alert--warning"><Icon name="alert" /> <span>Ces textes sont des <strong>modèles</strong> à compléter (passages « À COMPLÉTER ») et à faire vérifier par un professionnel du droit avant l’ouverture.</span></p>
      <div className="form-grid form-grid--2">
        <div className="field"><label htmlFor="pg-s">Page</label><select id="pg-s" className="select" value={slug} onChange={(e) => setSlug(e.target.value)}>{q.data?.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}</select></div>
        <div className="field"><label htmlFor="pg-t">Titre</label><input id="pg-t" className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      </div>
      <div className="cluster"><button type="button" className="chip" aria-pressed={!preview} onClick={() => setPreview(false)}>Modifier</button><button type="button" className="chip" aria-pressed={preview} onClick={() => setPreview(true)}>Aperçu</button></div>
      {preview ? <div className="prose page-preview"><Markdown source={body} /></div> : (
        <div className="field">
          <label htmlFor="pg-b" className="sr-only">Contenu</label>
          <textarea id="pg-b" className="textarea mono" rows={18} value={body} onChange={(e) => setBody(e.target.value)} />
          <p className="field-hint"># Titre, ## Sous-titre, - liste, **gras**, [lien](/contact). Les {'{{nom_boutique}}'}, {'{{ninea}}'}… sont remplacés automatiquement par vos réglages.</p>
        </div>
      )}
      <div><button type="button" className="btn btn--primary btn--sm" onClick={() => save.mutate()} disabled={!slug || save.isPending}>Enregistrer la page</button> {page && <a className="btn btn--ghost btn--sm" href={`/${page.slug}`} target="_blank" rel="noopener">Voir la page</a>}</div>
    </section>
  );
}

function DemoContent() {
  const invalidate = useAdminInvalidate();
  const { toast } = useUi();
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => backend.admin.listProducts() });
  const n = products.data?.filter((p) => p.is_demo).length ?? 0;
  const remove = useMutation({
    mutationFn: () => backend.admin.removeDemoContent(),
    onSuccess: (r) => { invalidate(); toast(`${r.products} produits et ${r.collections} collections de démonstration supprimés`); },
    onError: () => toast('Suppression impossible', { tone: 'error' }),
  });
  return (
    <section className="admin-card form-grid" id="demo">
      <h2>Catalogue de démonstration</h2>
      <p>{n ? <><strong>{n} produits de démonstration</strong> (marqués « démo ») sont présents.</> : 'Aucun produit de démonstration.'} Ils servent d’exemple : remplacez-les par vos produits (une par une ou par import CSV), puis supprimez-les ici. Vos propres produits, catégories, commandes et réglages ne sont pas touchés.</p>
      <div className="cluster">
        <button type="button" className="btn btn--danger btn--sm" disabled={!n || remove.isPending} onClick={() => { if (window.confirm(`Supprimer définitivement les ${n} produits de démonstration et les collections d’exemple ?`)) remove.mutate(); }}>Supprimer le contenu de démonstration</button>
        {isDemoMode && <button type="button" className="btn btn--ghost btn--sm" onClick={() => { if (window.confirm('Réinitialiser toutes les données de ce navigateur (mode démo) ?')) { resetDemoData(); window.location.reload(); } }}>Réinitialiser la démo</button>}
      </div>
    </section>
  );
}

export default function SettingsAdmin() {
  const q = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => backend.admin.getSettings() });
  if (q.isLoading) return <PageLoader />;
  if (q.error || !q.data) return <ErrorState onRetry={() => q.refetch()} />;
  return (
    <div className="admin-page">
      <div className="admin-head"><div><h1>Réglages de la boutique</h1><p className="muted">Coordonnées, paiement, livraison, page d’accueil et pages légales.</p></div></div>
      <nav className="chips admin-tabs" aria-label="Sections">
        {[['contact', 'Contact'], ['paiement', 'Paiement'], ['livraison', 'Livraison'], ['legal', 'Légal'], ['pages', 'Pages'], ['demo', 'Démo']].map(([id, l]) => <a key={id} className="chip" href={`#${id}`}>{l}</a>)}
      </nav>
      <StoreForm initial={q.data} />
      <Zones />
      <Pages />
      <DemoContent />
    </div>
  );
}
