/** The light behind a screen: a soft blue one (placed by `className`), and a fainter iris one low
    on the other side, so the dark has a little color to it. Decoration only. */
export function Glow({ className = '' }: { className?: string }) {
  return (
    <>
      <div aria-hidden className={`pointer-events-none absolute h-[420px] w-[420px] rounded-full breathe bg-accent-glow opacity-20 blur-[110px] ${className}`} />
      <div aria-hidden className="pointer-events-none absolute -right-48 bottom-24 h-[380px] w-[380px] rounded-full bg-accent-iris opacity-[0.09] blur-[120px]" />
    </>
  );
}
