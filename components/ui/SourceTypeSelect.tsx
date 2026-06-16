"use client";

import type { SourceType } from "@/types";

interface Props {
  value: SourceType;
  onChange: (value: SourceType) => void;
  disabled?: boolean;
}

export const SOURCE_LABELS: Record<SourceType, string> = {
  sendflow: "Sendflow",
  devzapp: "Devzapp",
  manual: "Manual (link direto)",
  other: "Outra plataforma",
};

export function SourceTypeSelect({ value, onChange, disabled }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SourceType)}
      disabled={disabled}
      className="block w-full rounded-lg border border-white/[0.08] bg-surface-secondary text-ink-primary px-3 py-2.5 text-sm focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 disabled:opacity-50 transition-colors"
    >
      {Object.entries(SOURCE_LABELS).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}
