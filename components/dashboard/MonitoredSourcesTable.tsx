"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, Play, Pause, RotateCcw, Loader2, AlertCircle } from "lucide-react";
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

  if (loading) return (
    <div className="flex items-center gap-2 py-8 justify-center text-gray-500">
      <Loader2 size={18} className="animate-spin" />
      Carregando monitoramentos...
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 py-6 text-red-600">
      <AlertCircle size={16} />
      {error}
    </div>
  );

  if (sources.length === 0) return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-lg font-medium">Nenhum monitoramento cadastrado</p>
      <p className="text-sm mt-1">Cadastre seu primeiro link na aba "Cadastrar".</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{sources.length} monitoramento(s) cadastrado(s)</p>

      {/* Modal de edição */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-lg">Editar monitoramento</h3>
            <div>
              <label className="text-sm font-medium text-gray-700">Link de origem</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={editing.source_url}
                onChange={(e) => setEditing({ ...editing, source_url: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nome da lista</label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={editing.list_name}
                onChange={(e) => setEditing({ ...editing, list_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Fonte</label>
              <SourceTypeSelect
                value={editing.source_type}
                onChange={(v) => setEditing({ ...editing, source_type: v })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Frequência</label>
              <IntervalSelect
                value={editing.interval_minutes}
                onChange={(v) => setEditing({ ...editing, interval_minutes: v })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 rounded-md bg-green-600 text-white py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-60"
              >
                {savingEdit ? "Salvando..." : "Salvar"}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-md border border-gray-300 py-2 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Lista / Fonte</th>
              <th className="px-4 py-3 text-left">Link de origem</th>
              <th className="px-4 py-3 text-center">Frequência</th>
              <th className="px-4 py-3 text-center">Última exec.</th>
              <th className="px-4 py-3 text-center">Próxima exec.</th>
              <th className="px-4 py-3 text-center">Grupos</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sources.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{s.list_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{SOURCE_LABELS[s.source_type]}</div>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate block max-w-[200px]"
                    title={s.source_url}
                  >
                    {s.source_url}
                  </a>
                  {s.last_error_message && (
                    <div className="text-xs text-red-600 mt-0.5 truncate" title={s.last_error_message}>
                      ⚠ {s.last_error_message}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{s.interval_minutes}min</td>
                <td className="px-4 py-3 text-center text-gray-600 text-xs">{formatDate(s.last_run_at)}</td>
                <td className="px-4 py-3 text-center text-gray-600 text-xs">{formatDate(s.next_run_at)}</td>
                <td className="px-4 py-3 text-center font-semibold text-gray-800">{s.total_groups_found}</td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-center flex-wrap">
                    <RunNowButton
                      sourceId={s.id}
                      onSuccess={() => load()}
                    />
                    <button
                      onClick={() => handleToggleStatus(s)}
                      disabled={togglingId === s.id}
                      title={s.status === "active" ? "Pausar" : "Reativar"}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-800 disabled:opacity-50"
                    >
                      {togglingId === s.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : s.status === "active" ? (
                        <Pause size={12} />
                      ) : (
                        <RotateCcw size={12} />
                      )}
                      {s.status === "active" ? "Pausar" : "Reativar"}
                    </button>
                    <button
                      onClick={() => setEditing({
                        id: s.id,
                        source_url: s.source_url,
                        list_name: s.list_name,
                        source_type: s.source_type,
                        interval_minutes: s.interval_minutes,
                      })}
                      title="Editar"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      title="Excluir"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-800 disabled:opacity-50"
                    >
                      {deletingId === s.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
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
