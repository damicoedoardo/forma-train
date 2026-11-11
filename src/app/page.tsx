'use client';

import { useCallback, useEffect, useState } from 'react';
import { Screen, TabBar, type Tab } from '@/ui';
import { inSandbox } from '@/platform/store';
import { useNow } from '@/platform/useNow';
import { dayKey } from '@/features/training/days';
import { closeStaleDraft, finishSession, isTap, todaysWorkout, type Session, type TrainingState } from '@/features/training/session';
import { dropWorkout, leaveWorkout, startWorkout } from '@/features/training/workout';
import { useTraining } from '@/features/training/ui/useTraining';
import { Today } from '@/features/training/ui/Today';
import { Workout } from '@/features/training/ui/Workout';
import { After } from '@/features/training/ui/After';
import { currentPlan } from '@/features/coach/week';
import { shortTitle } from '@/features/coach/title';
import { Setup } from '@/features/coach/ui/Setup';
import { CoachTab } from '@/features/coach/ui/CoachTab';
import { useCoachAutoPlan, useCoachPlan } from '@/features/coach/ui/useCoach';
import { trainingLabel } from '@/features/social/cheers';
import { workoutCard } from '@/features/social/feed';
import { codeInUrl } from '@/features/social/friends';
import { addFriend, sharePost } from '@/features/social/client';
import { useSocial } from '@/features/social/ui/useSocial';
import { FriendsTab } from '@/features/social/ui/FriendsTab';
import { useCloudSync } from '@/features/account/ui/useCloudSync';
import { useCloudStatus } from '@/features/account/ui/useCloudStatus';
import { YouTab } from '@/features/account/ui/YouTab';
import { useDoor } from '@/features/account/ui/useDoor';
import { Install } from '@/features/account/ui/Install';
import { Welcome } from '@/features/account/ui/Welcome';

/* The app: one page. In a browser it first asks to be put on the Home Screen; installed, it opens
   on the sign-in until signed in. The first open asks six questions; then the four tabs, the workout over
   them while one is open, and the screen after it. */

interface Finished {
  session: Session;
  title: string;
  startedAt: string;
  taps: string[];
}

export default function Home() {
  const { state, ready, update } = useTraining();
  const now = useNow(30_000);
  const [tab, setTab] = useState<Tab>('today');
  const [after, setAfter] = useState<Finished | null>(null);
  const [redo, setRedo] = useState(false);
  const { signedIn } = useCloudStatus();
  const entry = useDoor(inSandbox());
  const training = state.draft?.open ? trainingLabel(state) : null;
  const social = useSocial(state, signedIn, training);

  useCloudSync(state, update, !ready || inSandbox());
  useCoachPlan(state, update);
  useCoachAutoPlan(state, update, signedIn && !inSandbox());

  // A workout left open on an earlier day is saved on its own day.
  useEffect(() => {
    if (ready) update((s) => closeStaleDraft(s, new Date()));
  }, [ready, update]);

  // An invite link: add the friend once signed in, then tidy the address.
  useEffect(() => {
    const code = signedIn ? codeInUrl(window.location.href) : null;
    if (!code) return;
    addFriend(code)
      .catch(() => {})
      .finally(() => {
        window.history.replaceState(null, '', window.location.pathname);
        setTab('friends');
      });
  }, [signedIn]);

  const finish = useCallback(() => {
    const s = state;
    const draft = s.draft;
    if (!draft) return;
    const title = currentPlan(s.coach)?.title ?? 'Workout';
    const taps = todaysWorkout(s, draft.checkin).filter(isTap).map((q) => q.id);
    const r = finishSession(s, new Date());
    update((cur: TrainingState) => (r && cur.draft?.startedAt === draft.startedAt ? r.state : { ...cur, draft: null }));
    if (r) setAfter({ session: r.session, title, startedAt: draft.startedAt, taps });
    setTab('today');
  }, [state, update]);

  if (!ready || !entry.door) return <main className="min-h-[100dvh] bg-base" />;
  if (entry.door === 'install') return <Install onBrowser={entry.goOnInBrowser} />;
  if (entry.door === 'sign-in') return <Welcome busy={entry.busy} />;
  if (!state.profile.onboarded || redo)
    return (
      <Setup
        initialName={state.profile.name}
        update={(fn) => {
          update(fn);
          setRedo(false);
        }}
      />
    );

  if (state.draft?.open)
    return (
      <Workout
        state={state}
        update={update}
        onFinish={finish}
        onLeave={() => update(leaveWorkout)}
        onDrop={() => update(dropWorkout)}
        cheer={social.cheer ? { id: social.cheer.id, from: social.cheer.from_name, text: social.cheer.text } : null}
        onCheerSeen={social.seen}
      />
    );

  if (after)
    return (
      <Screen tabs={false} glow="-right-32 -top-32" mood="done">
        <After
          state={state}
          session={after.session}
          title={after.title}
          startedAt={after.startedAt}
          update={update}
          onDone={() => setAfter(null)}
          onShare={signedIn ? () => sharePost(workoutCard(after.session, { title: shortTitle(after.title), startedAt: after.startedAt, taps: new Set(after.taps) }), '', null).then(() => {}) : undefined}
        />
      </Screen>
    );

  const toYou = () => setTab('you');
  return (
    <Screen view={tab} bar={<TabBar tab={tab} onChange={setTab} />} glow={tab === 'friends' ? '-right-52 top-64' : tab === 'coach' ? 'left-1/3 -top-56' : tab === 'you' ? 'left-[-15px] -top-48' : '-left-10 -top-44'}>
      {tab === 'today' && (
        <Today
          state={state}
          now={now}
          onStart={() => update((s) => startWorkout(s, new Date()))}
          onRest={() => update((s) => ({ ...s, rested: [...new Set([...(s.rested ?? []), dayKey(new Date())])] }))}
          onCoach={() => setTab('coach')}
        />
      )}
      {tab === 'coach' && <CoachTab state={state} update={update} signedIn={signedIn} now={now} onSignIn={toYou} />}
      {tab === 'friends' && <FriendsTab signedIn={signedIn} code={social.code} onSignIn={toYou} />}
      {tab === 'you' && <YouTab state={state} update={update} now={now} photo={social.me?.photo ?? null} me={social.me} onPhoto={social.refreshMe} onRedo={() => setRedo(true)} />}
    </Screen>
  );
}
