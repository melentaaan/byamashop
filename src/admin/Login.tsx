import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { backend } from '../backend';
import { DEMO_ADMIN } from '../backend/demo';
import { Icon } from '../components/Icon';
import { Seo } from '../components/Seo';
import { Spinner } from '../components/ui';
import { isDemoMode } from '../lib/config';
import { ShopError } from '../lib/types';

export function LoginPage({ notAdmin }: { notAdmin?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(notAdmin ? 'Ce compte n’a pas accès à l’administration.' : '');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (!email || !password) return setError('Indiquez votre e-mail et votre mot de passe.');
    setBusy(true);
    try {
      await backend.signIn(email.trim(), password);
      await qc.invalidateQueries({ queryKey: ['admin-user'] });
    } catch (err) {
      setError(err instanceof ShopError ? err.message : 'Connexion impossible.');
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(''); setInfo('');
    if (!email) return setError('Saisissez d’abord votre adresse e-mail ci-dessus.');
    try {
      await backend.requestPasswordReset(email.trim(), `${window.location.origin}/admin/mot-de-passe`);
      setInfo('Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé.');
    } catch (err) {
      setError(err instanceof ShopError ? err.message : 'Envoi impossible.');
    }
  };

  return (
    <div className="admin-login">
      <Seo title="Connexion administration" noindex />
      <form className="admin-login-card" onSubmit={submit} noValidate>
        <img src="/brand/logo.svg" alt="Byamashop" width={531} height={140} className="admin-login-logo" />
        <h1>Espace de gestion</h1>
        <p className="muted">Connectez-vous pour gérer vos produits, commandes et réglages.</p>
        {isDemoMode && (
          <div className="alert" role="note">
            <Icon name="info" />
            <span>Mode démonstration — identifiants : <strong>{DEMO_ADMIN.email}</strong> / <strong>{DEMO_ADMIN.password}</strong></span>
          </div>
        )}
        <div className="field">
          <label htmlFor="admin-email">Adresse e-mail</label>
          <input id="admin-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="admin-password">Mot de passe</label>
          <div className="password-field">
            <input id="admin-password" className="input" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="icon-btn" onClick={() => setShow((v) => !v)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}><Icon name={show ? 'eye-off' : 'eye'} size={20} /></button>
          </div>
        </div>
        {error && <p className="alert alert--danger" role="alert">{error}</p>}
        {info && <p className="alert alert--success" role="status">{info}</p>}
        <button className="btn btn--primary btn--lg btn--block" disabled={busy}>{busy ? <Spinner /> : 'Se connecter'}</button>
        {!isDemoMode && <button type="button" className="btn btn--ghost btn--block" onClick={forgot}>Mot de passe oublié ?</button>}
        <a href="/" className="small center muted">← Retour à la boutique</a>
      </form>
    </div>
  );
}

export function UpdatePasswordPage() {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState<{ tone: 'danger' | 'success'; text: string } | null>(null);
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) return setMsg({ tone: 'danger', text: 'Choisissez un mot de passe d’au moins 10 caractères.' });
    if (pw !== pw2) return setMsg({ tone: 'danger', text: 'Les deux mots de passe ne correspondent pas.' });
    try {
      await backend.updatePassword(pw);
      setMsg({ tone: 'success', text: 'Mot de passe modifié.' });
      setTimeout(() => navigate('/admin'), 1200);
    } catch (err) {
      setMsg({ tone: 'danger', text: err instanceof ShopError ? err.message : 'Modification impossible.' });
    }
  };
  return (
    <div className="admin-page admin-narrow">
      <h1>Changer mon mot de passe</h1>
      <form className="admin-card form-grid" onSubmit={submit}>
        <div className="field"><label htmlFor="pw1">Nouveau mot de passe</label><input id="pw1" className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw2">Confirmer</label><input id="pw2" className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        {msg && <p className={`alert alert--${msg.tone}`} role="status">{msg.text}</p>}
        <button className="btn btn--primary">Enregistrer</button>
      </form>
    </div>
  );
}
