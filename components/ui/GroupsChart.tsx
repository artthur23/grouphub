"use client";

import { BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartItem {
  name: string;
  grupos: number;
}

interface Props {
  data: ChartItem[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "#0B0D10",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "8px",
  color: "#F8FAFC",
  fontSize: "12px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

export function GroupsChart({ data }: Props) {
  const hasData = data.length > 0 && data.some((d) => d.grupos > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-ink-muted">
        <BarChart2 size={28} className="opacity-25" />
        <p className="text-xs">Nenhum dado disponível ainda</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 4 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.04)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fill: "#64748B", fontSize: 10 }}
          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#64748B", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(255,255,255,0.025)" }}
          formatter={(value) => [value, "Grupos"]}
          labelStyle={{ color: "#94A3B8", marginBottom: 4 }}
        />
        <Bar
          dataKey="grupos"
          fill="#22C55E"
          radius={[4, 4, 0, 0]}
          maxBarSize={44}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
