import { ShopError } from '../lib/types';

const DEFAULT_MESSAGES: Record<string, string> = {
  OUT_OF_STOCK: 'Certains articles ne sont plus disponibles dans la quantité demandée.',
  VALIDATION: 'Certaines informations sont invalides. Vérifiez le formulaire.',
  RATE_LIMITED: 'Trop de tentatives. Merci de patienter quelques minutes.',
  INVALID_REQUEST: 'La demande est invalide. Rechargez la page et réessayez.',
  FORBIDDEN: 'Accès refusé. Votre compte n’a pas les droits nécessaires.',
  NOT_FOUND: 'Élément introuvable.',
  NETWORK: 'Connexion impossible. Vérifiez votre connexion internet et réessayez.',
  UNKNOWN: 'Une erreur inattendue est survenue. Réessayez dans un instant.',
};

export function messageFor(code: string): string {
  return DEFAULT_MESSAGES[code] ?? DEFAULT_MESSAGES.UNKNOWN;
}

interface PgLikeError { message?: string; details?: string | null; hint?: string | null; code?: string }

/** Convertit une erreur Supabase/PostgREST en erreur métier lisible. */
export function toShopError(err: unknown): ShopError {
  if (err instanceof ShopError) return err;
  const e = (err ?? {}) as PgLikeError;
  const raw = e.message ?? '';
  if (e.code === '42501' || /permission denied|row-level security/i.test(raw)) {
    return new ShopError('FORBIDDEN', messageFor('FORBIDDEN'));
  }
  if (raw in DEFAULT_MESSAGES) {
    let details: unknown = e.details ?? undefined;
    if (raw === 'OUT_OF_STOCK' && typeof e.details === 'string') {
      try { details = JSON.parse(e.details); } catch { /* ignore */ }
    }
    return new ShopError(raw, e.hint || messageFor(raw), {
      field: raw === 'VALIDATION' ? e.details ?? undefined : undefined,
      details,
    });
  }
  if (/fetch|network|Failed to fetch|NetworkError/i.test(raw)) {
    return new ShopError('NETWORK', messageFor('NETWORK'));
  }
  if (e.code === '23505') return new ShopError('VALIDATION', 'Cette valeur existe déjà (par exemple une adresse URL identique).', { field: 'slug' });
  if (e.code === '23514') return new ShopError('VALIDATION', 'Une valeur ne respecte pas le format attendu.');
  if (e.code === '23503') return new ShopError('VALIDATION', 'Cet élément est encore utilisé ailleurs.');
  console.error('[byamashop] erreur inattendue', err);
  return new ShopError('UNKNOWN', messageFor('UNKNOWN'));
}
