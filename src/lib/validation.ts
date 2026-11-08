import { z } from 'zod';
import { normalizePhone } from './format';

/** Validation côté navigateur (la base revalide tout côté serveur). */
export const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom complet.').max(120, 'Nom trop long.'),
  phone: z.string().trim().refine((v) => normalizePhone(v) !== null, 'Numéro invalide. Exemple : 77 123 45 67'),
  email: z.string().trim().max(200).refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Adresse e-mail invalide.'),
  zone_id: z.string().min(1, 'Choisissez une zone de livraison.'),
  address: z.string().trim().max(300, 'Adresse trop longue.'),
  notes: z.string().trim().max(500, 'Texte trop long.'),
  payment_method: z.enum(['wave', 'orange_money', 'cash_on_delivery'], { message: 'Choisissez un moyen de paiement.' }),
  note: z.string().trim().max(1000, 'Texte trop long.'),
  accept_terms: z.literal(true, { message: 'Veuillez accepter les conditions générales de vente.' }),
});

export type CheckoutForm = z.input<typeof checkoutSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(120),
  phone: z.string().trim().refine((v) => v === '' || normalizePhone(v) !== null, 'Numéro invalide.'),
  email: z.string().trim().refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Adresse e-mail invalide.'),
  subject: z.enum(['general', 'commande', 'gros', 'produit', 'autre']),
  message: z.string().trim().min(5, 'Votre message est trop court.').max(3000, 'Message trop long (3000 caractères max).'),
}).refine((v) => v.phone !== '' || v.email !== '', { message: 'Indiquez un téléphone ou un e-mail pour que nous puissions vous répondre.', path: ['phone'] });
