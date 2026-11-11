import { COACHING } from './coaching';
import type { MoveId } from './movements';
import { exerciseById, type LibraryExercise } from './library';
import { videoOf, type Video } from './videos';

/* An exercise's page: the how-to video, what to do and what to avoid, and the muscles it works.
   Works for library ids (`Pushups`), FORMA's own moves with or without the `forma:` prefix, and
   built-in plan ids that are only a move (the coaching of that move). */

export interface Guide {
  name: string;
  video: Video | null;
  /** What to do, most important first. */
  dos: string[];
  /** What to avoid. */
  donts: string[];
  /** "Chest · triceps", for a line under the name. */
  muscles: string;
}

const MAX = 4;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function guideFor(all: LibraryExercise[], q: { id: string; name: string; move?: string }): Guide {
  const x = exerciseById(all, q.id) ?? exerciseById(all, `forma:${q.id}`);
  const coach = x ?? COACHING[(q.move ?? q.id) as MoveId];
  const muscles = x ? [...x.primary, ...x.secondary].slice(0, 3).map(cap).join(' · ') : '';
  return {
    name: q.name,
    video: videoOf(x?.id ?? q.id),
    dos: coach?.tips.slice(0, MAX) ?? [],
    donts: coach?.mistakes.slice(0, MAX) ?? [],
    muscles,
  };
}
