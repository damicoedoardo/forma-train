'use client';

import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Avatar, Button, Glass, Label, Layer, Stats } from '@/ui';
import { cloudConfigured } from '@/platform/api';
import { sessionsThisWeek, weekStreak, WEEKLY_GOAL, type TrainingState } from '@/features/training/session';
import { PROFILE_LIMIT } from '@/features/social/friends';
import { savePhoto, saveProfile, shrinkPhoto } from '@/features/social/client';
import { signOut } from '../client';
import { useCloudStatus } from './useCloudStatus';

/* You: your name and line, how you train, your recent workouts, and the account (who is signed
   in, the backup, sign out). Signing in is the app's front door (Welcome). */

type Update = (fn: (s: TrainingState) => TrainingState) => void;
const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export function YouTab({ state, update, now, photo, me, onPhoto, onRedo }: { state: TrainingState; update: Update; now: Date; photo: string | null; me: { place: string; about: string } | null; onPhoto: () => void; onRedo: () => void }) {
  const cloud = useCloudStatus();
  const [editing, setEditing] = useState(false);
  const name = state.profile.name ?? '';
  const recent = state.sessions.slice(-5).reverse();

  return (
    <>
      <div className="mt-6 flex flex-col items-center gap-2.5">
        <PhotoButton name={name} photo={photo} on={cloud.signedIn} onSaved={onPhoto} />
        <span className="font-display text-[28px] font-medium tracking-[-0.6px]">{name || 'You'}</span>
        {me && (me.place || me.about) && <span className="text-center text-[14px] text-ink-muted">{[me.place, me.about].filter(Boolean).join(' · ')}</span>}
        <button type="button" onClick={() => setEditing(true)} className="text-[13px] text-ink-faint">
          Edit
        </button>
      </div>

      <div className="mt-7">
        <Stats
          items={[
            { value: state.sessions.length, label: 'workouts' },
            { value: `${sessionsThisWeek(state, now)}/${WEEKLY_GOAL}`, label: 'this week' },
            { value: weekStreak(state, now), label: 'week streak' },
          ]}
        />
      </div>

      {recent.length > 0 && (
        <div className="mt-7 flex flex-col gap-2.5">
          <Label>Recent</Label>
          <Glass className="flex flex-col px-5 py-1">
            {recent.map((s, i) => (
              <div key={s.id} className={`flex items-center justify-between py-3 ${i ? 'border-t hairline' : ''}`}>
                <span className="text-[15px]">{DAY.format(new Date(s.date))}</span>
                <span className="text-[14px] tabular-nums text-ink-muted">{[s.minutes ? `${s.minutes} min` : null, `${s.entries.filter((e) => e.of).reduce((a, e) => a + e.sets.length, 0)} sets`].filter(Boolean).join(' · ')}</span>
              </div>
            ))}
          </Glass>
        </div>
      )}

      {cloudConfigured && cloud.signedIn && (
        <div className="mt-7 flex flex-col gap-2.5">
          <Label>Account</Label>
          <Glass className="flex items-center justify-between px-5 py-4">
            <div className="flex flex-col">
              <span className="text-[15px]">{cloud.email}</span>
              <span className="text-[13px] text-ink-faint">{cloud.phase === 'saving' ? 'Saving…' : cloud.phase === 'offline' ? 'Offline' : cloud.phase === 'error' ? "Couldn't back up" : 'Backed up'}</span>
            </div>
            <button type="button" onClick={() => void signOut()} className="text-[14px] text-ink-muted">
              Sign out
            </button>
          </Glass>
        </div>
      )}

      <button type="button" onClick={onRedo} className="mt-6 self-center text-[13px] text-ink-faint">
        Redo setup
      </button>

      {editing && <EditSheet state={state} update={update} me={me} signedIn={cloud.signedIn} onClose={() => setEditing(false)} />}
    </>
  );
}

function PhotoButton({ name, photo, on, onSaved }: { name: string; photo: string | null; on: boolean; onSaved: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const { base64 } = await shrinkPhoto(file, { edge: PROFILE_LIMIT.photoEdge, bytes: PROFILE_LIMIT.photoBytes, square: true });
      await savePhoto(base64);
      onSaved();
    } catch {
      // A photo that won't open or send: the old one stays.
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" disabled={!on || busy} onClick={() => input.current?.click()} aria-label={on ? 'Change photo' : undefined} className={`relative rounded-full ${busy ? 'opacity-60' : ''}`}>
      <Avatar name={name} src={photo} size={88} />
      {on && (
        <span className="glass absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full">
          <Camera size={14} strokeWidth={1.8} aria-hidden />
        </span>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
    </button>
  );
}

function EditSheet({ state, update, me, signedIn, onClose }: { state: TrainingState; update: Update; me: { place: string; about: string } | null; signedIn: boolean; onClose: () => void }) {
  const [name, setName] = useState(state.profile.name ?? '');
  const [place, setPlace] = useState(me?.place ?? '');
  const [about, setAbout] = useState(me?.about ?? '');
  const save = async () => {
    update((s) => ({ ...s, profile: { ...s.profile, name: name.trim().slice(0, 24) || undefined } }));
    if (signedIn) await saveProfile(place.trim(), about.trim()).catch(() => {});
    onClose();
  };
  const field = 'glass h-14 w-full rounded-[20px] bg-transparent px-5 text-[16px] text-ink outline-none placeholder:text-ink-faint';
  return (
    <Layer>
    <div className="fade fixed inset-0 z-30 flex items-end bg-black/55 px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }} onClick={onClose}>
      <div className="glass sheet mx-auto flex w-full max-w-[448px] flex-col gap-3 rounded-card !bg-[#16171C]/95 p-5" onClick={(e) => e.stopPropagation()}>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Name" aria-label="Name" className={field} />
        {signedIn && (
          <>
            <input value={place} onChange={(e) => setPlace(e.target.value)} maxLength={PROFILE_LIMIT.place} placeholder="Where you live" aria-label="Where you live" className={field} />
            <input value={about} onChange={(e) => setAbout(e.target.value)} maxLength={PROFILE_LIMIT.about} placeholder="A line about you" aria-label="A line about you" className={field} />
          </>
        )}
        <Button onClick={() => void save()}>Save</Button>
      </div>
    </div>
    </Layer>
  );
}
