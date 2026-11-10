/** Forma's mark: the five-part ring from the app icon, one part lit, and the name. */
export function Mark({ className = '' }: { className?: string }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const gap = 5.2;
  const seg = c / 5 - gap;
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg width="18" height="18" viewBox="0 0 18 18" className="-rotate-90" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <circle key={i} cx="9" cy="9" r={r} fill="none" strokeWidth="2" strokeLinecap="round" stroke={i === 0 ? '#8C84F3' : '#ECECEF'} strokeDasharray={`${seg} ${c - seg}`} strokeDashoffset={-(i * (c / 5) + gap / 2)} />
        ))}
      </svg>
      <span className="font-display text-[17px] font-medium tracking-[-0.3px]">Forma</span>
    </span>
  );
}
