'use client';

export type Option<T extends string> = { value: T; label: string };

/** A row of choices inside one glass tray; the picked one is lit. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T | null; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="glass grid gap-1 rounded-[22px] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`h-12 rounded-[18px] text-[15px] transition-colors ${on ? 'bg-white/[0.14] font-medium text-ink' : 'text-ink-muted'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
