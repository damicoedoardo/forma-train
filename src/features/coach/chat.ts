import type { TrainingState } from '@/features/training/session';
import { coachBrief } from './brief';
import { runTool, type ToolContext } from './tools';
import type { ChatMessage, CoachState, ToolCall } from './types';

/* The chat with the coach: the messages the LLM reads (kept in the save, the recent part only),
   one turn of the talk (ask the model, run the tools it calls here, ask again with their results,
   until it has answered), and what the screen shows of it. */

/** Exchanges kept: the last ten things the player said, each with all the coach did for it.
    Older ones are in the coach's notes and the log. */
export const TURNS_KEEP = 10;
/** Messages kept at most (the api takes 120): whole old exchanges go first when past it. */
export const CHAT_KEEP = 100;
/** Model calls in one turn: enough to search, build and fix a workout, never a loop. The last one
    may not call tools, so every turn ends in words. */
export const MAX_ROUNDS = 8;
/** Said when the coach still found no words (the model kept calling tools). */
export const STUCK = 'I got tangled up there. Could you say that another way?';
/** What the chat starts with when the coach speaks first; never shown. */
export const OPENER = '(The player opened the coach chat.)';

/** What the app asks the coach when a week is due for planning on its own (`aiPlanDue`). Said in
    the chat as the player's turn, never shown; the coach's answer is. */
export const planAsk = (which: 'this' | 'next') =>
  `(The app: ${which === 'next' ? "this week's last workout is done" : 'a new week starts and nothing of it is done yet'}. The week the player sees for ${which} week is the app's plain draft. Read workout_log, plan ${which} week yourself from how training really went, and save it with set_week week "${which}". Then tell the player in two short lines what you saw and what you changed. No questions this time; they can answer if they want.)`;
const hidden = (text: string) => text === OPENER || text.startsWith('(The app: ');

export interface Answer {
  message: Extract<ChatMessage, { role: 'assistant' }>;
  finish_reason: string;
}

/** Ask the model: the brief and the chat in, its next message out. `final`: no tools this time,
    only words. */
export type Ask = (brief: string, messages: ChatMessage[], opts?: { final?: boolean }) => Promise<Answer>;

/** The recent part of the chat: whole exchanges, each starting at something the player said, so
    what stays never shifts or loses its start. The last exchange is always kept whole. */
export function trimChat(chat: ChatMessage[]): ChatMessage[] {
  const starts = chat.flatMap((m, i) => (m.role === 'user' ? [i] : []));
  if (!starts.length) return [];
  let k = Math.max(0, starts.length - TURNS_KEEP);
  while (k < starts.length - 1 && chat.length - starts[k] > CHAT_KEEP) k++;
  return chat.slice(starts[k]);
}

const withChat = (s: TrainingState, chat: ChatMessage[], patch: Partial<CoachState> = {}): TrainingState => ({
  ...s,
  coach: { notes: [], ...s.coach, ...patch, chat: trimChat(chat) },
});

/** What the flame is doing, said while it works: one line per tool it runs. */
export const STEP_LABEL: Record<string, string> = {
  find_exercises: 'Looked through the exercises',
  draft_week: 'Sketched a week',
  show_week: 'Read your week',
  workout_log: 'Read your workouts',
  set_week: 'Wrote your week',
  set_workout: 'Built the workout',
  move_workout: 'Moved a workout',
  rest_day: 'Made a rest day',
  save_profile: 'Remembered you',
  add_note: 'Made a note',
  remove_note: 'Let a note go',
  training_guide: 'Checked the playbook',
};

/** One turn: the player's words (or none, for the coach to open), then the coach until it answers.
    `onStep` hears each tool it ran (STEP_LABEL), so the screen can show it working. */
export async function coachTurn(opts: { text?: string; get: () => TrainingState; set: (fn: (s: TrainingState) => TrainingState) => void; ask: Ask; ctx: () => ToolContext; checkin?: Parameters<typeof coachBrief>[2]; onStep?: (label: string) => void }): Promise<void> {
  const { get, set, ask } = opts;
  const text = opts.text?.trim();
  if (text) set((s) => withChat(s, [...(s.coach?.chat ?? []), { role: 'user', content: text.slice(0, 1000) }], { replies: [] }));
  // Whether the coach said anything this turn: it never ends a turn in silence.
  let spoke = false;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const state = get();
    const chat = state.coach?.chat ?? [];
    // The model only answers a player: an empty chat opens with a hello it never sees as typed.
    const messages: ChatMessage[] = chat.length ? chat : [{ role: 'user', content: OPENER }];
    const final = round === MAX_ROUNDS - 1;
    const { message } = await ask(coachBrief(state, new Date(), opts.checkin), messages, final ? { final } : undefined);
    spoke ||= !!message.content.trim();
    const calls = message.tool_calls ?? [];
    // Tools run on the latest save, and only change the coach's part of it.
    let after = get();
    const results: ChatMessage[] = [];
    let waits = calls.length > 0;
    for (const c of calls) {
      const label = STEP_LABEL[c.function.name];
      if (label) opts.onStep?.(label);
      const run = runTool(after, c.function.name, c.function.arguments, opts.ctx());
      after = run.state;
      waits &&= !!run.waits;
      results.push({ role: 'tool', tool_call_id: c.id, content: run.result });
    }
    const coach = after.coach;
    set((s) => withChat({ ...s, coach: coach ?? s.coach }, [...messages, message, ...results]));
    // Offering replies ends the turn once something was said; replies alone get asked again.
    if (!calls.length || (waits && spoke)) break;
  }
  if (!spoke) set((s) => withChat(s, [...(s.coach?.chat ?? []), { role: 'assistant', content: STUCK }]));
}

/** A line of the chat as the screen shows it. */
export type Shown = { who: 'coach' | 'you'; text: string; key: string } | { who: 'workout'; key: string };

const SHOWN_TOOLS = new Set(['set_workout', 'set_week', 'move_workout', 'rest_day']);

/** Keys come from what a line says, not where it sits, so a line keeps its place on the screen
    when old exchanges are trimmed off the top (no blink, no line played in again). */
export function shownChat(chat: ChatMessage[] | undefined): Shown[] {
  const out: Shown[] = [];
  const seen = new Map<string, number>();
  const key = (k: string) => {
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    return n ? `${k}#${n}` : k;
  };
  for (const m of chat ?? []) {
    if (m.role === 'user' && !hidden(m.content)) out.push({ who: 'you', text: m.content, key: key(`u:${m.content}`) });
    else if (m.role === 'assistant') {
      const text = m.content.trim();
      if (text) out.push({ who: 'coach', text, key: key(`a:${text}`) });
      const shown = (m.tool_calls ?? []).find((c: ToolCall) => SHOWN_TOOLS.has(c.function.name));
      if (shown) out.push({ who: 'workout', key: key(`w:${shown.id}`) });
    }
  }
  return out;
}
