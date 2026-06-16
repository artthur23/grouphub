"use client";

interface Props {
  value: number;
  onChange: (value: 30 | 60 | 90) => void;
  disabled?: boolean;
}

export function IntervalSelect({ value, onChange, disabled }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as 30 | 60 | 90)}
      disabled={disabled}
      className="block w-full rounded-lg border border-white/[0.08] bg-surface-secondary text-ink-primary px-3 py-2.5 text-sm focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 disabled:opacity-50 transition-colors"
    >
      <option value={30}>A cada 30 minutos</option>
      <option value={60}>A cada 60 minutos</option>
      <option value={90}>A cada 90 minutos</option>
    </select>
  );
}
