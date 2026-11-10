import { useEffect, useState } from 'react';
import { Icon } from './Icon';

/** Petit bouton « Copier » (référence, numéro de paiement…) avec retour visuel et annonce aux lecteurs d'écran. */
export function CopyButton({ value, label = 'Copier', what }: { value: string; label?: string; what: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); } catch { /* presse-papiers indisponible : rien à faire */ }
  };
  return (
    <button type="button" className={`btn btn--ghost btn--sm copy-btn ${copied ? 'is-copied' : ''}`} onClick={copy} aria-label={`${label} ${what}`}>
      <Icon name={copied ? 'check' : 'copy'} size={16} /> <span aria-live="polite">{copied ? 'Copié' : label}</span>
    </button>
  );
}
