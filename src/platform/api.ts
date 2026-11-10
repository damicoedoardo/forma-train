import type { SupabaseClient } from '@supabase/supabase-js';

/* Supabase for login, and signed-in calls to Forma's api (backend/). All of it is off until the
   three NEXT_PUBLIC_ settings are there; the Supabase library loads only when used. */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const cloudConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && API_URL);

/** Google sign-in shows only once the Google provider is on in Supabase (NEXT_PUBLIC_GOOGLE_SIGNIN=1). */
export const googleSignIn = process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === '1';

let client: Promise<SupabaseClient> | null = null;

export function supabase(): Promise<SupabaseClient> {
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    }),
  );
  return client;
}

export class Offline extends Error {}

/** A signed-in call to the api; no connection throws Offline. */
export async function api(method: 'GET' | 'PUT' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<Response> {
  const { data } = await (await supabase()).auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Offline('No connection');
  }
}

/** This phone may hold a sign-in (a Supabase token is stored, or one is coming back in the
    address), so the cloud is worth starting. Keeps Supabase unloaded for people who never signed in. */
export function maybeSignedIn(): boolean {
  if (!cloudConfigured || typeof window === 'undefined') return false;
  if (/[?&#](code|access_token|error_description)=/.test(window.location.href)) return true;
  try {
    return Object.keys(localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
  } catch {
    return false;
  }
}

/** Said on the window right before a sign-in starts, so the sign-in watcher loads. */
export const CLOUD_START = 'train-cloud-start';
