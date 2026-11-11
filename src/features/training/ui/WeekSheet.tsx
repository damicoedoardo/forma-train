'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Layer, Segmented } from '@/ui';
import { restKept, weekSlots, weekTally, weekdayOf } from '@/features/coach/week';
import { minutesOf } from '@/features/coach/validate';
import { shortTitle } from '@/features/coach/title';
import type { PlanItem } from '@/features/coach/types';
import { dayKey } from '../days';
import { sessionsThisWeek, WEEKLY_GOAL, type TrainingState } from '../session';

/* The week the coach planned, opened from Today: this week or next, a row a day. A training day
   opens to show its moves. */

const dose = (i: PlanItem) => `${i.sets} × ${i.low === i.high ? i.low : `${i.low}-${i.high}`}${i.unit === 'sec' ? 's' : ''}`;

export function WeekSheet({ state, now, onClose }: { state: TrainingState; now: Date; onClose: () => void }) {
  const week = state.coach?.week;
  const today = dayKey(now);
  const [which, setWhich] = useState<0 | 1>(0);
  const [open, setOpen] = useState<string | null>(null);
  const tally = weekTally(week, now, sessionsThisWeek(state, now), state.coach?.profile?.days ?? WEEKLY_GOAL);
  const slots = week ? weekSlots(week, which) : [];

  return (
    <Layer>
      <div className="fade fixed inset-0 z-30 flex items-end bg-black/55 px-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }} onClick={onClose}>
        <div className="glass sheet mx-auto flex max-h-[82dvh] w-full max-w-[448px] flex-col rounded-card !bg-[#16171C] pt-3" onClick={(e) => e.stopPropagation()}>
          <span aria-hidden className="mx-auto h-1 w-9 rounded-full bg-white/20" />
          <div className="mt-4 flex items-center justify-between px-5">
            <div className="w-[190px]">
              <Segmented
                label="Week"
                options={[
                  { value: '0', label: 'This week' },
                  { value: '1', label: 'Next' },
                ]}
                value={String(which)}
                onChange={(v) => setWhich(v === '1' ? 1 : 0)}
              />
            </div>
            {which === 0 && (
              <span className="text-[15px] tabular-nums text-ink-muted">
                {tally.done} / {tally.goal}
              </span>
            )}
          </div>
          <div className="mt-3 overflow-y-auto px-5 pb-4">
            {!week && <p className="py-6 text-[15px] text-ink-muted">The week shows here once it is planned.</p>}
            {slots.map((s, i) => {
              const done = !!s.day?.done;
              const isToday = s.date === today;
              const items = s.day?.plan.items.filter((x) => !x.skipped) ?? [];
              const shown = open === s.date && items.length > 0;
              return (
                <div key={s.date} className={i ? 'border-t hairline' : ''}>
                  <button type="button" disabled={!s.day} onClick={() => setOpen(shown ? null : s.date)} className="flex w-full items-center gap-4 py-3.5 text-left">
                    <span className={`w-9 text-[14px] ${isToday ? 'text-ink' : 'text-ink-muted'}`}>{weekdayOf(s.date)}</span>
                    <span className={`flex-1 text-[15px] ${s.day ? '' : 'text-ink-faint'}`}>{s.day ? shortTitle(s.day.plan.title) : restKept(state, s.date) ? 'Rested' : 'Rest'}</span>
                    {s.day && <span className="text-[14px] tabular-nums text-ink-muted">{minutesOf(s.day.plan.items)}m</span>}
                    <span aria-label={done ? 'Done' : undefined} className={`h-2.5 w-2.5 rounded-full ${done ? 'bg-ink' : isToday && s.day ? 'bg-accent shadow-[0_0_8px_rgba(110,116,240,0.6)]' : s.day ? 'border border-white/25' : ''}`} />
                    {s.day && <ChevronDown size={16} strokeWidth={2} aria-hidden className={`-mr-1 text-ink-faint transition-transform ${shown ? 'rotate-180' : ''}`} />}
                  </button>
                  {shown && (
                    <div className="fade mb-3 ml-[52px] flex flex-col gap-2">
                      {items.map((x, n) => (
                        <div key={`${x.id}-${n}`} className="flex justify-between gap-3 text-[14px]">
                          <span className="min-w-0 truncate text-ink-soft">{x.name}</span>
                          <span className="shrink-0 tabular-nums text-ink-muted">{dose(x)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layer>
  );
}
