import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { backend } from '../backend';
import { Icon, WhatsAppIcon } from '../components/Icon';
import { useUi } from '../components/ui';
import { displayPhone, formatDateTime } from '../lib/format';
import { CONTACT_SUBJECTS } from '../lib/labels';
import { waLink } from '../lib/whatsapp';
import { PageLoader } from '../pages/states';
import { useAdminInvalidate } from './hooks';

export default function Messages() {
  const [tab, setTab] = useState<'messages' | 'newsletter'>('messages');
  const msgs = useQuery({ queryKey: ['admin', 'messages'], queryFn: () => backend.admin.listMessages() });
  const subs = useQuery({ queryKey: ['admin', 'subscribers'], queryFn: () => backend.admin.listSubscribers() });
  const invalidate = useAdminInvalidate();
  const { toast } = useUi();
  const handled = useMutation({ mutationFn: (v: { id: string; h: boolean }) => backend.admin.setMessageHandled(v.id, v.h), onSuccess: invalidate });
  const delMsg = useMutation({ mutationFn: (id: string) => backend.admin.deleteMessage(id), onSuccess: () => { invalidate(); toast('Message supprimé'); } });
  const delSub = useMutation({ mutationFn: (id: string) => backend.admin.deleteSubscriber(id), onSuccess: () => { invalidate(); toast('Contact supprimé'); } });

  const exportSubs = () => {
    const rows = (subs.data ?? []).filter((s) => !s.unsubscribed_at).map((s) => `${s.email};${s.created_at}`);
    const blob = new Blob(['﻿email;date_inscription\r\n' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'byamashop-newsletter.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  const unread = msgs.data?.filter((m) => !m.is_handled).length ?? 0;

  return (
    <div className="admin-page">
      <div className="admin-head"><div><h1>Messages</h1><p className="muted">Formulaire de contact, demandes de devis et inscriptions à la newsletter.</p></div></div>
      <div className="chips admin-tabs" role="tablist">
        <button role="tab" className="chip" aria-selected={tab === 'messages'} aria-pressed={tab === 'messages'} onClick={() => setTab('messages')}>Messages {unread > 0 && <span className="filter-count">{unread}</span>}</button>
        <button role="tab" className="chip" aria-selected={tab === 'newsletter'} aria-pressed={tab === 'newsletter'} onClick={() => setTab('newsletter')}>Newsletter ({subs.data?.filter((s) => !s.unsubscribed_at).length ?? 0})</button>
      </div>
      {tab === 'messages' ? (msgs.isLoading ? <PageLoader /> : !msgs.data?.length ? <div className="admin-card empty-state"><span className="es-icon"><Icon name="inbox" /></span><h2>Aucun message</h2></div> : (
        <ul className="message-list">
          {msgs.data.map((m) => (
            <li key={m.id} className={`admin-card ${m.is_handled ? 'is-handled' : ''}`}>
              <div className="admin-card-head">
                <div><strong>{m.name}</strong> <span className="badge badge--muted">{CONTACT_SUBJECTS[m.subject as keyof typeof CONTACT_SUBJECTS] ?? m.subject}</span><p className="small muted">{formatDateTime(m.created_at)}</p></div>
                <label className="check small"><input type="checkbox" checked={m.is_handled} onChange={(e) => handled.mutate({ id: m.id, h: e.target.checked })} /> Traité</label>
              </div>
              <p className="message-body">{m.message}</p>
              <div className="cluster">
                {m.phone && <a className="btn btn--whatsapp btn--sm" href={waLink(m.phone, `Bonjour ${m.name}, merci pour votre message à Byamashop.`)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16} /> {displayPhone(m.phone)}</a>}
                {m.phone && <a className="btn btn--ghost btn--sm" href={`tel:${m.phone}`}><Icon name="phone" size={16} /> Appeler</a>}
                {m.email && <a className="btn btn--ghost btn--sm" href={`mailto:${m.email}`}><Icon name="mail" size={16} /> {m.email}</a>}
                <button className="btn btn--ghost btn--sm" onClick={() => { if (window.confirm('Supprimer ce message ?')) delMsg.mutate(m.id); }}><Icon name="trash" size={16} /> Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )) : (
        <section className="admin-card">
          <div className="admin-card-head"><p className="small muted">Personnes ayant accepté de recevoir vos e-mails. Pour leur écrire, importez ce fichier dans un outil d’e-mailing (ex. Brevo, Mailchimp).</p>{!!subs.data?.length && <button className="btn btn--soft btn--sm" onClick={exportSubs}><Icon name="download" size={16} /> Exporter</button>}</div>
          {!subs.data?.length ? <p className="muted">Aucune inscription pour le moment.</p> : (
            <ul className="admin-list">
              {subs.data.map((s) => (
                <li key={s.id} className="admin-list-row"><span className="grow"><strong>{s.email}</strong><small>Inscrit le {formatDateTime(s.created_at)}</small></span>
                  <button className="btn btn--ghost btn--sm" onClick={() => { if (window.confirm(`Supprimer ${s.email} (désinscription / demande de suppression) ?`)) delSub.mutate(s.id); }}><Icon name="trash" size={16} /> Supprimer</button></li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
