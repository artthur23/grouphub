"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Loader2, AlertCircle, Filter } from "lucide-react";
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

  const PER_PAGE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(PER_PAGE),
      });
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

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Filter size={14} />
          Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por lista..."
              value={searchName}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <select
            value={filterSource}
            onChange={(e) => { setFilterSource(e.target.value as SourceType | ""); applyFilter(); }}
            className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todas as fontes</option>
            {Object.entries(SOURCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as GroupStatus | ""); applyFilter(); }}
            className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
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
            className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            placeholder="De"
          />

          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => { setFilterDateTo(e.target.value); applyFilter(); }}
            className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Até"
          />
        </div>
      </div>

      {/* Cabeçalho com total e export */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} grupo(s) encontrado(s)
          {total > PER_PAGE && ` — página ${page} de ${totalPages}`}
        </p>
        <ExportCsvButton
          data={groups}
          filename="grupos.csv"
          onFetchAll={fetchAllForExport}
        />
      </div>

      {/* Estado de loading */}
      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          Carregando...
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 py-4 text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && !error && groups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">Nenhum grupo encontrado</p>
          <p className="text-sm mt-1">
            {debouncedSearchName || filterSource || filterStatus
              ? "Tente ajustar os filtros."
              : "Quando os monitoramentos rodarem, os grupos aparecerão aqui."}
          </p>
        </div>
      )}

      {/* Tabela */}
      {!loading && groups.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Link do grupo</th>
                <th className="px-4 py-3 text-left">Lista</th>
                <th className="px-4 py-3 text-left">Fonte</th>
                <th className="px-4 py-3 text-left">Hash</th>
                <th className="px-4 py-3 text-center">Puxado em</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-xs">
                    <a
                      href={g.group_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono text-xs truncate block max-w-[220px]"
                      title={g.group_link}
                    >
                      {g.group_link}
                    </a>
                    {g.error_message && (
                      <div className="text-xs text-red-500 mt-0.5">{g.error_message}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{g.list_name}</td>
                  <td className="px-4 py-3 text-gray-600">{SOURCE_LABELS[g.source_type]}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-500 truncate block max-w-[100px]" title={g.group_hash}>
                      {g.group_hash}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">
                    {format(new Date(g.pulled_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={g.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CopyButton text={g.group_link} />
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
            className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
