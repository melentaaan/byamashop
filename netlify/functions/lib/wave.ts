import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Vérification de la signature des webhooks Wave (en-tête « Wave-Signature: t=…,v1=… »).
 * Signature = HMAC-SHA256(secret, timestamp + corps brut), en hexadécimal.
 * ⚠️ Format à confirmer avec la documentation Wave Business au moment de l'activation.
 */
export function verifyWaveSignature(header: string | null, rawBody: string, secret: string, nowSec = Math.floor(Date.now() / 1000), toleranceSec = 300): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.trim().split('=') as [string, string]));
  const t = Number(parts.t);
  const sigs = header.split(',').map((kv) => kv.trim()).filter((kv) => kv.startsWith('v1=')).map((kv) => kv.slice(3));
  if (!Number.isFinite(t) || !sigs.length) return false;
  if (Math.abs(nowSec - t) > toleranceSec) return false;
  const expected = createHmac('sha256', secret).update(`${t}${rawBody}`).digest('hex');
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export interface WaveCheckoutCompleted {
  type: string;
  data: { id: string; amount: string; currency: string; client_reference: string | null; payment_status: string; transaction_id?: string };
}

/** Extrait un paiement réussi d'un événement Wave, sinon null. */
export function parseWaveEvent(body: unknown): { reference: string; amount: number; currency: string; providerRef: string } | null {
  const e = body as WaveCheckoutCompleted;
  if (!e || e.type !== 'checkout.session.completed' || e.data?.payment_status !== 'succeeded') return null;
  const amount = Number(e.data.amount);
  if (!e.data.client_reference || !Number.isInteger(amount)) return null;
  return { reference: e.data.client_reference, amount, currency: e.data.currency, providerRef: e.data.transaction_id ?? e.data.id };
}
