import { Icon } from './Icon';

export function QtyInput({ value, onChange, min = 1, max = 99, small, label = 'Quantité' }: { value: number; onChange: (v: number) => void; min?: number; max?: number; small?: boolean; label?: string }) {
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.floor(v) || min));
  return (
    <div className={`qty ${small ? 'qty--sm' : ''}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label="Diminuer la quantité"><Icon name="minus" /></button>
      <input
        type="number" inputMode="numeric" min={min} max={max} value={value} aria-label={label}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
      />
      <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label="Augmenter la quantité"><Icon name="plus" /></button>
    </div>
  );
}
