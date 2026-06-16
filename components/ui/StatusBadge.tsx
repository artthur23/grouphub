"use client";

import type { MonitoringStatus, RunStatus, GroupStatus } from "@/types";

type Status = MonitoringStatus | RunStatus | GroupStatus;

const CONFIG: Record<Status, { label: string; classes: string }> = {
  active:   { label: "Ativo",   classes: "bg-green-100 text-green-800" },
  paused:   { label: "Pausado", classes: "bg-yellow-100 text-yellow-800" },
  error:    { label: "Erro",    classes: "bg-red-100 text-red-800" },
  running:  { label: "Rodando", classes: "bg-blue-100 text-blue-800" },
  success:  { label: "Sucesso", classes: "bg-green-100 text-green-800" },
  invalid:  { label: "Inválido",classes: "bg-gray-100 text-gray-600" },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = CONFIG[status] ?? { label: status, classes: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
