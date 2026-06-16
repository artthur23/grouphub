"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Radio, Users, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { StatsCard } from "@/components/ui/StatsCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SOURCE_LABELS } from "@/components/ui/SourceTypeSelect";
import type { NavId } from "@/components/layout/Sidebar";
import type { SourceType, MonitoringStatus, GroupStatus } from "@/types";

interface DashboardStats {
  sources: { total: number; active: number; paused: number; error: number };
  groups: { total: number; active: number; invalid: number; error: number; today: number };
  recentSources: {
    id: string;
    list_name: string;
    source_type: SourceType;
    status: MonitoringStatus;
    total_groups_found: number;
    last_run_at: string | null;
  }[];
  recentGroups: {
    id: string;
    group_name: string | null;
    list_name: string;
    status: GroupStatus;
    pulled_at: string;
  }[];
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return format(new Date(iso), "dd/MM/yy HH:mm", { locale: ptBR });
}

export function DashboardHome({ onNavigate }: { onNavigate: (id: NavId) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard-stats")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Falha ao carregar painel");
        setStats(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro desconhecido"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-gray-500 dark:text-gray-400">
        <Loader2 size={18} className="animate-spin" />
        Carregando painel...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 py-6 text-red-600 dark:text-red-400">
        <AlertCircle size={16} />
        {error ?? "Erro desconhecido"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Monitoramentos Ativos"
          value={stats.sources.active}
          subtitle={`${stats.sources.total} cadastrado(s) no total`}
          icon={Radio}
          color="green"
        />
        <StatsCard
          title="Grupos Puxados"
          value={stats.groups.total}
          subtitle={`${stats.groups.today} hoje`}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Grupos Válidos"
          value={stats.groups.active}
          subtitle="Links ativos confirmados"
          icon={CheckCircle2}
          color="purple"
        />
        <StatsCard
          title="Grupos Inválidos"
          value={stats.groups.invalid + stats.groups.error}
          subtitle="Expirados, removidos ou com erro"
          icon={XCircle}
          color="orange"
        />
      </div>

      {/* Recent sources */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Monitoramentos Recentes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Última atualização por fonte</p>
          </div>
          <button onClick={() => onNavigate("sources")} className="text-xs text-green-600 dark:text-green-400 hover:underline">
            Ver todos →
          </button>
        </div>

        {stats.recentSources.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600 py-6 text-center">Nenhum monitoramento cadastrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {stats.recentSources.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      s.status === "active" ? "bg-green-500" : s.status === "paused" ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{s.list_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{SOURCE_LABELS[s.source_type]}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.total_groups_found} grupos</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{formatDate(s.last_run_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent groups */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Grupos Recentes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Últimos grupos puxados</p>
          </div>
          <button onClick={() => onNavigate("groups")} className="text-xs text-green-600 dark:text-green-400 hover:underline">
            Ver todos →
          </button>
        </div>

        {stats.recentGroups.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600 py-6 text-center">Nenhum grupo puxado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-2 text-left font-medium">Grupo</th>
                  <th className="pb-2 text-left font-medium">Lista</th>
                  <th className="pb-2 text-center font-medium">Status</th>
                  <th className="pb-2 text-left font-medium">Puxado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {stats.recentGroups.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-2.5 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                      {g.group_name ?? <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="py-2.5 text-gray-600 dark:text-gray-400">{g.list_name}</td>
                    <td className="py-2.5 text-center"><StatusBadge status={g.status} /></td>
                    <td className="py-2.5 text-xs text-gray-500 dark:text-gray-400">{formatDate(g.pulled_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
