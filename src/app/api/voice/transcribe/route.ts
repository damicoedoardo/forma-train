/* Dictation: audio in, `{ text }` out, through Deepgram (Nova-3). Called from the app's own
   server so the Deepgram key never reaches the phone. Needs DEEPGRAM_API_KEY (else 503).
   Callers must be signed in once Supabase is set up; before that it answers only when
   VOICE_OPEN=1 (for trying it on a preview). */

export const runtime = 'nodejs';

const LISTEN_URL = 'https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&detect_language=true';
/** About two minutes of speech; more is refused. */
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Whether the caller may use it: a valid Supabase sign-in, or the open switch before Supabase is set up. */
async function allowed(req: Request): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return process.env.VOICE_OPEN === '1';
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return process.env.VOICE_OPEN === '1';
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: auth } }).catch(() => null);
  return !!res?.ok;
}

interface ListenResponse {
  results?: { channels?: { alternatives?: { transcript?: string }[] }[] };
}

export async function POST(req: Request) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return Response.json({ detail: 'voice_off' }, { status: 503 });
  if (!(await allowed(req))) return Response.json({ detail: 'sign_in' }, { status: 401 });
  const type = req.headers.get('content-type') ?? '';
  if (!type.startsWith('audio/')) return Response.json({ detail: 'not_audio' }, { status: 415 });
  const audio = await req.arrayBuffer();
  if (!audio.byteLength) return Response.json({ text: '' });
  if (audio.byteLength > MAX_AUDIO_BYTES) return Response.json({ detail: 'too_long' }, { status: 413 });
  const res = await fetch(LISTEN_URL, { method: 'POST', headers: { Authorization: `Token ${key}`, 'Content-Type': type }, body: audio }).catch(() => null);
  if (!res?.ok) {
    console.error(`Deepgram listen failed: ${res?.status ?? 'no connection'} ${res ? await res.text() : ''}`);
    return Response.json({ detail: 'transcribe_failed' }, { status: 502 });
  }
  const data = (await res.json()) as ListenResponse;
  return Response.json({ text: data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? '' });
}
