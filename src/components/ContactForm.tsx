import { useState } from 'react';
import { backend } from '../backend';
import { CONTACT_SUBJECTS } from '../lib/labels';
import { ShopError, type ContactPayload } from '../lib/types';
import { contactSchema, fieldErrors } from '../lib/validation';
import { Icon } from './Icon';
import { Spinner } from './ui';

export function ContactForm({ defaultSubject = 'general' }: { defaultSubject?: ContactPayload['subject'] }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', subject: defaultSubject, message: '' });
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [formError, setFormError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const parsed = contactSchema.safeParse(f);
    if (!parsed.success) { setErrors(fieldErrors(parsed.error)); return; }
    setErrors({});
    setState('sending');
    try {
      await backend.submitContact({ ...f, website: hp });
      setState('sent');
    } catch (err) {
      setState('idle');
      if (err instanceof ShopError && err.code === 'VALIDATION' && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err instanceof ShopError ? err.message : 'Envoi impossible pour le moment.');
    }
  };

  if (state === 'sent') {
    return (
      <div className="alert alert--success" role="status">
        <Icon name="check-circle" />
        <span><strong>Message envoyé.</strong> Merci, nous vous répondons dès que possible.</span>
      </div>
    );
  }
  const a = (k: string) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `c-${k}-err` : undefined });
  const e = (k: string) => errors[k] && <p className="field-error" id={`c-${k}-err`}>{errors[k]}</p>;
  return (
    <form className="form-grid form-grid--2 contact-form" onSubmit={submit} noValidate>
      <div className="field span-2">
        <label htmlFor="c-name">Nom<span className="req">*</span></label>
        <input id="c-name" className="input" autoComplete="name" value={f.name} onChange={(ev) => setF({ ...f, name: ev.target.value })} {...a('name')} />
        {e('name')}
      </div>
      <div className="field">
        <label htmlFor="c-phone">Téléphone / WhatsApp</label>
        <input id="c-phone" className="input" type="tel" autoComplete="tel" value={f.phone} onChange={(ev) => setF({ ...f, phone: ev.target.value })} {...a('phone')} />
        {e('phone')}
      </div>
      <div className="field">
        <label htmlFor="c-email">E-mail</label>
        <input id="c-email" className="input" type="email" autoComplete="email" value={f.email} onChange={(ev) => setF({ ...f, email: ev.target.value })} {...a('email')} />
        {e('email')}
      </div>
      <div className="field span-2">
        <label htmlFor="c-subject">Sujet</label>
        <select id="c-subject" className="select" value={f.subject} onChange={(ev) => setF({ ...f, subject: ev.target.value as ContactPayload['subject'] })}>
          {Object.entries(CONTACT_SUBJECTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="field span-2">
        <label htmlFor="c-message">Message<span className="req">*</span></label>
        <textarea id="c-message" className="textarea" rows={5} value={f.message} onChange={(ev) => setF({ ...f, message: ev.target.value })} {...a('message')} />
        {e('message')}
      </div>
      <div className="honeypot" aria-hidden="true"><label>Site web<input tabIndex={-1} autoComplete="off" value={hp} onChange={(ev) => setHp(ev.target.value)} /></label></div>
      {formError && <p className="alert alert--danger span-2" role="alert">{formError}</p>}
      <div className="span-2"><button className="btn btn--primary" disabled={state === 'sending'}>{state === 'sending' ? <><Spinner /> Envoi…</> : 'Envoyer le message'}</button></div>
    </form>
  );
}
