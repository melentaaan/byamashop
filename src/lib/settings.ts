import type { StoreSettings } from './types';
import { defaultSettings } from '../data/demo/settings';

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObj(base) || !isObj(patch)) return (patch === undefined || patch === null ? base : (patch as T));
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = isObj(b) && isObj(v) ? deepMerge(b, v) : v === undefined || v === null ? b : v;
  }
  return out as T;
}

/** Complète les réglages enregistrés avec les valeurs par défaut (nouveaux champs, etc.). */
export function mergeSettings(stored: unknown): StoreSettings {
  return deepMerge(defaultSettings, stored ?? {});
}

/** Remplace les {{clés}} des pages légales par les informations de la boutique. */
export function fillPlaceholders(text: string, s: StoreSettings, siteUrl: string): string {
  const missing = (label: string) => `[À COMPLÉTER : ${label}]`;
  const values: Record<string, string> = {
    nom_boutique: s.business_name || missing('nom de la boutique'),
    raison_sociale: s.legal.raison_sociale || missing('raison sociale'),
    forme_juridique: s.legal.forme_juridique || missing('forme juridique'),
    ninea: s.legal.ninea || missing('NINEA'),
    rccm: s.legal.rccm || missing('numéro RCCM'),
    adresse: s.address || missing('adresse'),
    telephone: s.phone || missing('téléphone'),
    whatsapp: s.whatsapp ? `+${s.whatsapp}` : missing('WhatsApp'),
    email: s.email || missing('adresse e-mail'),
    responsable_publication: s.legal.responsable_publication || missing('responsable de la publication'),
    site_url: siteUrl || s.site_url || missing('adresse du site'),
  };
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (m, key: string) => values[key] ?? m);
}
