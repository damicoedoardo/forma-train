'use client';

import { useEffect, useState } from 'react';
import { Button, IntroLight, IntroMark, introShowing, INTRO_GONE } from '@/ui';
import { googleSignIn } from '@/platform/api';
import { signInWithEmail, signInWithGoogle, verifyEmailCode } from '../client';

/* The sign-in, the app's front door once it is on the phone. It starts as the opening screen's
   last frame (the mark and the name in the middle), so the opening hands over to it without a
   seam; then the mark rises and the sign-in comes in under it. `busy`: signed in, the save is
   still coming down. */

export function Welcome({ busy = false }: { busy?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Wait for the opening screen to hand over; otherwise go on at once.
    const go = () => window.setTimeout(() => setOpen(true), 120);
    if (!introShowing()) {
      const t = go();
      return () => window.clearTimeout(t);
    }
    let t = 0;
    const on = () => {
      t = go();
    };
    window.addEventListener(INTRO_GONE, on, { once: true });
    return () => {
      window.removeEventListener(INTRO_GONE, on);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <main data-intro-stay className="relative mx-auto h-[100dvh] max-w-[480px] overflow-hidden bg-base">
      <div className="welcome-mark pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ transform: open ? 'translateY(-21dvh) scale(0.84)' : undefined }}>
        <IntroLight still />
        <div className="relative flex flex-col items-center">
          <IntroMark still />
        </div>
      </div>
      <div
        className="welcome-form absolute inset-x-0 bottom-0 flex flex-col gap-3 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', opacity: open ? 1 : 0, transform: open ? 'none' : 'translateY(16px)', pointerEvents: open ? undefined : 'none' }}
      >
        <SignInForm busy={busy} />
      </div>
    </main>
  );
}

function SignInForm({ busy }: { busy: boolean }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const field = 'min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-faint';
  const go = async () => {
    setMsg(null);
    setWait(true);
    const err = sent ? await verifyEmailCode(email.trim(), code.trim()) : await signInWithEmail(email.trim());
    setWait(false);
    if (err) setMsg(sent ? 'That code didn’t work. Check it, or ask for a new one.' : err);
    else if (!sent) setSent(true);
  };
  const working = wait || busy;
  return (
    <>
      <span className="mb-2 px-6 text-center text-[15px] leading-[22px] text-ink-muted">
        {sent ? `We sent a code to ${email.trim()}.` : 'A coach that plans your week from how you really train.'}
      </span>
      {googleSignIn && !sent && (
        <Button kind="glass" disabled={working} onClick={() => void signInWithGoogle()}>
          Continue with Google
        </Button>
      )}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void go();
        }}
      >
        <div className="glass flex h-14 items-center rounded-pill px-5">
          {sent ? (
            <input key="code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="Code from the email" aria-label="Code from the email" className={field} />
          ) : (
            <input key="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="Email" aria-label="Email" className={field} />
          )}
        </div>
        <Button type="submit" disabled={working || (sent ? !code.trim() : !email.includes('@'))}>
          {busy ? 'Getting your training…' : wait ? (sent ? 'Signing in…' : 'Sending…') : sent ? 'Sign in' : 'Email me a code'}
        </Button>
      </form>
      <span className="min-h-5 px-6 text-center text-[13px] text-ink-faint">
        {msg ??
          (sent ? (
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setCode('');
              }}
            >
              Use another email
            </button>
          ) : (
            'No password. We email you a code.'
          ))}
      </span>
    </>
  );
}
