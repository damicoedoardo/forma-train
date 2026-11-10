/** A row of big numbers with a small label under each, inside one glass card. */
export function Stats({ items }: { items: { value: string | number; label: string }[] }) {
  return (
    <div className="glass grid rounded-card px-5 py-[18px]" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-0.5">
          <span className="font-display text-[26px] num font-medium leading-8 tracking-[-0.5px]">{it.value}</span>
          <span className="text-[13px] text-ink-muted">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
