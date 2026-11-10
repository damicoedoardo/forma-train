/* A workout's title, short for screens. Built-in titles read "Calisthenics, day A: pull, push,
   squat": the part after the colon is the day, the part before is the kind. A coach's own title
   has no colon and stays whole. */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Pull, push, squat". */
export function shortTitle(title: string): string {
  const i = title.indexOf(':');
  return i < 0 ? title : cap(title.slice(i + 1).trim()) || title;
}

/** "Calisthenics", or null when the title has no kind. */
export function titleKind(title: string): string | null {
  const i = title.indexOf(':');
  return i < 0 ? null : title.slice(0, i).replace(/,\s*day\s+\w+$/i, '').trim() || null;
}
