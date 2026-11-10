/** A round avatar: the photo when there is one, else the initials on a quiet tone. */
export function Avatar({ name, src, size = 36, className = '' }: { name: string; src?: string | null; size?: number; className?: string }) {
  const letters =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '·';
  // One of a few dark tones, the same for the same name.
  const tones = ['#3A3F55', '#4A4136', '#36474A', '#463A4D'];
  const tone = tones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % tones.length];
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium text-ink ${className}`}
      style={{ width: size, height: size, background: tone, fontSize: Math.round(size * 0.38) }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : letters}
    </div>
  );
}
