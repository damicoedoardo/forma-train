import { exerciseById, type LibraryExercise } from './library';

/* Two photos of an exercise, the start and the end of the move, from the open catalog
   (free-exercise-db, public domain). Shown one after the other they read like a short loop.
   FORMA's own moves and the runs have none. */

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export function photosOf(all: LibraryExercise[], id: string): [string, string] | null {
  const x = exerciseById(all, id);
  if (!x || x.source !== 'catalog') return null;
  const at = (n: number) => `${BASE}/${encodeURIComponent(x.id)}/${n}.jpg`;
  return [at(0), at(1)];
}
