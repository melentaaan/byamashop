/**
 * Webhook Wave — DÉSACTIVÉ tant que WAVE_WEBHOOK_SECRET et SUPABASE_SERVICE_ROLE_KEY
 * ne sont pas configurés dans Netlify. Une commande n'est marquée « payée » que si
 * la signature est valide ET que le montant correspond exactement au total enregistré.
 */
import { parseWaveEvent, verifyWaveSignature } from './lib/wave';

export default async (req: Request) => {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  const sbUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !sbUrl || !serviceKey) return new Response('Intégration Wave non configurée', { status: 503 });
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });

  const raw = await req.text();
  if (!verifyWaveSignature(req.headers.get('wave-signature'), raw, secret)) {
    console.warn('wave-webhook: signature invalide');
    return new Response('Signature invalide', { status: 401 });
  }
  let event: unknown;
  try { event = JSON.parse(raw); } catch { return new Response('JSON invalide', { status: 400 }); }
  const payment = parseWaveEvent(event);
  if (!payment) return new Response('Ignoré', { status: 200 });

  const res = await fetch(`${sbUrl.replace(/\/$/, '')}/rest/v1/rpc/confirm_provider_payment`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_reference: payment.reference, p_amount: payment.amount, p_currency: payment.currency, p_provider: 'Wave', p_provider_ref: payment.providerRef }),
  });
  const out = await res.json().catch(() => null);
  console.info('wave-webhook', payment.reference, res.status, out);
  return new Response(res.ok ? 'OK' : 'Erreur', { status: res.ok ? 200 : 500 });
};

export const config = { path: '/api/paiements/wave/webhook' };
