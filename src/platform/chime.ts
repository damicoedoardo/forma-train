/* A soft two-note chime, made in the browser (no sound file). Phones only let a page play sound
   after a tap, so call `armChime()` from a tap first; `chime()` is then free to ring later. */

let ctx: AudioContext | null = null;

/** Get the sound ready. Call it from a tap (Log set). */
export function armChime(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** Ring: two quiet notes, the second a fifth up. Does nothing if sound is not ready. */
export function chime(): void {
  if (!ctx || ctx.state !== "running") return;
  const t = ctx.currentTime;
  [
    [660, 0],
    [990, 0.16],
  ].forEach(([hz, at]) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0, t + at);
    gain.gain.linearRampToValueAtTime(0.12, t + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.6);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(t + at);
    osc.stop(t + at + 0.65);
  });
}
