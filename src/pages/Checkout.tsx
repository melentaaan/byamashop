import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { backend } from '../backend';
import { Icon } from '../components/Icon';
import { ProductThumb } from '../components/ProductImage';
import { Seo } from '../components/Seo';
import { Spinner } from '../components/ui';
import { CATALOG_KEY, useCatalog, useCart, variantLabel } from '../hooks/useCatalog';
import { cart } from '../lib/cart';
import { isDemoMode } from '../lib/config';
import { formatFCFA } from '../lib/format';
import { PAYMENT_METHOD_LABELS } from '../lib/labels';
import { clearIdempotencyKey, idempotencyKeyFor, rememberOrder } from '../lib/orders-local';
import { orderTotals } from '../lib/pricing';
import { ShopError, type PaymentMethod } from '../lib/types';
import { checkoutSchema, fieldErrors } from '../lib/validation';
import { PageLoader } from './states';

const DRAFT_KEY = 'byamashop_checkout_draft';
interface Draft { name: string; phone: string; email: string; zone_id: string; address: string; notes: string; payment_method: PaymentMethod | ''; note: string }
const emptyDraft: Draft = { name: '', phone: '', email: '', zone_id: '', address: '', notes: '', payment_method: '', note: '' };

function loadDraft(): Draft {
  try { return { ...emptyDraft, ...(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}') as Partial<Draft>) }; } catch { return emptyDraft; }
}

export default function Checkout() {
  const { data: catalog, isLoading } = useCatalog();
  const { lines, subtotal, hasIssues } = useCart();
  const [f, setF] = useState<Draft>(loadDraft);
  const [accept, setAccept] = useState(false);
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(f)); } catch { /* ignore */ } }, [f]);

  const zones = catalog?.zones ?? [];
  const zone = zones.find((z) => z.id === f.zone_id) ?? null;
  const methods = catalog ? (Object.keys(catalog.settings.payments) as PaymentMethod[]).filter((m) => catalog.settings.payments[m].enabled) : [];
  const totals = orderTotals(subtotal, zone);
  const signature = useMemo(() => lines.map((l) => `${l.variantId}x${l.quantity}`).sort().join('|'), [lines]);

  useEffect(() => {
    if (!f.payment_method && methods.length === 1) setF((d) => ({ ...d, payment_method: methods[0] }));
  }, [methods.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading && !catalog) return <PageLoader />;
  if (!catalog) return null;

  if (lines.length === 0 && !submitting) {
    return (
      <div className="container empty-state">
        <Seo title="Commande" noindex />
        <span className="es-icon"><Icon name="bag" /></span>
        <h1>Votre panier est vide</h1>
        <p>Ajoutez des articles avant de passer commande.</p>
        <Link to="/boutique" className="btn btn--primary">Découvrir la boutique</Link>
      </div>
    );
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setF((d) => ({ ...d, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: '' })); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return; // protection contre le double clic
    setFormError('');
    const parsed = checkoutSchema.safeParse({ ...f, accept_terms: accept });
    const errs = parsed.success ? {} : fieldErrors(parsed.error);
    if (zone && !zone.is_pickup && f.address.trim().length < 4) errs.address = 'Indiquez votre adresse ou quartier de livraison.';
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    if (hasIssues) { setFormError('Certains articles ne sont plus disponibles. Ajustez votre panier.'); return; }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await backend.placeOrder({
        idempotency_key: idempotencyKeyFor(signature),
        customer: { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() },
        delivery: { zone_id: f.zone_id, address: f.address.trim(), notes: f.notes.trim() },
        payment_method: f.payment_method as PaymentMethod,
        note: f.note.trim(),
        accept_terms: accept,
        items: lines.filter((l) => l.issue !== 'unavailable').map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
        website: hp,
      });
      rememberOrder({ reference: res.reference, token: res.access_token, total: res.total, created_at: new Date().toISOString() });
      clearIdempotencyKey();
      cart.clear();
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      await qc.invalidateQueries({ queryKey: CATALOG_KEY });
      navigate(`/commande/confirmation/${res.reference}?t=${res.access_token}`, { replace: true });
    } catch (err) {
      const se = err instanceof ShopError ? err : new ShopError('UNKNOWN', 'Une erreur est survenue.');
      if (se.code === 'OUT_OF_STOCK') {
        await qc.invalidateQueries({ queryKey: CATALOG_KEY });
        setFormError('Le stock a changé pendant votre commande : certains articles ne sont plus disponibles dans la quantité demandée. Votre panier a été mis à jour, vérifiez-le puis validez à nouveau.');
      } else if (se.code === 'VALIDATION' && se.field) {
        const key = ({ 'customer.name': 'name', 'customer.phone': 'phone', 'customer.email': 'email', 'delivery.zone_id': 'zone_id', 'delivery.address': 'address', payment_method: 'payment_method', accept_terms: 'accept_terms' } as Record<string, string>)[se.field] ?? 'form';
        if (key === 'form') setFormError(se.message); else setErrors({ [key]: se.message });
      } else if (se.code === 'NETWORK') {
        setFormError('La connexion a été interrompue. Votre commande n’a peut-être pas été enregistrée : réessayez, elle ne sera pas créée deux fois.');
      } else {
        setFormError(se.message);
      }
      window.setTimeout(() => errorRef.current?.focus(), 0);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const err = (k: string) => errors[k] ? <p className="field-error" id={`${k}-error`}>{errors[k]}</p> : null;
  const aria = (k: string) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `${k}-error` : undefined });

  return (
    <div className="container section--tight checkout">
      <Seo title="Finaliser ma commande" path="/commande" noindex />
      <nav className="breadcrumbs" aria-label="Fil d’Ariane"><ol><li><Link to="/panier">Panier</Link></li><li><span aria-current="page">Commande</span></li></ol></nav>
      <h1 className="page-title">Finaliser ma commande</h1>
      {isDemoMode && (
        <p className="alert alert--warning"><Icon name="info" /> <span><strong>Mode démonstration :</strong> la commande sera enregistrée uniquement dans ce navigateur et ne sera pas transmise à la boutique.</span></p>
      )}

      <form className="checkout-grid" onSubmit={submit} noValidate>
        <div className="checkout-main">
          <section className="checkout-step" aria-labelledby="step-contact">
            <h2 id="step-contact"><span className="step-num">1</span> Vos coordonnées</h2>
            <div className="form-grid form-grid--2">
              <div className="field span-2">
                <label htmlFor="name">Nom complet<span className="req" aria-hidden="true">*</span></label>
                <input id="name" className="input" autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} required {...aria('name')} />
                {err('name')}
              </div>
              <div className="field">
                <label htmlFor="phone">Téléphone (WhatsApp de préférence)<span className="req" aria-hidden="true">*</span></label>
                <input id="phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="77 123 45 67" value={f.phone} onChange={(e) => set('phone', e.target.value)} required {...aria('phone')} />
                {err('phone') ?? <p className="field-hint">Nous vous appelons ou écrivons pour confirmer la commande.</p>}
              </div>
              <div className="field">
                <label htmlFor="email">E-mail <span className="muted">(facultatif)</span></label>
                <input id="email" className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} {...aria('email')} />
                {err('email')}
              </div>
            </div>
          </section>

          <section className="checkout-step" aria-labelledby="step-delivery">
            <h2 id="step-delivery"><span className="step-num">2</span> Livraison</h2>
            <fieldset className="radio-cards" {...aria('zone_id')}>
              <legend className="field-label">Zone de livraison<span className="req" aria-hidden="true">*</span></legend>
              {zones.map((z) => {
                const fee = orderTotals(subtotal, z).deliveryFee;
                return (
                  <label key={z.id} className="radio-card">
                    <input type="radio" name="zone" value={z.id} checked={f.zone_id === z.id} onChange={() => set('zone_id', z.id)} />
                    <span>
                      <strong>{z.name}</strong>
                      <small>{[z.estimate, z.description].filter(Boolean).join(' · ')}{z.free_from && fee > 0 ? ` · offerte dès ${formatFCFA(z.free_from)}` : ''}</small>
                    </span>
                    <span className="rc-aside">{fee ? formatFCFA(fee) : 'Gratuit'}</span>
                  </label>
                );
              })}
              {err('zone_id')}
            </fieldset>
            {(!zone || !zone.is_pickup) && (
              <div className="form-grid" style={{ marginTop: 16 }}>
                <div className="field">
                  <label htmlFor="address">Adresse / quartier<span className="req" aria-hidden="true">*</span></label>
                  <input id="address" className="input" autoComplete="street-address" placeholder="Ex. Sacré-Cœur 3, villa 12" value={f.address} onChange={(e) => set('address', e.target.value)} {...aria('address')} />
                  {err('address')}
                </div>
                <div className="field">
                  <label htmlFor="notes">Point de repère <span className="muted">(facultatif)</span></label>
                  <input id="notes" className="input" placeholder="Ex. en face de la pharmacie" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
                </div>
              </div>
            )}
          </section>

          <section className="checkout-step" aria-labelledby="step-payment">
            <h2 id="step-payment"><span className="step-num">3</span> Paiement</h2>
            <fieldset className="radio-cards" {...aria('payment_method')}>
              <legend className="sr-only">Moyen de paiement</legend>
              {methods.map((m) => (
                <label key={m} className="radio-card">
                  <input type="radio" name="payment" value={m} checked={f.payment_method === m} onChange={() => set('payment_method', m)} />
                  <span>
                    <strong>{PAYMENT_METHOD_LABELS[m]}</strong>
                    <small>{m === 'cash_on_delivery' ? 'En espèces, à la réception' : 'Paiement mobile, confirmé par notre équipe'}</small>
                  </span>
                  <span className={`pay-logo pay-logo--${m}`} aria-hidden="true">{m === 'wave' ? 'W' : m === 'orange_money' ? 'OM' : <Icon name="wallet" size={18} />}</span>
                </label>
              ))}
              {err('payment_method')}
            </fieldset>
            {f.payment_method && (
              <p className="alert"><Icon name="info" /> <span>{catalog.settings.payments[f.payment_method as PaymentMethod].instructions} Les instructions détaillées s’affichent après validation.</span></p>
            )}
            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="note">Message pour la boutique <span className="muted">(facultatif)</span></label>
              <textarea id="note" className="textarea" rows={3} value={f.note} onChange={(e) => set('note', e.target.value)} />
            </div>
          </section>
        </div>

        <aside className="checkout-aside">
          <div className="summary-card">
            <h2>Votre commande</h2>
            <ul className="summary-lines">
              {lines.filter((l) => l.product).map((l) => (
                <li key={l.variantId}>
                  <span className="summary-thumb"><ProductThumb product={l.product!} size={52} /><span className="summary-qty">{l.quantity}</span></span>
                  <span className="summary-name">{l.product!.name}{l.variant && variantLabel(l.product!, l.variant) && <small>{variantLabel(l.product!, l.variant)}</small>}</span>
                  <span>{formatFCFA(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="summary-row"><span>Sous-total</span><span data-testid="checkout-subtotal">{formatFCFA(totals.subtotal)}</span></div>
            <div className="summary-row"><span>Livraison{zone ? ` (${zone.name})` : ''}</span><span data-testid="checkout-delivery">{zone ? (totals.deliveryFee ? formatFCFA(totals.deliveryFee) : 'Gratuit') : '—'}</span></div>
            <div className="summary-row summary-row--total"><span>Total</span><strong data-testid="checkout-total">{formatFCFA(totals.total)}</strong></div>

            <div className="honeypot" aria-hidden="true"><label>Site web<input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></label></div>
            <label className="check terms-check">
              <input type="checkbox" checked={accept} onChange={(e) => { setAccept(e.target.checked); setErrors((x) => ({ ...x, accept_terms: '' })); }} {...aria('accept_terms')} />
              <span>J’ai lu et j’accepte les <Link to="/conditions-generales-de-vente" target="_blank">conditions générales de vente</Link> et la <Link to="/confidentialite" target="_blank">politique de confidentialité</Link>.</span>
            </label>
            {err('accept_terms')}
            <div ref={errorRef} tabIndex={-1}>{formError && <p className="alert alert--danger" role="alert"><Icon name="alert" /> <span>{formError}</span></p>}</div>
            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting} data-testid="place-order">
              {submitting ? <><Spinner /> Envoi en cours…</> : <>Valider ma commande · {formatFCFA(totals.total)}</>}
            </button>
            <p className="small muted center">Aucun paiement n’est prélevé à cette étape. Vous recevez une référence de commande et les instructions de paiement.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
