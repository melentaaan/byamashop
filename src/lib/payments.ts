/**
 * Lien de paiement Wave Business, saisi par la boutique dans Réglages › Paiement.
 * N'accepte qu'une adresse https sur pay.wave.com : évite qu'une faute de frappe
 * (ou un lien piégé) envoie les clientes vers un autre site au moment de payer.
 * Le lien ouvre Wave ; le paiement reste confirmé à la main par la boutique.
 */
export function normalizeWaveLink(raw: string): string | null {
  const value = raw.trim();
  if (!value) return '';
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'pay.wave.com' || url.username || url.password) return null;
  if (url.pathname === '/' || url.pathname === '') return null;
  return url.toString();
}

/** Lien utilisable côté boutique (vide ou invalide → pas de bouton). */
export function waveLinkOrNull(raw: string | undefined): string | null {
  const v = normalizeWaveLink(raw ?? '');
  return v ? v : null;
}
