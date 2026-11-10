'use client';

export type Option<T extends string> = { value: T; label: string };

/** A row of choices inside one glass tray; the picked one is lit. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T | null; onChange: (v: T) => void; label: string }) {
  const at = options.findIndex((o) => o.value === value);
  return (
    <div role="radiogroup" aria-label={label} className="glass relative grid rounded-[22px] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {/* The lit pill slides to the picked choice. */}
      {at >= 0 && <span aria-hidden className="absolute bottom-1 top-1 rounded-[18px] bg-white/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-300 ease-out" style={{ left: 4, width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${at * 100}%)` }} />}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`relative h-12 rounded-[18px] text-[15px] transition-colors duration-200 ${on ? 'font-medium text-ink' : 'text-ink-muted'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
