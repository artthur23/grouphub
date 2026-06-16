"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Loader2, AlertCircle, Filter, Trash2, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyButton } from "@/components/ui/CopyButton";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";
import { SOURCE_LABELS } from "@/components/ui/SourceTypeSelect";
import type { PulledGroup, SourceType, GroupStatus } from "@/types";

export function PulledGroupsTable() {
  const [groups, setGroups] = useState<PulledGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState("");
  const [debouncedSearchName, setDebouncedSearchName] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [filterSource, setFilterSource] = useState<SourceType | "">("");
  const [filterStatus, setFilterStatus] = useState<GroupStatus | "">("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const PER_PAGE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
      if (debouncedSearchName) params.set("list_name", debouncedSearchName);
      if (filterSource) params.set("source_type", filterSource);
      if (filterStatus) params.set("status", filterStatus);
      if (filterDateFrom) params.set("date_from", filterDateFrom);
      if (filterDateTo) params.set("date_to", filterDateTo);

      const res = await fetch(`/api/pulled-groups?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar grupos");
      const json = await res.json();
      setGroups(json.data);
      setTotal(json.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchName, filterSource, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => { load(); }, [load]);

  function applyFilter() { setPage(1); }

  function handleSearchChange(value: string) {
    setSearchName(value);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchName(value);
      setPage(1);
    }, 300);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este grupo da lista? Esta ação não pode ser desfeita.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/pulled-groups/${id}`, { method: "DELETE" });
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setTotal((prev) => prev - 1);
    } finally {
      setDeletingId(null);
    }
  }

  async function fetchAllForExport(): Promise<PulledGroup[]> {
    const params = new URLSearchParams({ export: "1" });
    if (debouncedSearchName) params.set("list_name", debouncedSearchName);
    if (filterSource) params.set("source_type", filterSource);
    if (filterStatus) params.set("status", filterStatus);
    if (filterDateFrom) params.set("date_from", filterDateFrom);
    if (filterDateTo) params.set("date_to", filterDateTo);
    const res = await fetch(`/api/pulled-groups?${params}`);
    if (!res.ok) throw new Error("Falha ao exportar");
    const json = await res.json();
    return json.data;
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  const inputClass =
    "text-sm border border-white/[0.08] bg-surface-base text-ink-primary placeholder:text-ink-muted rounded-lg px-3 py-2 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-colors w-full";

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-surface-secondary rounded-xl border border-white/[0.06] p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
          <Filter size={12} />
          Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por lista..."
              value={searchName}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`${inputClass} pl-8`}
            />
          </div>

          <select
            value={filterSource}
            onChange={(e) => { setFilterSource(e.target.value as SourceType | ""); applyFilter(); }}
            className={inputClass}
          >
            <option value="">Todas as fontes</option>
            {Object.entries(SOURCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as GroupStatus | ""); applyFilter(); }}
            className={inputClass}
          >
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="invalid">Inválido</option>
            <option value="error">Erro</option>
          </select>

          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => { setFilterDateFrom(e.target.value); applyFilter(); }}
            className={inputClass}
          />

          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => { setFilterDateTo(e.target.value); applyFilter(); }}
            className={inputClass}
          />
        </div>
      </div>

      {/* Cabeçalho com total e export */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted">
          {total} grupo(s) encontrado(s)
          {total > PER_PAGE && ` — página ${page} de ${totalPages}`}
        </p>
        <ExportCsvButton data={groups} filename="grupos.csv" onFetchAll={fetchAllForExport} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-10 justify-center text-ink-muted">
          <Loader2 size={18} className="animate-spin text-brand-500" />
          <span className="text-sm">Carregando...</span>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 py-4 text-red-400">
          <AlertCircle size={15} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Estado vazio */}
      {!loading && !error && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-ink-muted">
          <Users size={32} className="opacity-20" />
          <div className="text-center">
            <p className="text-sm font-medium text-ink-secondary">Nenhum grupo encontrado</p>
            <p className="text-xs mt-1">
              {debouncedSearchName || filterSource || filterStatus
                ? "Tente ajustar os filtros."
                : "Quando os monitoramentos rodarem, os grupos aparecerão aqui."}
            </p>
          </div>
        </div>
      )}

      {/* Tabela */}
      {!loading && groups.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.03] border-b border-white/[0.06]">
              <tr>
                {["Grupo", "Link do grupo", "Lista", "Fonte", "Hash", "Puxado em", "Status", "Ação"].map((h) => (
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
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                  <td
                    className="px-4 py-3 max-w-[160px] truncate text-ink-primary text-[13px] font-medium"
                    title={g.group_name ?? undefined}
                  >
                    {g.group_name ?? <span className="text-ink-muted italic">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <a
                      href={g.group_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-400 hover:text-brand-500 hover:underline font-mono text-xs truncate block max-w-[200px] transition-colors"
                      title={g.group_link}
                    >
                      {g.group_link}
                    </a>
                    {g.error_message && (
                      <div className="text-xs text-red-400 mt-0.5">{g.error_message}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-secondary text-[13px]">{g.list_name}</td>
                  <td className="px-4 py-3 text-ink-muted text-xs">{SOURCE_LABELS[g.source_type]}</td>
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-xs text-ink-muted truncate block max-w-[100px]"
                      title={g.group_hash}
                    >
                      {g.group_hash}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-ink-muted whitespace-nowrap">
                    {format(new Date(g.pulled_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={g.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5">
                      <CopyButton text={g.group_link} />
                      <button
                        onClick={() => handleDelete(g.id)}
                        disabled={deletingId === g.id}
                        title="Excluir"
                        className="inline-flex items-center justify-center p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 ring-1 ring-red-500/20 disabled:opacity-50 transition-all"
                      >
                        {deletingId === g.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Trash2 size={11} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] text-ink-secondary hover:bg-white/[0.04] hover:text-ink-primary disabled:opacity-40 transition-all"
          >
            Anterior
          </button>
          <span className="text-xs text-ink-muted px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/[0.08] text-ink-secondary hover:bg-white/[0.04] hover:text-ink-primary disabled:opacity-40 transition-all"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
