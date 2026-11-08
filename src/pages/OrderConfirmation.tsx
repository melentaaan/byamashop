import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { backend } from '../backend';
import { Icon, WhatsAppIcon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { useCatalog } from '../hooks/useCatalog';
import { displayPhone, formatDateTime, formatFCFA } from '../lib/format';
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../lib/labels';
import type { OrderStatus } from '../lib/types';
import { waLink } from '../lib/whatsapp';
import { ErrorState, PageLoader } from './states';

const TRACK: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready', 'completed'];

export default function OrderConfirmation() {
  const { reference = '' } = useParams();
  const [sp] = useSearchParams();
  const token = sp.get('t') ?? '';
  const { data: catalog } = useCatalog();
  const [copied, setCopied] = useState(false);
  const q = useQuery({
    queryKey: ['order', reference, token],
    queryFn: () => backend.getOrderStatus(reference, token),
    enabled: !!reference && !!token,
    refetchInterval: 60_000,
  });

  if (!token) {
    return (
      <div className="container empty-state">
        <Seo title="Suivi de commande" noindex />
        <span className="es-icon"><Icon name="package" /></span>
        <h1>Lien de suivi incomplet</h1>
        <p>Pour protéger vos informations, le suivi d’une commande nécessite le lien complet reçu après la commande. Contactez-nous en indiquant votre référence.</p>
        <Link to="/contact" className="btn btn--primary">Nous contacter</Link>
      </div>
    );
  }
  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState title="Impossible d’afficher la commande" onRetry={() => q.refetch()} />;
  const o = q.data;
  if (!o) {
    return (
      <div className="container empty-state">
        <Seo title="Commande introuvable" noindex />
        <span className="es-icon"><Icon name="search" /></span>
        <h1>Commande introuvable</h1>
        <p>Vérifiez le lien utilisé. Si le problème persiste, contactez-nous avec votre référence.</p>
        <Link to="/contact" className="btn btn--primary">Nous contacter</Link>
      </div>
    );
  }

  const s = catalog?.settings;
  const pay = s?.payments[o.payment_method];
  const cancelled = o.status === 'cancelled';
  const step = TRACK.indexOf(o.status);
  const waText = `Bonjour Byamashop, je viens de passer la commande ${o.reference} d’un montant de ${formatFCFA(o.total)} (${PAYMENT_METHOD_LABELS[o.payment_method]}). Merci !`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(o.reference); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  return (
    <div className="container section--tight order-page">
      <Seo title={`Commande ${o.reference}`} noindex />
      <div className="confirm-hero">
        <span className="confirm-icon"><Icon name={cancelled ? 'alert' : 'check-circle'} size={34} /></span>
        <div>
          <p className="eyebrow eyebrow--plain">{formatDateTime(o.created_at)}</p>
          <h1>{cancelled ? 'Commande annulée' : `Merci ${o.customer_name.split(' ')[0]}, votre commande est enregistrée`}</h1>
          <p className="lead">
            Référence <strong className="ref" data-testid="order-reference">{o.reference}</strong>
            <button type="button" className="btn btn--ghost btn--sm" onClick={copy}><Icon name="copy" size={16} /> {copied ? 'Copiée' : 'Copier'}</button>
          </p>
          {!cancelled && <p className="muted">Nous vous contactons au {displayPhone(o.customer_phone)} pour confirmer la commande et la livraison. Conservez cette page : son adresse vous permet de suivre l’avancement.</p>}
        </div>
      </div>

      <div className="order-grid">
        <div className="stack">
          {!cancelled && (
            <section className="summary-card" aria-labelledby="status-title">
              <h2 id="status-title">Suivi</h2>
              <ol className="status-track">
                {TRACK.map((st, i) => (
                  <li key={st} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} aria-current={i === step ? 'step' : undefined}>
                    <span className="st-dot">{i < step ? <Icon name="check" size={14} /> : null}</span>
                    <span>{ORDER_STATUS_LABELS[st]}</span>
                  </li>
                ))}
              </ol>
              <dl className="status-list">
                <div><dt>Paiement</dt><dd><span className={`status-pill status-pill--${o.payment_status}`} data-testid="payment-status">{PAYMENT_STATUS_LABELS[o.payment_status]}</span></dd></div>
                <div><dt>Livraison</dt><dd><span className="status-pill">{DELIVERY_STATUS_LABELS[o.delivery_status]}</span></dd></div>
              </dl>
            </section>
          )}

          {!cancelled && o.payment_status === 'pending' && pay && (
            <section className="summary-card pay-instructions" aria-labelledby="pay-title">
              <h2 id="pay-title">Paiement : {PAYMENT_METHOD_LABELS[o.payment_method]}</h2>
              <p>{pay.instructions}</p>
              {o.payment_method !== 'cash_on_delivery' && (
                pay.account_number ? (
                  <dl className="pay-details">
                    <div><dt>Numéro {PAYMENT_METHOD_LABELS[o.payment_method]}</dt><dd><strong>{pay.account_number}</strong></dd></div>
                    {pay.account_name && <div><dt>Au nom de</dt><dd>{pay.account_name}</dd></div>}
                    <div><dt>Montant</dt><dd><strong>{formatFCFA(o.total)}</strong></dd></div>
                    <div><dt>Motif / référence</dt><dd><strong>{o.reference}</strong></dd></div>
                  </dl>
                ) : (
                  <p className="alert"><Icon name="info" /> <span>Le numéro de paiement vous sera communiqué lors de la confirmation de votre commande.</span></p>
                )
              )}
              <p className="small muted">Votre paiement apparaîtra comme « Payée » sur cette page dès que la boutique l’aura vérifié.</p>
            </section>
          )}

          {s?.whatsapp && !cancelled && (
            <section className="summary-card">
              <h2>Une question sur votre commande ?</h2>
              <p className="muted">Vous pouvez nous envoyer votre référence sur WhatsApp. Ce message sert uniquement à échanger avec nous : il ne valide ni la commande ni le paiement.</p>
              <a className="btn btn--whatsapp" href={waLink(s.whatsapp, waText)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Écrire sur WhatsApp</a>
            </section>
          )}
        </div>

        <section className="summary-card" aria-labelledby="recap-title">
          <h2 id="recap-title">Récapitulatif</h2>
          <ul className="summary-lines">
            {o.items.map((it, i) => (
              <li key={i}>
                <span className="summary-thumb">
                  <span className="thumb" style={{ width: 52, height: 65 }}>{it.image_url ? <img src={it.image_url} alt="" width={52} height={65} /> : null}</span>
                  <span className="summary-qty">{it.quantity}</span>
                </span>
                <span className="summary-name">{it.product_name}{it.variant_label && <small>{it.variant_label}</small>}</span>
                <span>{formatFCFA(it.line_total)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row"><span>Sous-total</span><span>{formatFCFA(o.subtotal)}</span></div>
          {o.discount_total > 0 && <div className="summary-row"><span>Dont remises</span><span>−{formatFCFA(o.discount_total)}</span></div>}
          <div className="summary-row"><span>Livraison ({o.delivery_zone_name})</span><span>{o.delivery_fee ? formatFCFA(o.delivery_fee) : 'Gratuit'}</span></div>
          <div className="summary-row summary-row--total"><span>Total</span><strong data-testid="order-total">{formatFCFA(o.total)}</strong></div>
          <dl className="status-list">
            <div><dt>Adresse</dt><dd>{o.delivery_address}</dd></div>
            <div><dt>Paiement</dt><dd>{PAYMENT_METHOD_LABELS[o.payment_method]}</dd></div>
          </dl>
          <Link to="/boutique" className="btn btn--secondary btn--block">Continuer mes achats</Link>
        </section>
      </div>
    </div>
  );
}
