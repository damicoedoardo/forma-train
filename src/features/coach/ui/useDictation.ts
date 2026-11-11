'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cloudConfigured, supabase } from '@/platform/api';

/* Dictation for the chat: tap to record, see your voice as a moving line, tap again and the
   words come back from Deepgram (`app/api/voice/transcribe`) to put in the box, to edit or send. */

export type Dictation = 'idle' | 'recording' | 'transcribing';

/** How many bars the moving line keeps. */
const BARS = 36;

const canRecord = () => typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

function pickType(): string {
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) if (MediaRecorder.isTypeSupported(t)) return t;
  return '';
}

async function transcribe(audio: Blob): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': (audio.type || 'audio/webm').split(';')[0] };
  if (cloudConfigured) {
    const { data } = await (await supabase()).auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  const res = await fetch('/api/voice/transcribe', { method: 'POST', headers, body: audio }).catch(() => null);
  if (!res) throw new Error('No connection. Try again?');
  if (res.status === 503) throw new Error('Voice is not set up yet.');
  if (res.status === 401) throw new Error('Sign in to use your voice.');
  if (res.status === 413) throw new Error('That was too long. Try a shorter one.');
  if (!res.ok) throw new Error('Could not hear that. Try again?');
  return ((await res.json()) as { text?: string }).text ?? '';
}

export function useDictation(onText: (text: string) => void) {
  const [state, setState] = useState<Dictation>('idle');
  const [bars, setBars] = useState<number[]>(() => Array(BARS).fill(0));
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<{ recorder: MediaRecorder; stream: MediaStream; audio: AudioContext; raf: number; keep: boolean } | null>(null);
  const textRef = useRef(onText);
  textRef.current = onText;

  const end = useCallback(() => {
    const r = rec.current;
    if (!r) return;
    cancelAnimationFrame(r.raf);
    r.stream.getTracks().forEach((t) => t.stop());
    void r.audio.close().catch(() => {});
  }, []);

  useEffect(() => () => {
    if (rec.current) {
      rec.current.keep = false;
      if (rec.current.recorder.state !== 'inactive') rec.current.recorder.stop();
      end();
    }
  }, [end]);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setError('Allow the microphone to talk.');
      return;
    }
    const type = pickType();
    const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    // The moving line: how loud it is, a few times a second.
    const audio = new AudioContext();
    const analyser = audio.createAnalyser();
    analyser.fftSize = 512;
    audio.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    const t0 = performance.now();
    let lastBar = 0;
    const r = { recorder, stream, audio, raf: 0, keep: true };
    const tick = (now: number) => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      const level = Math.min(1, Math.sqrt(sum / buf.length) * 4);
      if (now - lastBar > 70) {
        lastBar = now;
        setBars((b) => [...b.slice(1), level]);
        setSeconds(Math.floor((now - t0) / 1000));
      }
      r.raf = requestAnimationFrame(tick);
    };
    recorder.onstop = () => {
      end();
      rec.current = null;
      setBars(Array(BARS).fill(0));
      if (!r.keep) return setState('idle');
      setState('transcribing');
      transcribe(new Blob(chunks, { type: recorder.mimeType || type }))
        .then((text) => text && textRef.current(text))
        .catch((e: Error) => setError(e.message))
        .finally(() => setState('idle'));
    };
    rec.current = r;
    recorder.start(250);
    r.raf = requestAnimationFrame(tick);
    setSeconds(0);
    setState('recording');
  }, [state, end]);

  /** Stop and write it down. */
  const stop = useCallback(() => rec.current?.recorder.stop(), []);
  /** Stop and throw it away. */
  const cancel = useCallback(() => {
    if (!rec.current) return;
    rec.current.keep = false;
    rec.current.recorder.stop();
  }, []);

  return { state, bars, seconds, error, start, stop, cancel, available: canRecord() };
}
