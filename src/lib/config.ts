/** Configuration lue depuis les variables d'environnement Vite (préfixe VITE_). Aucun secret ici : la clé anon Supabase est publique par conception. */
const env = import.meta.env;

export const config = {
  supabaseUrl: (env.VITE_SUPABASE_URL as string | undefined)?.trim() || '',
  supabaseAnonKey: (env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '',
  siteUrl: ((env.VITE_SITE_URL as string | undefined)?.trim() || '').replace(/\/$/, ''),
  forceDemo: env.VITE_DEMO_MODE === 'true',
};

/** Mode démonstration : données stockées uniquement dans ce navigateur, aucune commande transmise. */
export const isDemoMode = config.forceDemo || !config.supabaseUrl || !config.supabaseAnonKey;
