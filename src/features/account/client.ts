import { api, CLOUD_START, supabase } from '@/platform/api';
import type { TrainingState } from '@/features/training/session';
import type { CloudCopy } from './cloud';

/* The talking side of the cloud backup: Supabase for login, the api's /save for the save. The
   rules of what to send live in cloud.ts. */

// ---------- what the screens show ----------

export interface CloudStatus {
  /** Signed in as (null: signed out). */
  email: string | null;
  /** The signed-in account's id, to tell your own posts and cards. */
  userId?: string | null;
  signedIn: boolean;
  /** Supabase has said whether this phone is signed in (until then, `maybeSignedIn()` guesses). */
  known?: boolean;
  /** The cloud save has been met once since signing in (taken, sent, or it failed). */
  met?: boolean;
  phase: 'idle' | 'saving' | 'saved' | 'offline' | 'error';
  savedAt?: string;
  workouts?: number;
}

let status: CloudStatus = { email: null, signedIn: false, phase: 'idle' };
const listeners = new Set<() => void>();

export function setCloudStatus(patch: Partial<CloudStatus>) {
  status = { ...status, ...patch };
  for (const l of listeners) l();
}

/** For the hook in ui/useCloudStatus.ts. */
export function onCloudStatus(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const cloudStatus = () => status;

// ---------- the last cloud rev this phone saw, per account ----------

const REV_KEY = 'forma-train-cloud-rev-v1';

export function lastRev(user: string): number | null {
  try {
    const v = JSON.parse(localStorage.getItem(REV_KEY) ?? 'null') as { user?: string; rev?: number } | null;
    return v?.user === user && typeof v.rev === 'number' ? v.rev : null;
  } catch {
    return null;
  }
}

export function rememberRev(user: string, rev: number | null) {
  try {
    if (rev === null) localStorage.removeItem(REV_KEY);
    else localStorage.setItem(REV_KEY, JSON.stringify({ user, rev }));
  } catch {
    // Storage blocked: the next sign-in asks again, which is safe.
  }
}

const call = (method: 'GET' | 'PUT' | 'DELETE', body?: unknown) => api(method, '/save', body);

/** The cloud copy, or null when there is none yet. */
export async function getCloud(): Promise<CloudCopy | null> {
  const r = await call('GET');
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Cloud read failed (${r.status})`);
  return (await r.json()) as CloudCopy;
}

// Set while starting over: the old save must never go back up after its cloud copy is gone.
let writesStopped = false;

/** Hold every upload from this page (true), or let them go again (false). */
export function holdCloudWrites(on: boolean) {
  writesStopped = on;
}

export type PutResult = { ok: true; copy: CloudCopy } | { ok: false; current: CloudCopy | null };

/** Write this save over the cloud's `baseRev`; a clash returns the cloud copy instead. */
export async function putCloud(state: TrainingState, baseRev: number | null): Promise<PutResult> {
  if (writesStopped) throw new Error('Starting over');
  const r = await call('PUT', { data: state, base_rev: baseRev });
  if (r.status === 409) return { ok: false, current: ((await r.json()) as { current: CloudCopy | null }).current };
  if (!r.ok) throw new Error(`Cloud save failed (${r.status})`);
  return { ok: true, copy: (await r.json()) as CloudCopy };
}

export async function deleteCloud(): Promise<void> {
  const r = await call('DELETE');
  if (!r.ok && r.status !== 404) throw new Error(`Cloud delete failed (${r.status})`);
}

// ---------- signing in and out ----------

const back = () => `${window.location.origin}/`;
/** Wake the sign-in watcher (useCloudSync) before signing in. */
const wake = () => window.dispatchEvent(new Event(CLOUD_START));

export async function signInWithGoogle(): Promise<string | null> {
  wake();
  const { error } = await (await supabase()).auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back() } });
  return error?.message ?? null;
}

export async function signInWithEmail(email: string): Promise<string | null> {
  wake();
  const { error } = await (await supabase()).auth.signInWithOtp({ email, options: { emailRedirectTo: back() } });
  return error?.message ?? null;
}

/** Sign in with the code from the email: the way in on an installed iPhone app, where the
    email's link would open Safari instead. */
export async function verifyEmailCode(email: string, code: string): Promise<string | null> {
  wake();
  const { error } = await (await supabase()).auth.verifyOtp({ email, token: code, type: 'email' });
  return error?.message ?? null;
}

export async function signOut(): Promise<void> {
  await (await supabase()).auth.signOut();
}
