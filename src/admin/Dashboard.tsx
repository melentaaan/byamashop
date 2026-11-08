import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { backend } from '../backend';
import { Icon } from '../components/Icon';
import { formatDateTime, formatFCFA } from '../lib/format';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../lib/labels';
import { ErrorState, PageLoader } from '../pages/states';

function LaunchChecklist() {
  const settings = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => backend.admin.getSettings() });
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => backend.admin.listProducts() });
  if (!settings.data || !products.data) return null;
  const s = settings.data;
  const demoCount = products.data.filter((p) => p.is_demo).length;
  const items = [
    { ok: !!s.whatsapp, label: 'Numéro WhatsApp renseigné', to: '/admin/reglages' },
    { ok: !s.payments.wave.enabled || !!s.payments.wave.account_number, label: 'Numéro Wave de réception renseigné', to: '/admin/reglages' },
    { ok: !s.payments.orange_money.enabled || !!s.payments.orange_money.account_number, label: 'Numéro Orange Money de réception renseigné', to: '/admin/reglages' },
    { ok: !!(s.legal.raison_sociale && s.legal.ninea), label: 'Informations légales (raison sociale, NINEA…) complétées', to: '/admin/reglages' },
    { ok: !!s.email, label: 'Adresse e-mail de contact renseignée', to: '/admin/reglages' },
    { ok: demoCount === 0, label: demoCount ? `${demoCount} produits de démonstration encore en ligne` : 'Catalogue de démonstration retiré', to: '/admin/produits' },
  ];
  const remaining = items.filter((i) => !i.ok).length;
  if (!remaining) return null;
  return (
    <section className="admin-card">
      <h2>Avant l’ouverture au public <span className="badge badge--low">{remaining} à faire</span></h2>
      <ul className="checklist">
        {items.map((i) => (
          <li key={i.label} className={i.ok ? 'is-ok' : ''}>
            <Icon name={i.ok ? 'check-circle' : 'alert'} size={18} />
            {i.ok ? <span>{i.label}</span> : <Link to={i.to}>{i.label}</Link>}
          </li>
        ))}
      </ul>
      <p className="small muted">Les pages légales (CGV, confidentialité…) sont des modèles à faire vérifier par un professionnel du droit.</p>
    </section>
  );
}

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const stats = useQuery({ queryKey: ['admin', 'dashboard', days], queryFn: () => backend.admin.dashboard(days) });
  const recent = useQuery({ queryKey: ['admin', 'orders', 'recent'], queryFn: () => backend.admin.listOrders({ limit: 6 }) });
  if (stats.isLoading) return <PageLoader />;
  if (stats.error || !stats.data) return <ErrorState onRetry={() => stats.refetch()} />;
  const d = stats.data;
  const hasData = d.total_real_orders > 0;

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Tableau de bord</h1>
          <p className="muted">Uniquement vos vraies commandes (les commandes marquées « test » sont exclues).</p>
        </div>
        <label className="admin-period">
          <span className="sr-only">Période</span>
          <select className="select select--sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>3 derniers mois</option>
            <option value={365}>12 derniers mois</option>
          </select>
        </label>
      </div>

      <LaunchChecklist />

      {d.awaiting_action > 0 && (
        <Link to="/admin/commandes?statut=open" className="admin-attention">
          <Icon name="alert" /> <span><strong>{d.awaiting_action} commande{d.awaiting_action > 1 ? 's' : ''}</strong> attend{d.awaiting_action > 1 ? 'ent' : ''} une action (confirmation ou paiement).</span> <Icon name="arrow-right" size={18} />
        </Link>
      )}

      {!hasData ? (
        <section className="admin-card empty-state">
          <span className="es-icon"><Icon name="chart" /></span>
          <h2>Pas encore de commande</h2>
          <p>Les statistiques (commandes, ventes, chiffre d’affaires, produits populaires) s’afficheront ici dès vos premières commandes réelles.</p>
        </section>
      ) : (
        <div className="stat-grid">
          <div className="stat"><span>Commandes reçues</span><strong>{d.orders_received}</strong><small>{d.orders_cancelled} annulée{d.orders_cancelled > 1 ? 's' : ''}</small></div>
          <div className="stat"><span>Ventes confirmées</span><strong>{d.confirmed_sales}</strong><small>commandes payées</small></div>
          <div className="stat stat--accent"><span>Chiffre d’affaires encaissé</span><strong>{formatFCFA(d.revenue)}</strong><small>paiements confirmés</small></div>
          <div className="stat"><span>En attente de paiement</span><strong>{formatFCFA(d.pending_value)}</strong><small>non encaissé</small></div>
        </div>
      )}

      <div className="admin-columns">
        <section className="admin-card">
          <div className="admin-card-head"><h2>Dernières commandes</h2><Link to="/admin/commandes" className="link-arrow">Toutes <Icon name="arrow-right" /></Link></div>
          {recent.data?.length ? (
            <ul className="admin-list">
              {recent.data.map((o) => (
                <li key={o.id}>
                  <Link to={`/admin/commandes/${o.id}`}>
                    <span><strong>{o.reference}</strong><small>{o.customer_name} · {formatDateTime(o.created_at)}</small></span>
                    <span className="admin-list-end"><strong>{formatFCFA(o.total)}</strong>
                      <span className="cluster"><span className={`status-pill status-pill--${o.status}`}>{ORDER_STATUS_LABELS[o.status]}</span><span className={`status-pill status-pill--${o.payment_status}`}>{PAYMENT_STATUS_LABELS[o.payment_status]}</span></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="muted">Aucune commande pour le moment.</p>}
        </section>

        <div className="stack">
          <section className="admin-card">
            <h2>Produits les plus commandés</h2>
            {d.popular_products.length ? (
              <ol className="rank-list">
                {d.popular_products.map((p) => <li key={p.product_id ?? p.name}><span>{p.name}</span><strong>{p.quantity} vendu{p.quantity > 1 ? 's' : ''}</strong></li>)}
              </ol>
            ) : <p className="muted">Pas encore de données sur la période.</p>}
          </section>
          <section className="admin-card">
            <div className="admin-card-head"><h2>Stock bas</h2><Link to="/admin/produits?stock=bas" className="link-arrow">Gérer <Icon name="arrow-right" /></Link></div>
            {d.low_stock.length ? (
              <ul className="rank-list">
                {d.low_stock.slice(0, 8).map((v) => (
                  <li key={v.variant_id}>
                    <Link to={`/admin/produits/${v.product_id}`}>{v.name}{v.variant ? ` — ${v.variant}` : ''}{v.is_demo && <span className="badge badge--demo">démo</span>}</Link>
                    <strong className={v.stock === 0 ? 'text-danger' : 'text-warning'}>{v.stock === 0 ? 'Épuisé' : `${v.stock} restant${v.stock > 1 ? 's' : ''}`}</strong>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">Aucun article en stock bas.</p>}
          </section>
        </div>
      </div>

      {hasData && d.daily.length > 0 && (
        <section className="admin-card">
          <h2>Activité jour par jour</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th scope="col">Jour</th><th scope="col">Commandes</th><th scope="col">Encaissé</th></tr></thead>
              <tbody>
                {[...d.daily].reverse().slice(0, 14).map((r) => (
                  <tr key={r.day}><td>{new Date(r.day + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</td><td>{r.orders}</td><td>{formatFCFA(r.paid_revenue)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
