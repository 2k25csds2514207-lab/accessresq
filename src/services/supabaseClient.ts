import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  SUPABASE_URL: 'accessresq_supabase_url',
  SUPABASE_ANON_KEY: 'accessresq_supabase_anon_key'
};

let cachedClient: SupabaseClient | null = null;
let lastInitUrl: string | null = null;
let lastInitKey: string | null = null;

export function getActiveSupabaseCredentials(): { url: string | null; key: string | null } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const storedUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL);
  const storedKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY);

  const url = storedUrl || envUrl || null;
  const key = storedKey || envKey || null;

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getActiveSupabaseCredentials();
  if (!url || !key) return false;
  // Basic validation: must be a valid http URL and non-placeholder key
  try {
    const parsed = new URL(url);
    return Boolean(parsed.protocol.startsWith('http') && key.trim().length > 20 && !url.includes('your-project'));
  } catch {
    return false;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getActiveSupabaseCredentials();

  if (!url || !key || !isSupabaseConfigured()) {
    cachedClient = null;
    return null;
  }

  // Re-use cached client if credentials have not changed
  if (cachedClient && lastInitUrl === url && lastInitKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    lastInitUrl = url;
    lastInitKey = key;
    return cachedClient;
  } catch (err) {
    console.warn('[AccessResQ] Failed to initialize Supabase client:', err);
    cachedClient = null;
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string; rowCount?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase credentials are not configured or are placeholder values.'
    };
  }

  try {
    const { data, error, count } = await client
      .from('community_barriers')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        message: `Supabase query error: ${error.message}`
      };
    }

    return {
      connected: true,
      message: 'Successfully connected to Supabase database (table: community_barriers).',
      rowCount: count ?? 0
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Network error connecting to Supabase: ${err.message || String(err)}`
    };
  }
}

export function saveSupabaseCredentials(url: string | null, key: string | null): void {
  if (url && url.trim()) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  }

  if (key && key.trim()) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  }

  // Reset client cache so next call reinitializes
  cachedClient = null;
  lastInitUrl = null;
  lastInitKey = null;
}

