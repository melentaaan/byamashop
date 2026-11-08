/** Formatage français : 12 500 FCFA */
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatFCFA(amount: number): string {
  // espace fine insécable -> espace insécable classique pour une meilleure compatibilité
  return `${nf.format(Math.round(amount)).replace(/ /g, ' ')} FCFA`;
}

const df = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Dakar' });
const dtf = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Dakar' });
export const formatDate = (iso: string) => df.format(new Date(iso));
export const formatDateTime = (iso: string) => dtf.format(new Date(iso));

/** Normalise un texte pour la recherche (minuscules, sans accents). */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slugify(s: string): string {
  return normalizeText(s).replace(/\s+/g, '-').slice(0, 80).replace(/-+$/g, '');
}

/** Même règle que public.normalize_phone (SQL). Renvoie null si invalide. */
export function normalizePhone(input: string): string | null {
  let d = (input ?? '').replace(/[^0-9+]/g, '');
  if (d.startsWith('00')) d = '+' + d.slice(2);
  if (/^[0-9]{9}$/.test(d)) d = '+221' + d;
  if (/^221[0-9]{9}$/.test(d)) d = '+' + d;
  if (!/^\+[0-9]{8,15}$/.test(d)) return null;
  return d;
}

export function displayPhone(e164: string): string {
  const m = /^\+221(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+221 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}

export function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}
