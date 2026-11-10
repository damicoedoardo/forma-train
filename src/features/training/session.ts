import type { MoveId } from '@/features/exercises/movements';
import type { CoachState, Mode, PlanItem, RunStep } from '@/features/coach/types';
import { shiftLevels } from '@/features/coach/levels';
import { currentPlan, markDone } from '@/features/coach/week';
import { minutesOf } from '@/features/coach/time';
import { PLAN, cueOf, type DayType, type Kit, type Slot, type SlotRole } from './program';
import { MAX_RAISES_PER_WEEK, MAX_WORKOUT_MINUTES, REST_SECONDS, STALE_DRAFT_HOURS, WEEKLY_GOAL } from './config';

/* The training save and its rules: the profile, every finished workout, the workout under way,
   per-exercise targets and the coach's state. Pure: everything takes `now`. The one writer is the
   store's update(fn) (src/platform/store.ts). */

export { REST_SECONDS, WEEKLY_GOAL };
export type { DayType, Kit } from './program';

export type Rir = '4+' | '2-3' | '0-1';
export type Checkin = 'rough' | 'normal' | 'strong';

export interface SetLog {
  /** Reps, or seconds for a hold or a run. */
  reps: number;
  /** Reps left in the tank when the set ended. */
  rir: Rir;
  /** The weight, when you noted it. */
  kg?: number;
  /** A run's distance, when you noted it. */
  km?: number;
}

export interface SessionEntry {
  exerciseId: string;
  target: number;
  sets: SetLog[];
  /** The exercise's name and movement family, for the coach. */
  name?: string;
  family?: string;
  /** Sets planned: fewer done means it wasn't finished. */
  of?: number;
}

export interface Session {
  id: string;
  date: string;
  /** Full when at least half the sets were done and the day wasn't rough. */
  kind: 'full' | 'mini';
  day: DayType;
  entries: SessionEntry[];
  /** Exercise ids whose target went up after this session. */
  raised?: string[];
  /** Weighted exercises that reached the top of their range: add a little weight, start again. */
  heavier?: string[];
  /** A set beat the best set of the same exercise last time. */
  better?: boolean;
  /** What kind of workout, who planned it, and what you changed (for the coach). */
  mode?: Mode;
  plannedBy?: 'built-in' | 'coach';
  skipped?: string[];
  changed?: { from: string; to: string; how: 'easier' | 'swap' }[];
  /** How it felt, and a word about it, asked after the workout. */
  felt?: 'easy' | 'right' | 'hard';
  comment?: string;
  /** How long it really took and the minutes it was planned for (the coach learns your pace). */
  minutes?: number;
  planned?: number;
  /** Exercises of the workout not started at all, by name. */
  left?: string[];
  /** Started as a rough day (or a strong one); missing on a normal day. */
  checkin?: Exclude<Checkin, 'normal'>;
}

export interface Draft {
  startedAt: string;
  checkin: Checkin;
  /** Logged sets by exercise id. */
  sets: Record<string, SetLog[]>;
  /** The workout screen was left open: the app opens back on it. */
  open?: boolean;
  /** When the running rest ends (ms since epoch), so it keeps counting while the app is closed. */
  restUntil?: number | null;
  /** When the run on screen started (ms since epoch). */
  runAt?: number | null;
  /** When the workout's clock started (ms since epoch). Missing: it runs from `startedAt`. */
  clockAt?: number;
}

export interface Profile {
  onboarded: boolean;
  /** Your name, what friends see. */
  name?: string;
  /** What the built-in plan trains with. Missing means the gym. */
  kit?: Kit;
}

export interface TrainingState {
  version: 1;
  profile: Profile;
  /** Current per-set target (reps or seconds) by exercise id. */
  reps: Record<string, number>;
  sessions: Session[];
  draft: Draft | null;
  /** The coach: your training profile, its notes, the week it planned, the chat. */
  coach?: CoachState;
  /** Rest days you kept (marked rested), as local dates "2026-11-04". */
  rested?: string[];
}

export function initialState(): TrainingState {
  return { version: 1, profile: { onboarded: false }, reps: {}, sessions: [], draft: null };
}

/** Loads any stored value as a save; unknown shapes start fresh. */
export function migrate(raw: unknown): TrainingState {
  const fresh = initialState();
  if (!raw || typeof raw !== 'object') return fresh;
  const r = raw as Partial<TrainingState>;
  if (r.version !== 1) return fresh;
  return { ...fresh, ...r, profile: { ...fresh.profile, ...r.profile } };
}

// ---------- weeks ----------

/** Monday-based week key, e.g. "2026-10-26" for the week starting that Monday (local time). */
export function weekKey(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function previousWeekKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return weekKey(new Date(y, m - 1, d - 7));
}

export function sessionsThisWeek(state: Pick<TrainingState, 'sessions'>, now: Date): number {
  const key = weekKey(now);
  return state.sessions.filter((s) => weekKey(new Date(s.date)) === key).length;
}

/** Weeks in a row that hit the weekly goal. This week counts once hit; until then the streak lives on from last week. */
export function weekStreak(state: Pick<TrainingState, 'sessions'>, now: Date): number {
  const counts = new Map<string, number>();
  for (const s of state.sessions) {
    const k = weekKey(new Date(s.date));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let key = weekKey(now);
  if ((counts.get(key) ?? 0) < WEEKLY_GOAL) key = previousWeekKey(key);
  let streak = 0;
  while ((counts.get(key) ?? 0) >= WEEKLY_GOAL) {
    streak += 1;
    key = previousWeekKey(key);
  }
  return streak;
}

// ---------- today's workout ----------

export function repsFor(state: Pick<TrainingState, 'reps'>, slot: Slot): number {
  return state.reps[slot.id] ?? slot.low;
}

/** The built-in plan's days alternate. */
export function dayType(state: Pick<TrainingState, 'sessions'>): DayType {
  return state.sessions.length % 2 === 0 ? 'A' : 'B';
}

export interface WorkoutExercise {
  id: string;
  role: SlotRole;
  name: string;
  move: MoveId;
  cue: string;
  family?: string;
  /** A run: its steps. */
  run?: RunStep[];
  /** The coach's item it came from, with its easier and swap choices. */
  item?: PlanItem;
  unit: 'reps' | 'sec';
  sets: number;
  reps: number;
  slot: Slot;
}

/** Warm-ups and stretches are one tap, not sets to log. */
export const isTap = (q: Pick<WorkoutExercise, 'role'>) => q.role === 'warmup' || q.role === 'stretch';

function exercise(state: TrainingState, slot: Slot): WorkoutExercise {
  return { id: slot.id, role: slot.role, name: slot.name, move: slot.move ?? (slot.id as MoveId), cue: slot.cue ?? cueOf(slot.id), unit: slot.unit, sets: slot.sets, reps: repsFor(state, slot), slot };
}

function fromItem(state: TrainingState, it: PlanItem): WorkoutExercise {
  const slot: Slot = { id: it.id, move: it.move, cue: it.cue, name: it.name, role: it.role, unit: it.unit, sets: it.sets, low: it.low, high: it.high, ...(it.weighted ? { weighted: true } : {}) };
  const q = exercise(state, slot);
  // A run's length is the coach's to set, not a target that creeps up.
  return { ...q, family: it.family, item: it, ...(it.run ? { run: it.run, reps: it.low } : {}) };
}

/**
 * The next workout: the coach's next planned day, else the built-in plan's day. A rough day keeps
 * the warm-up and the stretch around one exercise of at most 3 sets.
 */
export function todaysWorkout(state: TrainingState, checkin: Checkin = state.draft?.checkin ?? 'normal'): WorkoutExercise[] {
  const plan = currentPlan(state.coach);
  const list = plan ? plan.items.filter((it) => !it.skipped).map((it) => fromItem(state, it)) : PLAN[state.profile.kit ?? 'gym'][dayType(state)].map((s) => exercise(state, s));
  if (checkin !== 'rough') return list;
  const lead = list.find((q) => !isTap(q));
  return list.filter((q) => isTap(q) || q === lead).map((q) => (q === lead ? { ...q, sets: Math.min(q.sets, 3) } : q));
}

// ---------- finishing ----------

/** The best set of an exercise in the last session that did it. */
function lastBest(state: TrainingState, id: string): number | null {
  const last = state.sessions.findLast((s) => s.entries.some((e) => e.exerciseId === id));
  const entry = last?.entries.find((e) => e.exerciseId === id);
  return entry ? Math.max(...entry.sets.map((x) => x.reps)) : null;
}

/** When the workout's clock started (ms since epoch). */
export const clockStart = (draft: Pick<Draft, 'startedAt' | 'clockAt'>) => draft.clockAt ?? new Date(draft.startedAt).getTime();

export interface FinishResult {
  state: TrainingState;
  session: Session;
}

/**
 * Close the workout under way as a session: raise targets for exercises done cleanly, note whether
 * a set beat last time, tick the coach's day and move its levels. Null when no real set was logged.
 */
export function finishSession(state: TrainingState, now: Date, idGen: () => string = defaultId): FinishResult | null {
  const draft = state.draft;
  if (!draft) return null;
  const workout = todaysWorkout(state, draft.checkin);
  const entries: SessionEntry[] = workout
    .map((q) => ({ exerciseId: q.id, target: q.reps, sets: (draft.sets[q.id] ?? []).slice(0, q.sets), name: q.name, ...(q.family ? { family: q.family } : {}), ...(isTap(q) ? {} : { of: q.sets }) }))
    .filter((e) => e.sets.length > 0);
  if (!entries.some((e) => !isTap(workout.find((q) => q.id === e.exerciseId)!))) return null;

  const left = workout.filter((q) => !isTap(q) && !draft.sets[q.id]?.length).map((q) => q.name);
  const totalSets = workout.reduce((a, q) => a + q.sets, 0);
  const doneSets = entries.reduce((a, e) => a + e.sets.length, 0);
  const kind: Session['kind'] = draft.checkin !== 'rough' && doneSets * 2 >= totalSets ? 'full' : 'mini';

  const reps = { ...state.reps };
  const raised: string[] = [];
  const heavier: string[] = [];
  let better = false;
  const week = weekKey(now);
  const raisesThisWeek = (id: string) => state.sessions.filter((s) => weekKey(new Date(s.date)) === week && s.raised?.includes(id)).length;
  const raisedLastTime = (id: string) => !!state.sessions.findLast((s) => s.entries.some((e) => e.exerciseId === id))?.raised?.includes(id);

  for (const q of workout) {
    const entry = entries.find((e) => e.exerciseId === q.id);
    if (!entry || isTap(q) || q.run) continue;
    const best = lastBest(state, q.id);
    if (best !== null && entry.sets.some((x) => x.reps > best)) better = true;
    // Every set at target with reps to spare: a little more next time. At most twice a week, and a
    // hold only every other time: a second held comes slower than a rep.
    const clean = entry.sets.length >= q.sets && entry.sets.every((x) => x.reps >= q.reps && x.rir !== '0-1');
    if (!clean || raisesThisWeek(q.id) >= MAX_RAISES_PER_WEEK || (q.unit === 'sec' && raisedLastTime(q.id))) continue;
    const step = q.unit === 'sec' ? 5 : 1;
    if (q.reps < q.slot.high) {
      reps[q.id] = Math.min(q.reps + step, q.slot.high);
      raised.push(q.id);
    } else if (q.slot.weighted) {
      reps[q.id] = q.slot.low;
      heavier.push(q.id);
    }
  }

  const plan = currentPlan(state.coach);
  const coachLog: Partial<Session> = plan
    ? {
        mode: plan.mode,
        plannedBy: plan.by,
        ...(plan.items.some((i) => i.skipped) ? { skipped: plan.items.filter((i) => i.skipped).map((i) => i.id) } : {}),
        ...(plan.items.some((i) => i.changed) ? { changed: plan.items.filter((i) => i.changed).map((i) => ({ from: i.changed!.from, to: i.id, how: i.changed!.how })) } : {}),
      }
    : {};
  // How long it really took next to the plan's estimate (a workout left open for hours doesn't count).
  const took = Math.round((now.getTime() - clockStart(draft)) / 60_000);
  const timed: Partial<Session> =
    plan && took >= 1 && took <= MAX_WORKOUT_MINUTES
      ? {
          minutes: took,
          planned: minutesOf(
            plan.items.flatMap((it) => {
              const q = workout.find((x) => x.id === it.id);
              return q ? [{ ...it, sets: q.sets }] : [];
            }),
          ),
        }
      : {};
  const session: Session = {
    id: idGen(),
    date: now.toISOString(),
    kind,
    day: dayType(state),
    entries,
    raised,
    heavier,
    better,
    ...coachLog,
    ...timed,
    ...(draft.checkin !== 'normal' ? { checkin: draft.checkin } : {}),
    ...(left.length ? { left } : {}),
  };
  const sessions = [...state.sessions, session];
  // The day is ticked in the coach's week, and your levels follow how it felt.
  const coach = state.coach && { ...markDone(state.coach, now.toISOString()), ...(state.coach.profile ? { profile: shiftLevels(state.coach.profile, sessions, now) } : {}) };
  return { state: { ...state, reps, sessions, draft: null, ...(coach ? { coach } : {}) }, session };
}

/**
 * A workout left open on an earlier day is saved on the day it was done, so its sets still count
 * and don't mix into today's. Half a day of grace for a late workout that runs past midnight.
 */
export function closeStaleDraft(state: TrainingState, now: Date): TrainingState {
  const draft = state.draft;
  if (!draft) return state;
  const started = new Date(draft.startedAt);
  const stale = started.toDateString() !== now.toDateString() && now.getTime() - started.getTime() > STALE_DRAFT_HOURS * 3_600_000;
  if (!stale) return state;
  return finishSession(state, started)?.state ?? { ...state, draft: null };
}

function defaultId(): string {
  return Math.random().toString(36).slice(2, 10);
}
