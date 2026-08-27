/// <reference types="vite/client" />
// NOTE: This file used to wrap the Supabase JS client. It's kept as
// `supabase.ts` (rather than renamed) only so every existing import across
// the app keeps working untouched. It now wraps ApiClient, which talks to
// our own Express + Postgres (Neon) backend instead of Supabase. The
// exported function names (getSupabaseClient, isSupabaseConfigured, etc.)
// and the "supabaseUrl" naming in Settings are kept for the same reason —
// they now mean "our backend API URL", not a real Supabase project.
import { ApiClient } from './apiClient';

const getEnvVar = (key: string): string => {
  try {
    return (import.meta as { env?: Record<string, string> }).env?.[key] || '';
  } catch {
    return '';
  }
};

const getStoredVar = (key: string): string => {
  try {
    if (typeof window !== 'undefined') {
      const direct = localStorage.getItem(key);
      if (direct) return direct;

      const stg = localStorage.getItem('kinomart_settings');
      if (stg) {
        const parsed = JSON.parse(stg);
        if (key === 'kinomart_supabase_url' && parsed.supabaseUrl) return parsed.supabaseUrl;
        if (key === 'kinomart_supabase_key' && parsed.supabaseKey) return parsed.supabaseKey;
      }
    }
  } catch {
    // Ignore localStorage access errors
  }
  return '';
};

export const getSupabaseConfig = (): { url: string; key: string } => {
  // VITE_API_URL is the real, current env var. VITE_SUPABASE_URL is read too
  // so an existing deployment's env vars keep working without renaming.
  const envUrl = getEnvVar('VITE_API_URL') || getEnvVar('VITE_SUPABASE_URL');
  const localUrl = getStoredVar('kinomart_supabase_url');

  const url = (localUrl && localUrl.startsWith('http')) ? localUrl : envUrl;
  const validUrl = url && url.startsWith('http') && !url.includes('your-supabase-project') ? url : '';

  // No API key is needed for our own backend (it's not publicly discoverable
  // the way a Supabase anon key is) — key is kept in the return shape only
  // for compatibility with callers that destructure { url, key }.
  return { url: validUrl, key: validUrl ? 'internal' : '' };
};

let cachedClient: ApiClient | null = null;
let lastUrl = '';

// Early In-Flight Network Preload (Initiates instant query before React lifecycle mount)
let preloadedProductsPromise: Promise<any> | null = null;
let preloadedCategoriesPromise: Promise<any> | null = null;
let preloadedSettingsPromise: Promise<any> | null = null;

export const startEarlyPreload = () => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    if (!preloadedProductsPromise) {
      preloadedProductsPromise = Promise.resolve(client.from('products').select('*'));
    }
    if (!preloadedCategoriesPromise) {
      preloadedCategoriesPromise = Promise.resolve(client.from('categories').select('*'));
    }
    if (!preloadedSettingsPromise) {
      preloadedSettingsPromise = Promise.resolve(client.from('settings').select('*'));
    }
  } catch (e) {
    // Ignore preload error
  }
};

export const consumePreloadPromises = () => {
  const promises = {
    products: preloadedProductsPromise,
    categories: preloadedCategoriesPromise,
    settings: preloadedSettingsPromise
  };
  preloadedProductsPromise = null;
  preloadedCategoriesPromise = null;
  preloadedSettingsPromise = null;
  return promises;
};

export const getSupabaseClient = (): ApiClient | null => {
  const { url } = getSupabaseConfig();
  if (!url) return null;

  if (cachedClient && lastUrl === url) {
    return cachedClient;
  }

  try {
    cachedClient = new ApiClient(url);
    lastUrl = url;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize API client:', err);
    return null;
  }
};

export const supabase: ApiClient | null = getSupabaseClient();

// Auto-start preload immediately upon script evaluation
if (typeof window !== 'undefined') {
  try {
    startEarlyPreload();
  } catch {
    // Ignore
  }
}

export const isSupabaseConfigured = (): boolean => {
  return !!getSupabaseClient();
};

export const setSupabaseCredentials = (url: string, _key: string) => {
  const current = getSupabaseConfig();
  if (current.url === url && cachedClient) {
    return;
  }
  try {
    if (typeof window !== 'undefined') {
      if (url) localStorage.setItem('kinomart_supabase_url', url);
      else localStorage.removeItem('kinomart_supabase_url');
    }
  } catch {
    // Ignore
  }
  cachedClient = null;
  getSupabaseClient();
};
