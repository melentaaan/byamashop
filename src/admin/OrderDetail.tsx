import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { backend } from '../backend';
import type { OrderUpdate } from '../backend/types';
import { Icon, WhatsAppIcon } from '../components/Icon';
import { useUi } from '../components/ui';
import { absoluteUrl } from '../components/Seo';
import { displayPhone, formatDateTime, formatFCFA } from '../lib/format';
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../lib/labels';
import { ShopError, type OrderWithItems } from '../lib/types';
import { waLink } from '../lib/whatsapp';
import { ErrorState, PageLoader } from '../pages/states';
import { useAdminInvalidate } from './hooks';

const EVENT_LABEL: Record<string, string> = { created: 'Commande créée', status: 'Statut', payment: 'Paiement', delivery: 'Livraison', note: 'Note', stock_released: 'Stock' };
const labelFor = (kind: string, v: string | null) =>
  !v ? '' : kind === 'payment' ? PAYMENT_STATUS_LABELS[v as keyof typeof PAYMENT_STATUS_LABELS] ?? v
    : kind === 'delivery' ? DELIVERY_STATUS_LABELS[v as keyof typeof DELIVERY_STATUS_LABELS] ?? v
    : ORDER_STATUS_LABELS[v as keyof typeof ORDER_STATUS_LABELS] ?? v;

function waTemplates(o: OrderWithItems, payNumber: string) {
  const first = o.customer_name.split(' ')[0];
  const items = o.items.map((i) => `• ${i.quantity} × ${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ''}`).join('\n');
  return [
    { label: 'Confirmer la commande', text: `Bonjour ${first}, merci pour votre commande ${o.reference} chez Byamashop :\n${items}\nTotal : ${formatFCFA(o.total)} (livraison ${o.delivery_zone_name} incluse).\nNous vous confirmons la disponibilité des articles.` },
    ...(o.payment_method !== 'cash_on_delivery' && o.payment_status === 'pending' ? [{
      label: 'Envoyer les instructions de paiement',
      text: `Bonjour ${first}, pour régler votre commande ${o.reference} (${formatFCFA(o.total)}) par ${PAYMENT_METHOD_LABELS[o.payment_method]}${payNumber ? `, merci d’envoyer le montant au ${payNumber}` : ''} en indiquant la référence ${o.reference}. Nous vous confirmons dès réception.`,
    }] : []),
    { label: 'Paiement reçu', text: `Bonjour ${first}, nous avons bien reçu votre paiement pour la commande ${o.reference}. Merci ! Nous préparons votre colis.` },
    { label: 'Commande en route', text: `Bonjour ${first}, votre commande ${o.reference} est en cours de livraison. Le livreur vous contactera au ${displayPhone(o.customer_phone)}.` },
  ];
}

export default function OrderDetail() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['admin', 'order', id], queryFn: () => backend.admin.getOrder(id) });
  const settings = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => backend.admin.getSettings() });
  const invalidate = useAdminInvalidate();
  const { toast } = useUi();
  const [note, setNote] = useState('');
  const [payRef, setPayRef] = useState('');
  const [adminNote, setAdminNote] = useState('');
  useEffect(() => { if (q.data) { setAdminNote(q.data.admin_note ?? ''); setPayRef(q.data.payment_reference ?? ''); } }, [q.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useMutation({
    mutationFn: (u: OrderUpdate) => backend.admin.updateOrder(id, u),
    onSuccess: () => { invalidate(); toast('Commande mise à jour'); setNote(''); },
    onError: (e) => toast(e instanceof ShopError ? e.message : 'Mise à jour impossible', { tone: 'error' }),
  });
  const flags = useMutation({
    mutationFn: (f: { is_test?: boolean; admin_note?: string | null }) => backend.admin.setOrderFlags(id, f),
    onSuccess: () => { invalidate(); toast('Enregistré'); },
    onError: () => toast('Enregistrement impossible', { tone: 'error' }),
  });

  if (q.isLoading) return <PageLoader />;
  if (q.error) return <ErrorState onRetry={() => q.refetch()} />;
  const o = q.data;
  if (!o) return <div className="admin-page"><p>Commande introuvable. <Link to="/admin/commandes">Retour</Link></p></div>;
  const cancelled = o.status === 'cancelled';
  const payNumber = settings.data?.payments[o.payment_method]?.account_number ?? '';
  const busy = update.isPending;

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <Link to="/admin/commandes" className="back-link"><Icon name="arrow-left" size={16} /> Commandes</Link>
          <h1>Commande {o.reference} {o.is_test && <span className="badge badge--muted">test</span>}</h1>
          <p className="muted">Passée le {formatDateTime(o.created_at)}</p>
        </div>
        <div className="cluster">
          <span className={`status-pill status-pill--${o.status}`}>{ORDER_STATUS_LABELS[o.status]}</span>
          <span className={`status-pill status-pill--${o.payment_status}`} data-testid="admin-payment-status">{PAYMENT_STATUS_LABELS[o.payment_status]}</span>
          <span className={`status-pill status-pill--${o.delivery_status}`}>{DELIVERY_STATUS_LABELS[o.delivery_status]}</span>
        </div>
      </div>

      {!cancelled && (
        <section className="admin-card quick-actions" aria-label="Actions rapides">
          <h2>Étape suivante</h2>
          <div className="cluster">
            {o.status === 'new' && <button className="btn btn--primary btn--sm" disabled={busy} onClick={() => update.mutate({ status: 'confirmed' })}><Icon name="check" size={16} /> Confirmer la commande</button>}
            {o.payment_status !== 'paid' && (
              <button className="btn btn--primary btn--sm" disabled={busy} data-testid="mark-paid"
                onClick={() => { if (window.confirm(`Confirmez-vous avoir reçu ${formatFCFA(o.total)} pour ${o.reference} ?`)) update.mutate({ payment_status: 'paid', payment_reference: payRef }); }}>
                <Icon name="wallet" size={16} /> Marquer comme payée
              </button>
            )}
            {['confirmed', 'new'].includes(o.status) && <button className="btn btn--soft btn--sm" disabled={busy} onClick={() => update.mutate({ status: 'preparing' })}>En préparation</button>}
            {o.delivery_status === 'pending' && <button className="btn btn--soft btn--sm" disabled={busy} onClick={() => update.mutate({ delivery_status: 'in_transit', status: o.status === 'new' ? 'confirmed' : o.status === 'confirmed' || o.status === 'preparing' ? 'ready' : undefined })}>Expédiée / en livraison</button>}
            {o.delivery_status !== 'delivered' && <button className="btn btn--soft btn--sm" disabled={busy} onClick={() => update.mutate({ delivery_status: 'delivered' })}>Livrée</button>}
            {o.status !== 'completed' && <button className="btn btn--soft btn--sm" disabled={busy} onClick={() => update.mutate({ status: 'completed' })}>Terminer</button>}
            <button className="btn btn--danger btn--sm" disabled={busy} data-testid="cancel-order"
              onClick={() => { if (window.confirm('Annuler cette commande ? Les articles seront remis en stock. Cette action est définitive.')) update.mutate({ status: 'cancelled' }); }}>Annuler</button>
          </div>
          <p className="small muted">« Marquer comme payée » uniquement après avoir vérifié la réception de l’argent (Wave, Orange Money ou espèces).</p>
        </section>
      )}

      <div className="admin-columns">
        <div className="stack">
          <section className="admin-card">
            <h2>Articles</h2>
            <ul className="summary-lines">
              {o.items.map((it) => (
                <li key={it.id}>
                  <span className="summary-thumb"><span className="thumb" style={{ width: 52, height: 65 }}>{it.image_url && <img src={it.image_url} alt="" />}</span><span className="summary-qty">{it.quantity}</span></span>
                  <span className="summary-name">{it.product_id ? <Link to={`/admin/produits/${it.product_id}`}>{it.product_name}</Link> : it.product_name}{it.variant_label && <small>{it.variant_label}</small>}<small>{formatFCFA(it.unit_price)} / unité{it.base_price !== it.unit_price ? ` (au lieu de ${formatFCFA(it.base_price)})` : ''}</small></span>
                  <span>{formatFCFA(it.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="summary-row"><span>Sous-total</span><span>{formatFCFA(o.subtotal)}</span></div>
            <div className="summary-row"><span>Livraison ({o.delivery_zone_name})</span><span>{formatFCFA(o.delivery_fee)}</span></div>
            <div className="summary-row summary-row--total"><span>Total</span><strong>{formatFCFA(o.total)}</strong></div>
          </section>

          <section className="admin-card form-grid">
            <h2>Modifier les statuts</h2>
            <StatusForm order={o} busy={busy} onSubmit={(u) => update.mutate(u)} />
            <div className="field">
              <label htmlFor="pay-ref">Référence de la transaction (Wave / Orange Money)</label>
              <div className="cluster"><input id="pay-ref" className="input" value={payRef} onChange={(e) => setPayRef(e.target.value)} style={{ flex: 1 }} /><button className="btn btn--soft btn--sm" onClick={() => update.mutate({ payment_reference: payRef })}>Enregistrer</button></div>
            </div>
            <div className="field">
              <label htmlFor="ev-note">Ajouter une note à l’historique</label>
              <div className="cluster"><input id="ev-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 1 }} /><button className="btn btn--soft btn--sm" disabled={!note.trim()} onClick={() => update.mutate({ note })}>Ajouter</button></div>
            </div>
          </section>

          <section className="admin-card">
            <h2>Historique</h2>
            <ol className="timeline">
              {(o.events ?? []).map((e) => (
                <li key={e.id}>
                  <span className="small muted">{formatDateTime(e.created_at)}</span>
                  <span><strong>{EVENT_LABEL[e.kind] ?? e.kind}</strong>{e.from_value || e.to_value ? ` : ${labelFor(e.kind, e.from_value) || '—'} → ${labelFor(e.kind, e.to_value)}` : ''}{e.note ? ` — ${e.note}` : ''}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="stack">
          <section className="admin-card">
            <h2>Client</h2>
            <dl className="status-list">
              <div><dt>Nom</dt><dd>{o.customer_name}</dd></div>
              <div><dt>Téléphone</dt><dd><a href={`tel:${o.customer_phone}`}>{displayPhone(o.customer_phone)}</a></dd></div>
              {o.customer_email && <div><dt>E-mail</dt><dd><a href={`mailto:${o.customer_email}`}>{o.customer_email}</a></dd></div>}
              <div><dt>Zone</dt><dd>{o.delivery_zone_name}</dd></div>
              <div><dt>Adresse</dt><dd>{o.delivery_address}</dd></div>
              {o.delivery_notes && <div><dt>Repère</dt><dd>{o.delivery_notes}</dd></div>}
              <div><dt>Paiement</dt><dd>{PAYMENT_METHOD_LABELS[o.payment_method]}</dd></div>
            </dl>
            {o.customer_note && <p className="alert"><Icon name="chat" /> <span><strong>Message du client :</strong> {o.customer_note}</span></p>}
          </section>

          <section className="admin-card">
            <h2>Écrire au client sur WhatsApp</h2>
            <p className="small muted">Ouvre WhatsApp avec un message prérempli. Cela ne change aucun statut.</p>
            <div className="wa-templates">
              {waTemplates(o, payNumber).map((t) => (
                <a key={t.label} className="btn btn--whatsapp btn--sm" href={waLink(o.customer_phone, t.text)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16} /> {t.label}</a>
              ))}
              <a className="btn btn--ghost btn--sm" href={waLink(o.customer_phone)} target="_blank" rel="noopener noreferrer">Message libre</a>
            </div>
          </section>

          <section className="admin-card form-grid">
            <h2>Notes internes</h2>
            <textarea className="textarea" rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} aria-label="Note interne (non visible par le client)" />
            <button className="btn btn--soft btn--sm" onClick={() => flags.mutate({ admin_note: adminNote || null })}>Enregistrer la note</button>
            <label className="check"><input type="checkbox" checked={o.is_test} onChange={(e) => flags.mutate({ is_test: e.target.checked })} /> Commande de test (exclue des statistiques)</label>
            <p className="small muted">Lien de suivi envoyé au client : il est affiché uniquement sur son appareil après la commande. <span className="hide-mobile">Site : {absoluteUrl('/')}</span></p>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusForm({ order, busy, onSubmit }: { order: OrderWithItems; busy: boolean; onSubmit: (u: OrderUpdate) => void }) {
  const [status, setStatus] = useState(order.status);
  const [pay, setPay] = useState(order.payment_status);
  const [del, setDel] = useState(order.delivery_status);
  useEffect(() => { setStatus(order.status); setPay(order.payment_status); setDel(order.delivery_status); }, [order.status, order.payment_status, order.delivery_status]);
  const changed = status !== order.status || pay !== order.payment_status || del !== order.delivery_status;
  return (
    <div className="form-grid form-grid--3">
      <div className="field"><label htmlFor="st">Commande</label>
        <select id="st" className="select" value={status} disabled={order.status === 'cancelled'} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select></div>
      <div className="field"><label htmlFor="ps">Paiement</label>
        <select id="ps" className="select" value={pay} onChange={(e) => setPay(e.target.value as typeof pay)}>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select></div>
      <div className="field"><label htmlFor="ds">Livraison</label>
        <select id="ds" className="select" value={del} onChange={(e) => setDel(e.target.value as typeof del)}>
          {Object.entries(DELIVERY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select></div>
      <div className="span-all">
        <button className="btn btn--primary btn--sm" disabled={!changed || busy} onClick={() => {
          if (status === 'cancelled' && !window.confirm('Annuler cette commande ? Les articles seront remis en stock. Cette action est définitive.')) return;
          onSubmit({ status: status !== order.status ? status : undefined, payment_status: pay !== order.payment_status ? pay : undefined, delivery_status: del !== order.delivery_status ? del : undefined });
        }}>Mettre à jour les statuts</button>
      </div>
    </div>
  );
}
