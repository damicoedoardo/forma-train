import type { Gear, Goal, Minutes, Mode } from './types';

/* The first open as a short chat: the coach asks, you answer with a tap (or a few, then Done),
   and it says a word back before the next question. What it says lives here; the screen is
   ui/Setup.tsx. */

export type Ask = 'name' | 'modes' | 'goal' | 'days' | 'minutes' | 'gear';

export const ASKS: Ask[] = ['name', 'modes', 'goal', 'days', 'minutes', 'gear'];

/** Several answers allowed (then Done), or one tap. */
export const MANY: Record<Ask, boolean> = { name: false, modes: true, goal: false, days: false, minutes: false, gear: true };

export const OPTIONS = {
  modes: [
    { value: 'gym', label: 'Gym' },
    { value: 'calisthenics', label: 'Calisthenics' },
    { value: 'running', label: 'Running' },
  ] as { value: Mode; label: string }[],
  goal: [
    { value: 'health', label: 'Feel good' },
    { value: 'strength', label: 'Get stronger' },
    { value: 'muscle', label: 'Build muscle' },
    { value: 'endurance', label: 'Go longer' },
    { value: 'skill', label: 'Learn a skill' },
  ] as { value: Goal; label: string }[],
  days: [2, 3, 4, 5, 6].map((d) => ({ value: d, label: `${d}` })),
  minutes: ([20, 30, 40, 60] as Minutes[]).map((m) => ({ value: m, label: `${m} min` })),
  gear: [
    { value: 'gym', label: 'A gym' },
    { value: 'dumbbells', label: 'Dumbbells' },
    { value: 'bar', label: 'A pull-up bar' },
    { value: 'bands', label: 'Bands' },
    { value: 'none', label: 'Nothing' },
  ] as { value: Gear; label: string }[],
};

export function question(ask: Ask): string {
  switch (ask) {
    case 'name':
      return 'Hi, I’m your coach. What should I call you?';
    case 'modes':
      return 'What do you like to train? Pick all that fit.';
    case 'goal':
      return 'What’s it for, mostly?';
    case 'days':
      return 'How many days a week can you train?';
    case 'minutes':
      return 'And how long each time?';
    case 'gear':
      return 'Last one. What can you train with?';
  }
}

const GOAL_SAYS: Record<Goal, string> = {
  health: 'Feeling good is the best reason.',
  strength: 'Stronger it is.',
  muscle: 'Muscle it is.',
  endurance: 'Going longer it is.',
  skill: 'A new skill. Fun.',
};

const MODE_SAYS: Record<Mode, string> = { gym: 'The gym, good.', calisthenics: 'Bodyweight, good.', running: 'A runner, good.' };

/** What the coach says back to an answer, before the next question (null: nothing). */
export function reaction(ask: Ask, answer: { name?: string; modes?: Mode[]; goal?: Goal; days?: number; minutes?: Minutes }): string | null {
  switch (ask) {
    case 'name':
      return answer.name ? `Nice to meet you, ${answer.name}.` : null;
    case 'modes':
      if (!answer.modes?.length) return null;
      return answer.modes.length > 1 ? 'A good mix.' : MODE_SAYS[answer.modes[0]];
    case 'goal':
      return answer.goal ? GOAL_SAYS[answer.goal] : null;
    case 'days':
      if (!answer.days) return null;
      if (answer.days <= 2) return 'Two days works. We’ll make them count.';
      if (answer.days >= 5) return `${answer.days} days. I’ll keep some of them easy.`;
      return `${answer.days} days, good.`;
    case 'minutes':
      return null;
    case 'gear':
      return 'That’s all I need. Planning your first week…';
  }
}
