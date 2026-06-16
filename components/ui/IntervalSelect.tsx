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
      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-500"
    >
      <option value={30}>A cada 30 minutos</option>
      <option value={60}>A cada 60 minutos</option>
      <option value={90}>A cada 90 minutos</option>
    </select>
  );
}
