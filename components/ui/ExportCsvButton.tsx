"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { PulledGroup } from "@/types";

interface Props {
  data: PulledGroup[];
  filename?: string;
  onFetchAll?: () => Promise<PulledGroup[]>;
}

export function ExportCsvButton({ data, filename = "grupos.csv", onFetchAll }: Props) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const rows = onFetchAll ? await onFetchAll() : data;
      if (rows.length === 0) return;

      const headers = [
        "Nome do Grupo",
        "Link do Grupo",
        "Nome da Lista",
        "Fonte",
        "Hash do Grupo",
        "Puxado em",
        "Status",
      ];

      const csvRows = rows.map((g) => [
        g.group_name ?? "",
        g.group_link,
        g.list_name,
        g.source_type,
        g.group_hash,
        new Date(g.pulled_at).toLocaleString("pt-BR"),
        g.status,
      ]);

      const csv = [headers, ...csvRows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const isEmpty = data.length === 0 && !onFetchAll;

  return (
    <button
      onClick={handleExport}
      disabled={exporting || isEmpty}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-ink-secondary hover:text-ink-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {exporting ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Download size={13} />
      )}
      {exporting
        ? "Exportando..."
        : onFetchAll
        ? "Exportar todos (CSV)"
        : `Exportar CSV (${data.length})`}
    </button>
  );
}
