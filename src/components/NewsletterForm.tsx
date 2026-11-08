import { useId, useState } from 'react';
import { backend } from '../backend';
import { ShopError } from '../lib/types';
import { Spinner } from './ui';

export function NewsletterForm({ dark }: { dark?: boolean }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState('');
  const [hp, setHp] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!consent) return setError('Merci de cocher la case de consentement.');
    setState('loading');
    try {
      await backend.subscribeNewsletter(email, consent, hp);
      setState('done');
    } catch (err) {
      setState('idle');
      setError(err instanceof ShopError ? err.message : 'Inscription impossible pour le moment.');
    }
  };

  if (state === 'done') return <p className={`newsletter-done ${dark ? 'on-dark' : ''}`} role="status">Merci ! Votre inscription est enregistrée.</p>;
  return (
    <form className={`newsletter-form ${dark ? 'on-dark' : ''}`} onSubmit={submit} noValidate>
      <div className="newsletter-row">
        <label htmlFor={id} className="sr-only">Adresse e-mail</label>
        <input id={id} className="input" type="email" required placeholder="Votre adresse e-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <button className="btn btn--light" disabled={state === 'loading'}>{state === 'loading' ? <Spinner /> : 'S’inscrire'}</button>
      </div>
      <div className="honeypot" aria-hidden="true"><label>Site web<input tabIndex={-1} value={hp} onChange={(e) => setHp(e.target.value)} autoComplete="off" /></label></div>
      <label className="check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>J’accepte de recevoir les actualités et offres de la boutique par e-mail. <a href="/confidentialite">En savoir plus</a></span>
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  );
}
