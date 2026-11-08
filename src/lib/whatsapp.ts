/** Lien WhatsApp (wa.me). Ouvrir WhatsApp ne vaut ni commande ni paiement. */
export function waLink(number: string, text?: string): string {
  const n = (number || '').replace(/\D/g, '');
  if (!n) return '';
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
