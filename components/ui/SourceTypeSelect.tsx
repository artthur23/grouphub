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
      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
    >
      {Object.entries(SOURCE_LABELS).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}
