import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { backend } from '../backend';
import type { OrderFilters } from '../backend/types';
import { Icon } from '../components/Icon';
import { formatDateTime, formatFCFA } from '../lib/format';
import { DELIVERY_STATUS_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../lib/labels';
import type { Order } from '../lib/types';
import { ErrorState, PageLoader } from '../pages/states';

export default function Orders() {
  const [sp, setSp] = useSearchParams();
  const [search, setSearch] = useState(sp.get('q') ?? '');
  const [debounced, setDebounced] = useState(search);
  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  const filters: OrderFilters = {
    search: debounced,
    status: (sp.get('statut') ?? '') as OrderFilters['status'],
    payment_status: (sp.get('paiement') ?? '') as OrderFilters['payment_status'],
    delivery_status: (sp.get('livraison') ?? '') as OrderFilters['delivery_status'],
    include_test: sp.get('tests') === '1',
  };
  const q = useQuery({ queryKey: ['admin', 'orders', filters], queryFn: () => backend.admin.listOrders(filters) });
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };

  const exportCsv = (orders: Order[]) => {
    const head = ['reference', 'date', 'client', 'telephone', 'zone', 'adresse', 'paiement', 'statut_paiement', 'statut', 'livraison', 'sous_total', 'livraison_frais', 'total'];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = orders.map((o) => [o.reference, o.created_at, o.customer_name, o.customer_phone, o.delivery_zone_name, o.delivery_address, PAYMENT_METHOD_LABELS[o.payment_method], PAYMENT_STATUS_LABELS[o.payment_status], ORDER_STATUS_LABELS[o.status], DELIVERY_STATUS_LABELS[o.delivery_status], o.subtotal, o.delivery_fee, o.total].map(esc).join(';'));
    const blob = new Blob(['﻿' + [head.join(';'), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `byamashop-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><h1>Commandes</h1><p className="muted">Chaque commande passée sur le site est enregistrée ici, avec sa référence.</p></div>
        {q.data && q.data.length > 0 && <button className="btn btn--soft btn--sm" onClick={() => exportCsv(q.data!)}><Icon name="download" size={16} /> Exporter (CSV)</button>}
      </div>
      <div className="chips admin-tabs" role="group" aria-label="Filtrer par statut">
        {[['', 'Toutes'], ['open', 'À traiter'], ['new', 'Nouvelles'], ['confirmed', 'Confirmées'], ['preparing', 'En préparation'], ['completed', 'Terminées'], ['cancelled', 'Annulées']].map(([v, l]) => (
          <button key={v} className="chip" aria-pressed={(sp.get('statut') ?? '') === v} onClick={() => setParam('statut', v)}>{l}</button>
        ))}
      </div>
      <div className="admin-filters">
        <div className="searchbox searchbox--panel">
          <Icon name="search" className="searchbox-icon" />
          <input className="searchbox-input" type="search" placeholder="Référence, nom ou téléphone" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Rechercher une commande" />
        </div>
        <select className="select select--sm" value={sp.get('paiement') ?? ''} onChange={(e) => setParam('paiement', e.target.value)} aria-label="Paiement">
          <option value="">Tous paiements</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="select select--sm" value={sp.get('livraison') ?? ''} onChange={(e) => setParam('livraison', e.target.value)} aria-label="Livraison">
          <option value="">Toutes livraisons</option>
          {Object.entries(DELIVERY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="check small"><input type="checkbox" checked={filters.include_test} onChange={(e) => setParam('tests', e.target.checked ? '1' : '')} /> Inclure les tests</label>
      </div>
      {q.isLoading ? <PageLoader /> : q.error ? <ErrorState onRetry={() => q.refetch()} /> : !q.data?.length ? (
        <div className="admin-card empty-state"><span className="es-icon"><Icon name="package" /></span><h2>Aucune commande</h2><p>Aucune commande ne correspond à ces critères.</p></div>
      ) : (
        <ul className="admin-list admin-list--orders" data-testid="admin-orders">
          {q.data.map((o) => (
            <li key={o.id}>
              <Link to={`/admin/commandes/${o.id}`}>
                <span>
                  <strong>{o.reference}</strong> {o.is_test && <span className="badge badge--muted">test</span>}
                  <small>{o.customer_name} · {o.customer_phone}</small>
                  <small>{formatDateTime(o.created_at)} · {o.delivery_zone_name} · {PAYMENT_METHOD_LABELS[o.payment_method]}</small>
                </span>
                <span className="admin-list-end">
                  <strong>{formatFCFA(o.total)}</strong>
                  <span className="cluster">
                    <span className={`status-pill status-pill--${o.status}`}>{ORDER_STATUS_LABELS[o.status]}</span>
                    <span className={`status-pill status-pill--${o.payment_status}`}>{PAYMENT_STATUS_LABELS[o.payment_status]}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
