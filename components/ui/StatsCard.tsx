"use client";

interface Props {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: "green" | "blue" | "purple" | "orange";
}

const ICON_COLORS: Record<Props["color"], string> = {
  green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
};

export function StatsCard({ title, value, subtitle, icon: Icon, color }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow">
      <div className={`inline-flex p-2.5 rounded-lg ${ICON_COLORS[color]}`}>
        <Icon size={20} />
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{title}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</div>
      </div>
    </div>
  );
}
