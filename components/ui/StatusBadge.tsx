"use client";

import type { MonitoringStatus, RunStatus, GroupStatus } from "@/types";

type Status = MonitoringStatus | RunStatus | GroupStatus;

const CONFIG: Record<Status, { label: string; dot: string; classes: string }> = {
  active:  { label: "Ativo",    dot: "bg-brand-500",   classes: "bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20" },
  paused:  { label: "Pausado",  dot: "bg-yellow-500",  classes: "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20" },
  error:   { label: "Erro",     dot: "bg-red-500",     classes: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" },
  running: { label: "Rodando",  dot: "bg-blue-400",    classes: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20" },
  success: { label: "Sucesso",  dot: "bg-brand-500",   classes: "bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20" },
  invalid: { label: "Inválido", dot: "bg-ink-muted",   classes: "bg-white/[0.04] text-ink-muted ring-1 ring-white/[0.08]" },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = CONFIG[status] ?? {
    label: status,
    dot: "bg-ink-muted",
    classes: "bg-white/[0.04] text-ink-muted ring-1 ring-white/[0.08]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
