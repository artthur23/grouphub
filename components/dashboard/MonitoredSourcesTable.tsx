"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, Play, Pause, RotateCcw, Loader2, AlertCircle, Radio } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RunNowButton } from "@/components/ui/RunNowButton";
import { SOURCE_LABELS } from "@/components/ui/SourceTypeSelect";
import { IntervalSelect } from "@/components/ui/IntervalSelect";
import { SourceTypeSelect } from "@/components/ui/SourceTypeSelect";
import type { MonitoredSource, SourceType } from "@/types";

interface EditingState {
  id: string;
  source_url: string;
  list_name: string;
  source_type: SourceType;
  interval_minutes: 30 | 60 | 90;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return format(new Date(iso), "dd/MM/yy HH:mm", { locale: ptBR });
}

export function MonitoredSourcesTable() {
  const [sources, setSources] = useState<MonitoredSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/monitored-sources");
      if (!res.ok) throw new Error("Falha ao carregar monitoramentos");
      setSources(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggleStatus(source: MonitoredSource) {
    setTogglingId(source.id);
    const newStatus = source.status === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/monitored-sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Falha ao alterar status");
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? { ...s, status: newStatus } : s))
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este monitoramento e todos os grupos associados? Esta ação não pode ser desfeita.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/monitored-sources/${id}`, { method: "DELETE" });
      setSources((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/monitored-sources/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_url: editing.source_url,
          list_name: editing.list_name,
          source_type: editing.source_type,
          interval_minutes: editing.interval_minutes,
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      const updated = await res.json();
      setSources((prev) => prev.map((s) => (s.id === editing.id ? updated : s)));
      setEditing(null);
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 justify-center text-ink-muted">
        <Loader2 size={18} className="animate-spin text-brand-500" />
        <span className="text-sm">Carregando monitoramentos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-6 text-red-400">
        <AlertCircle size={16} />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 text-ink-muted">
        <Radio size={32} className="opacity-20" />
        <div className="text-center">
          <p className="text-sm font-medium text-ink-secondary">Nenhum monitoramento cadastrado</p>
          <p className="text-xs mt-1">Cadastre seu primeiro link na aba &quot;Cadastrar&quot;.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-muted">{sources.length} monitoramento(s) cadastrado(s)</p>

      {/* Modal de edição */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-card border border-white/[0.12] rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4 mx-4">
            <h3 className="font-semibold text-base text-ink-primary">Editar monitoramento</h3>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">Link de origem</label>
              <input
                className="block w-full rounded-lg border border-white/[0.08] bg-surface-secondary text-ink-primary px-3 py-2 text-sm placeholder:text-ink-muted focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-colors"
                value={editing.source_url}
                onChange={(e) => setEditing({ ...editing, source_url: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">Nome da lista</label>
              <input
                className="block w-full rounded-lg border border-white/[0.08] bg-surface-secondary text-ink-primary px-3 py-2 text-sm placeholder:text-ink-muted focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-colors"
                value={editing.list_name}
                onChange={(e) => setEditing({ ...editing, list_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">Fonte</label>
              <SourceTypeSelect
                value={editing.source_type}
                onChange={(v) => setEditing({ ...editing, source_type: v })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">Frequência</label>
              <IntervalSelect
                value={editing.interval_minutes}
                onChange={(v) => setEditing({ ...editing, interval_minutes: v })}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white py-2 text-sm font-medium disabled:opacity-60 transition-colors"
              >
                {savingEdit ? "Salvando..." : "Salvar"}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-lg border border-white/[0.08] text-ink-secondary hover:bg-white/[0.04] py-2 text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] border-b border-white/[0.06]">
            <tr>
              {["Lista / Fonte", "Link de origem", "Frequência", "Última exec.", "Próxima exec.", "Grupos", "Status", "Ações"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-medium text-ink-muted uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sources.map((s) => (
              <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink-primary text-[13px]">{s.list_name}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{SOURCE_LABELS[s.source_type]}</div>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:text-brand-500 hover:underline truncate block max-w-[200px] text-xs transition-colors"
                    title={s.source_url}
                  >
                    {s.source_url}
                  </a>
                  {s.last_error_message && (
                    <div className="text-xs text-red-400 mt-0.5 truncate" title={s.last_error_message}>
                      ⚠ {s.last_error_message}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-ink-secondary text-xs">{s.interval_minutes}min</td>
                <td className="px-4 py-3 text-center text-ink-muted text-xs">{formatDate(s.last_run_at)}</td>
                <td className="px-4 py-3 text-center text-ink-muted text-xs">{formatDate(s.next_run_at)}</td>
                <td className="px-4 py-3 text-center font-semibold text-ink-primary text-[13px]">{s.total_groups_found}</td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 justify-center flex-wrap">
                    <RunNowButton sourceId={s.id} onSuccess={() => load()} />
                    <button
                      onClick={() => handleToggleStatus(s)}
                      disabled={togglingId === s.id}
                      title={s.status === "active" ? "Pausar" : "Reativar"}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/20 disabled:opacity-50 transition-all"
                    >
                      {togglingId === s.id ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : s.status === "active" ? (
                        <Pause size={11} />
                      ) : (
                        <RotateCcw size={11} />
                      )}
                      {s.status === "active" ? "Pausar" : "Reativar"}
                    </button>
                    <button
                      onClick={() =>
                        setEditing({
                          id: s.id,
                          source_url: s.source_url,
                          list_name: s.list_name,
                          source_type: s.source_type,
                          interval_minutes: s.interval_minutes,
                        })
                      }
                      title="Editar"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-ink-secondary ring-1 ring-white/[0.06] transition-all"
                    >
                      <Pencil size={11} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      title="Excluir"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 ring-1 ring-red-500/20 disabled:opacity-50 transition-all"
                    >
                      {deletingId === s.id ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Trash2 size={11} />
                      )}
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
