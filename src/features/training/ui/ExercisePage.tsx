'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronLeft, Play, X } from 'lucide-react';
import { Glass, Label, Screen } from '@/ui';
import { loadLibrary } from '@/features/exercises/library';
import { guideFor, type Guide } from '@/features/exercises/guide';
import { videoEmbedUrl, videoSearchUrl } from '@/features/exercises/videos';
import type { WorkoutExercise } from '../session';
import { doseText } from '../workout';

/* One exercise, opened from Today's list: the how-to video on top, then what to do and what to
   avoid. It covers the screen and slides up; back closes it. */

export function ExercisePage({ q, onClose }: { q: WorkoutExercise; onClose: () => void }) {
  const [guide, setGuide] = useState<Guide | null>(null);
  useEffect(() => {
    let live = true;
    loadLibrary().then((all) => live && setGuide(guideFor(all, q)));
    return () => {
      live = false;
    };
  }, [q]);

  // Back on the phone closes the page rather than leaving the app.
  useEffect(() => {
    window.history.pushState({ exercise: q.id }, '');
    const back = () => onClose();
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [q.id, onClose]);
  const close = () => window.history.back();

  return (
    <div className="sheet fixed inset-0 z-40 overflow-y-auto bg-base" role="dialog" aria-label={q.name}>
      <Screen tabs={false} glow="-right-40 -top-40">
        <button type="button" aria-label="Back" onClick={close} className="glass press flex h-11 w-11 items-center justify-center rounded-full">
          <ChevronLeft size={20} strokeWidth={2} aria-hidden />
        </button>

        <div className="mt-5 aspect-video w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/40">
          {guide?.video ? (
            <iframe src={videoEmbedUrl(guide.video.id)} title={guide.video.title} className="h-full w-full bg-black" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : guide ? (
            <a href={videoSearchUrl(q.name)} target="_blank" rel="noreferrer" className="press flex h-full w-full flex-col items-center justify-center gap-3 text-ink-muted">
              <span className="glass flex h-14 w-14 items-center justify-center rounded-full text-ink">
                <Play size={20} fill="currentColor" strokeWidth={0} aria-hidden />
              </span>
              <span className="text-[14px]">Find a video</span>
            </a>
          ) : null}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-display text-[30px] font-medium leading-[34px] tracking-[-0.8px]">{q.name}</h1>
            {guide?.muscles && <span className="text-[14px] text-ink-muted">{guide.muscles}</span>}
          </div>
          <span className="glass num shrink-0 rounded-pill px-3.5 py-1.5 text-[14px] text-ink-soft">{doseText(q)}</span>
        </div>

        {guide && guide.dos.length > 0 && <Cues label="Do" items={guide.dos} good />}
        {guide && guide.donts.length > 0 && <Cues label="Avoid" items={guide.donts} />}
      </Screen>
    </div>
  );
}

function Cues({ label, items, good = false }: { label: string; items: string[]; good?: boolean }) {
  return (
    <div className="mt-7 flex flex-col gap-2.5">
      <Label>{label}</Label>
      <Glass className="flex flex-col px-4 py-1">
        {items.map((t, i) => (
          <div key={t} className={`flex gap-3 py-3 ${i ? 'border-t hairline' : ''}`}>
            <span aria-hidden className={`mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${good ? 'bg-ink text-base' : 'bg-white/[0.08] text-ink-muted'}`}>
              {good ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={2.5} />}
            </span>
            <span className="text-[15px] leading-[21px] text-ink-soft">{t}</span>
          </div>
        ))}
      </Glass>
    </div>
  );
}
