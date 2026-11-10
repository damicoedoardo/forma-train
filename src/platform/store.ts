import { initialState, migrate, type TrainingState } from '@/features/training/session';

/* The save on this phone, in localStorage. The React hook that holds it is
   src/features/training/ui/useTraining.ts; every change goes through its update(fn). */

const KEY = 'forma-train-v1';
/** A separate save for trying things (open the app with ?sandbox): the real save is never read or written. */
const SANDBOX_KEY = 'forma-train-sandbox-v1';

export function inSandbox(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('sandbox');
}

const key = () => (inSandbox() ? SANDBOX_KEY : KEY);

export function loadSave(): TrainingState {
  try {
    const raw = localStorage.getItem(key());
    if (raw) return migrate(JSON.parse(raw));
  } catch {
    // Private mode or corrupt data: start fresh rather than crash.
  }
  return initialState();
}

export function writeSave(state: TrainingState) {
  try {
    localStorage.setItem(key(), JSON.stringify(state));
  } catch {
    // Storage full or blocked; the in-memory state still works for this visit.
  }
}

/** Start over: drop this page's save, then reload. Sign-in stays. */
export function wipeSave() {
  try {
    localStorage.removeItem(key());
  } catch {
    // Storage blocked: there was no save to drop.
  }
  window.location.reload();
}
