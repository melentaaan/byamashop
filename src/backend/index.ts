import { config, isDemoMode } from '../lib/config';
import { createDemoBackend } from './demo';
import { createSupabaseBackend } from './supabase';
import type { ShopBackend } from './types';

export const backend: ShopBackend = isDemoMode
  ? createDemoBackend()
  : createSupabaseBackend(config.supabaseUrl, config.supabaseAnonKey);

export type { ShopBackend } from './types';
