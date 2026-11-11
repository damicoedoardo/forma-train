'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Download, Ellipsis, EllipsisVertical, Share, Smartphone, SquarePlus } from 'lucide-react';
import { Button, Glass, Screen } from '@/ui';
import { guideFor, type Guide } from '../gate';

/* In a browser, Forma first asks to be put on the Home Screen, with the steps for this phone.
   Android's own install prompt is used when the browser offers it. On a computer it says to open
   it on the phone, and can go on in the browser. */

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Step = { icon: ReactNode; text: ReactNode; shows?: { label: string; icon: ReactNode } };

const ICON = { size: 18, strokeWidth: 1.8, 'aria-hidden': true } as const;

const STEPS: Record<Exclude<Guide, 'desktop'>, Step[]> = {
  'ios-safari': [
    { icon: <Share {...ICON} />, text: <>Tap <b className="font-medium text-ink">Share</b> in Safari’s bar. On newer iPhones, tap <b className="font-medium text-ink">•••</b> first.</> },
    { icon: <SquarePlus {...ICON} />, text: <>Tap <b className="font-medium text-ink">Add to Home Screen</b>. Scroll down if you don’t see it.</>, shows: { label: 'Add to Home Screen', icon: <SquarePlus {...ICON} /> } },
    { icon: <Smartphone {...ICON} />, text: <>Tap <b className="font-medium text-ink">Add</b>, then open Forma from your Home Screen.</> },
  ],
  'ios-other': [
    { icon: <Share {...ICON} />, text: <>Tap <b className="font-medium text-ink">Share</b>. In Chrome it sits in the address bar.</> },
    { icon: <SquarePlus {...ICON} />, text: <>Tap <b className="font-medium text-ink">Add to Home Screen</b>. Tap More if you don’t see it.</>, shows: { label: 'Add to Home Screen', icon: <SquarePlus {...ICON} /> } },
    { icon: <Smartphone {...ICON} />, text: <>Tap <b className="font-medium text-ink">Add</b>, then open Forma from your Home Screen.</> },
  ],
  android: [
    { icon: <EllipsisVertical {...ICON} />, text: <>Tap the <b className="font-medium text-ink">menu</b> at the top right of Chrome.</> },
    { icon: <Download {...ICON} />, text: <>Tap <b className="font-medium text-ink">Add to Home screen</b> or <b className="font-medium text-ink">Install app</b>.</>, shows: { label: 'Install app', icon: <Download {...ICON} /> } },
    { icon: <Smartphone {...ICON} />, text: <>Tap <b className="font-medium text-ink">Install</b>, then open Forma from your Home screen.</> },
  ],
  'in-app': [
    { icon: <Ellipsis {...ICON} />, text: <>This app’s browser can’t install Forma. Tap <b className="font-medium text-ink">•••</b> at the top.</> },
    { icon: <Share {...ICON} />, text: <>Tap <b className="font-medium text-ink">Open in browser</b>, then follow the steps there.</> },
  ],
};

export function Install({ onBrowser }: { onBrowser: () => void }) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [done, setDone] = useState(false);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    setGuide(guideFor(navigator.userAgent, navigator.maxTouchPoints > 1));
    const keep = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    const installed = () => setDone(true);
    window.addEventListener('beforeinstallprompt', keep);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', keep);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  // The steps light up one after another, like a short walk-through.
  const steps = guide && guide !== 'desktop' ? STEPS[guide] : [];
  useEffect(() => {
    if (steps.length < 2) return;
    const t = window.setInterval(() => setLit((n) => (n + 1) % steps.length), 2600);
    return () => window.clearInterval(t);
  }, [steps.length]);

  if (!guide) return <main className="min-h-[100dvh] bg-base" />;

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    if (outcome === 'accepted') setDone(true);
  };

  return (
    <Screen tabs={false} glow="left-1/2 -translate-x-1/2 -top-52">
      <div className="mt-4 flex flex-col items-center gap-2">
        {/* The icon as it will sit on the Home Screen. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/weave-192.png" alt="" width={64} height={64} className="rounded-[15px] shadow-[0_10px_40px_rgba(110,116,240,0.25)]" />
        <span className="text-[13px] text-ink-muted">Forma</span>
      </div>

      <h1 className="mx-auto mt-6 max-w-[270px] text-center font-display text-[28px] font-medium leading-[34px] tracking-[-0.6px]">
        {done ? 'Open Forma from your Home Screen' : guide === 'desktop' ? 'Forma lives on your phone' : 'Add Forma to your Home Screen'}
      </h1>
      <p className="mx-auto mt-3 max-w-[320px] text-center text-[15px] leading-[22px] text-ink-muted">
        {done ? 'It’s installed. You can close this page.' : guide === 'desktop' ? 'Open this page on your phone and add it to the Home Screen.' : 'It opens like an app, works offline, and keeps your training on your phone.'}
      </p>

      {!done && guide === 'desktop' && (
        <Glass className="mt-8 flex flex-col items-center gap-1 px-5 py-6">
          <span className="text-[13px] text-ink-muted">On your phone, go to</span>
          <span className="font-display text-[24px] font-medium tracking-[-0.4px]">{typeof window !== 'undefined' ? window.location.host : 'formaquest.app'}</span>
        </Glass>
      )}

      {!done && steps.length > 0 && !prompt && (
        <Glass className="mt-6 flex flex-col px-4 py-1">
          {steps.map((s, i) => (
            <div key={i} className={`flex gap-4 py-3.5 transition-opacity duration-500 ${i ? 'border-t hairline' : ''} ${i === lit ? 'opacity-100' : 'opacity-50'}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${i === lit ? 'btn-primary text-base' : 'glass text-ink'}`}>{s.icon}</span>
              <div className="flex min-w-0 flex-col gap-2.5 pt-0.5">
                <span className="text-[15px] leading-[21px] text-ink-soft">{s.text}</span>
                {s.shows && (
                  // What the row looks like in the phone's menu.
                  <span className="flex h-11 items-center justify-between rounded-[14px] bg-white/[0.07] px-4 text-[15px] text-ink">
                    {s.shows.label}
                    {s.shows.icon}
                  </span>
                )}
              </div>
            </div>
          ))}
        </Glass>
      )}

      <div className="mt-auto flex flex-col items-center gap-4 pt-8">
        {!done && prompt && (
          <Button className="w-full" onClick={() => void install()}>
            Install Forma
          </Button>
        )}
        {guide === 'desktop' && !done && (
          <button type="button" onClick={onBrowser} className="text-[14px] text-ink-faint">
            Use it in this browser
          </button>
        )}
      </div>
    </Screen>
  );
}
