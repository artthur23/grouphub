"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Radio, Users, CheckCircle2, XCircle, Loader2, AlertCircle, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/ui/StatsCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GroupsChart } from "@/components/ui/GroupsChart";
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

const STAT_CARDS = (stats: DashboardStats) => [
  {
    title: "Monitoramentos Ativos",
    value: stats.sources.active,
    subtitle: `${stats.sources.total} cadastrado(s) no total`,
    icon: Radio,
    color: "green" as const,
  },
  {
    title: "Grupos Puxados",
    value: stats.groups.total,
    subtitle: `${stats.groups.today} hoje`,
    icon: Users,
    color: "blue" as const,
  },
  {
    title: "Grupos Válidos",
    value: stats.groups.active,
    subtitle: "Links ativos confirmados",
    icon: CheckCircle2,
    color: "purple" as const,
  },
  {
    title: "Grupos Inválidos",
    value: stats.groups.invalid + stats.groups.error,
    subtitle: "Expirados, removidos ou com erro",
    icon: XCircle,
    color: "orange" as const,
  },
];

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
      <div className="flex items-center gap-3 py-20 justify-center text-ink-muted">
        <Loader2 size={18} className="animate-spin text-brand-500" />
        <span className="text-sm">Carregando painel...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-400">
        <AlertCircle size={16} />
        <span className="text-sm">{error ?? "Erro desconhecido"}</span>
      </div>
    );
  }

  const chartData = stats.recentSources.map((s) => ({
    name: s.list_name.length > 13 ? s.list_name.slice(0, 13) + "…" : s.list_name,
    grupos: s.total_groups_found,
  }));

  return (
    <div className="space-y-5">
      {/* Stats grid com stagger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS(stats).map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.25, ease: "easeOut" }}
          >
            <StatsCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Gráfico + Monitoramentos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="bg-surface-card rounded-xl border border-white/[0.08] p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-1.5 rounded-md bg-brand-500/10 ring-1 ring-brand-500/20">
              <BarChart2 size={14} className="text-brand-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-primary">Grupos por Monitoramento</h3>
              <p className="text-[11px] text-ink-muted mt-0.5">Total coletado por fonte ativa</p>
            </div>
          </div>
          <div className="h-48">
            <GroupsChart data={chartData} />
          </div>
        </div>

        {/* Monitoramentos recentes */}
        <div className="bg-surface-card rounded-xl border border-white/[0.08] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-primary">Monitoramentos Recentes</h3>
              <p className="text-[11px] text-ink-muted mt-0.5">Última atualização por fonte</p>
            </div>
            <button
              onClick={() => onNavigate("sources")}
              className="text-xs text-brand-500 hover:text-brand-400 transition-colors"
            >
              Ver todos →
            </button>
          </div>

          {stats.recentSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-ink-muted">
              <Radio size={24} className="opacity-25" />
              <p className="text-sm">Nenhum monitoramento cadastrado.</p>
              <button
                onClick={() => onNavigate("create")}
                className="text-xs text-brand-500 hover:text-brand-400 transition-colors mt-1"
              >
                Adicionar agora →
              </button>
            </div>
          ) : (
            <div className="space-y-0">
              {stats.recentSources.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        s.status === "active"
                          ? "bg-brand-500"
                          : s.status === "paused"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />
                    <div>
                      <div className="text-[13px] font-medium text-ink-primary">{s.list_name}</div>
                      <div className="text-[11px] text-ink-muted">{SOURCE_LABELS[s.source_type]}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold text-ink-primary">{s.total_groups_found}</div>
                    <div className="text-[10px] text-ink-muted">{formatDate(s.last_run_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grupos recentes */}
      <div className="bg-surface-card rounded-xl border border-white/[0.08] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink-primary">Grupos Recentes</h3>
            <p className="text-[11px] text-ink-muted mt-0.5">Últimos grupos puxados pelos monitoramentos</p>
          </div>
          <button
            onClick={() => onNavigate("groups")}
            className="text-xs text-brand-500 hover:text-brand-400 transition-colors"
          >
            Ver todos →
          </button>
        </div>

        {stats.recentGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-ink-muted">
            <Users size={24} className="opacity-25" />
            <p className="text-sm">Nenhum grupo puxado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-2.5 text-left text-[11px] font-medium text-ink-muted uppercase tracking-wider">Grupo</th>
                  <th className="pb-2.5 text-left text-[11px] font-medium text-ink-muted uppercase tracking-wider">Lista</th>
                  <th className="pb-2.5 text-center text-[11px] font-medium text-ink-muted uppercase tracking-wider">Status</th>
                  <th className="pb-2.5 text-left text-[11px] font-medium text-ink-muted uppercase tracking-wider">Puxado em</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentGroups.map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 font-medium text-ink-primary max-w-[200px] truncate">
                      {g.group_name ?? <span className="text-ink-muted italic">—</span>}
                    </td>
                    <td className="py-2.5 text-ink-secondary">{g.list_name}</td>
                    <td className="py-2.5 text-center">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="py-2.5 text-xs text-ink-muted">{formatDate(g.pulled_at)}</td>
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
