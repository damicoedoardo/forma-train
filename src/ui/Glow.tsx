/** The soft blue light behind a screen. Decoration only. */
export function Glow({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-accent-glow opacity-20 blur-[110px] ${className}`} />;
}
