"use client";

interface Props {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: "green" | "blue" | "purple" | "orange";
}

const ICON_STYLES: Record<Props["color"], string> = {
  green:  "bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20",
  blue:   "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  purple: "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20",
  orange: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
};

export function StatsCard({ title, value, subtitle, icon: Icon, color }: Props) {
  return (
    <div className="bg-surface-card rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.14] transition-all duration-200">
      <div className={`inline-flex p-2.5 rounded-lg ${ICON_STYLES[color]}`}>
        <Icon size={18} />
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-ink-primary tracking-tight">{value}</div>
        <div className="text-sm font-medium text-ink-secondary mt-1">{title}</div>
        <div className="text-xs text-ink-muted mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}
