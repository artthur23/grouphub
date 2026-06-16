"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Radio, Users, CheckCircle2, XCircle, Loader2, AlertCircle, BarChart2,
  RefreshCw, Bell, User, LogOut, BellOff, Calendar,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { StatsCard } from "@/components/ui/StatsCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GroupsChart } from "@/components/ui/GroupsChart";
import { SOURCE_LABELS } from "@/components/ui/SourceTypeSelect";
import { createClient } from "@/lib/supabase/client";
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

type DatePreset = "today" | "yesterday" | "7days" | "30days" | "all";

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today",     label: "Hoje"    },
  { id: "yesterday", label: "Ontem"   },
  { id: "7days",     label: "7 dias"  },
  { id: "30days",    label: "30 dias" },
  { id: "all",       label: "Tudo"    },
];

function getPresetDates(preset: DatePreset) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  switch (preset) {
    case "today":
      return { from: today, to: now };
    case "yesterday": {
      const from = subDays(today, 1);
      const to = new Date(from);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "7days":
      return { from: subDays(today, 6), to: now };
    case "30days":
      return { from: subDays(today, 29), to: now };
    case "all":
      return { from: new Date(2020, 0, 1), to: now };
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatDateDisplay(d: Date) {
  return format(d, "dd/MM/yyyy", { locale: ptBR });
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

const HERO_BTN =
  "w-9 h-9 rounded-xl bg-surface-secondary border border-white/[0.08] flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:border-white/[0.14] hover:bg-white/[0.04] transition-all relative";

const dropdownBase =
  "absolute right-0 top-full mt-2 z-50 bg-surface-card border border-white/[0.10] rounded-xl shadow-2xl shadow-black/60 overflow-hidden";

export function DashboardHome({ onNavigate }: { onNavigate: (id: NavId) => void }) {
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [datePreset, setDatePreset]     = useState<DatePreset>("today");
  const [dates, setDates]               = useState(() => getPresetDates("today"));
  const [heroDropdown, setHeroDropdown] = useState<"bell" | "profile" | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (heroRef.current && !heroRef.current.contains(e.target as Node)) {
        setHeroDropdown(null);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else { setLoading(true); setError(null); }
    try {
      const res = await fetch("/api/dashboard-stats");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao carregar painel");
      setStats(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  function handlePresetChange(preset: DatePreset) {
    setDatePreset(preset);
    setDates(getPresetDates(preset));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

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

      {/* ── Hero Header ── */}
      <div className="pt-2 pb-4">
          <div className="flex items-start justify-between gap-4">

            {/* Título + saudação */}
            <div>
              <h1 className="text-2xl font-bold text-ink-primary tracking-tight">Visão Geral</h1>
              <p className="text-[13px] text-ink-secondary mt-1.5">
                {getGreeting()}, Arthur · Última corrida do dia.
              </p>
            </div>

            {/* Botões de ação */}
            <div ref={heroRef} className="flex items-center gap-2 shrink-0 mt-0.5">
              {/* Atualizar */}
              <button
                onClick={() => fetchStats(true)}
                title="Atualizar dados"
                className={HERO_BTN}
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin text-brand-500" : ""} />
              </button>

              {/* Notificações */}
              <div className="relative">
                <button
                  onClick={() => setHeroDropdown((p) => (p === "bell" ? null : "bell"))}
                  title="Notificações"
                  className={`${HERO_BTN} ${heroDropdown === "bell" ? "border-white/[0.18] bg-white/[0.06]" : ""}`}
                >
                  <Bell size={15} />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
                </button>
                <AnimatePresence>
                  {heroDropdown === "bell" && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className={`${dropdownBase} w-72`}
                    >
                      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink-primary">Notificações</span>
                        <span className="text-[10px] text-ink-muted bg-white/[0.04] px-1.5 py-0.5 rounded-full">0 novas</span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-ink-muted">
                        <BellOff size={22} className="opacity-25" />
                        <p className="text-xs">Nenhuma notificação ainda</p>
                      </div>
                      <div className="px-4 py-2.5 border-t border-white/[0.06]">
                        <p className="text-[10px] text-ink-muted text-center">
                          Alertas de grupos e monitoramentos aparecerão aqui
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Perfil */}
              <div className="relative">
                <button
                  onClick={() => setHeroDropdown((p) => (p === "profile" ? null : "profile"))}
                  title="Perfil"
                  className={`${HERO_BTN} bg-brand-500/10 border-brand-500/20 hover:border-brand-500/40 ${
                    heroDropdown === "profile" ? "border-brand-500/40" : ""
                  }`}
                >
                  <User size={15} className="text-brand-500" />
                </button>
                <AnimatePresence>
                  {heroDropdown === "profile" && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className={`${dropdownBase} w-56`}
                    >
                      <div className="px-4 py-3.5 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center shrink-0">
                            <User size={16} className="text-brand-500" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-xs font-semibold text-ink-primary truncate">Minha conta</div>
                            <div className="text-[10px] text-ink-muted truncate">GroupHub</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut size={14} className="shrink-0" />
                          Sair
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Filtro de datas */}
          <div className="flex items-center gap-3 mt-6 flex-wrap">
            {/* Seletor de data — input nativo invisível sobreposto */}
            <div className="relative flex items-center gap-2.5 bg-surface-secondary border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm hover:border-white/[0.16] transition-all">
              <span className="text-ink-primary whitespace-nowrap pointer-events-none">{formatDateDisplay(dates.from)}</span>
              <span className="text-ink-muted mx-0.5 pointer-events-none">-</span>
              <span className="text-ink-primary whitespace-nowrap pointer-events-none">{formatDateDisplay(dates.to)}</span>
              <Calendar size={13} className="text-ink-muted shrink-0 ml-1 pointer-events-none" />
              <input
                type="date"
                value={format(dates.from, "yyyy-MM-dd")}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const d = new Date(e.target.value + "T00:00:00");
                  const end = new Date(e.target.value + "T23:59:59");
                  setDates({ from: d, to: end });
                  setDatePreset("all");
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full [color-scheme:dark]"
              />
            </div>

            {/* Botões de preset — pill shape */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {DATE_PRESETS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handlePresetChange(id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    datePreset === id
                      ? "bg-brand-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.25)]"
                      : "bg-surface-secondary border border-white/[0.08] text-ink-secondary hover:text-ink-primary hover:border-white/[0.14]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
      </div>

      {/* ── Cards de métricas ── */}
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

      {/* ── Gráfico + Monitoramentos Recentes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart — 2/3 */}
        <div className="lg:col-span-2 bg-surface-card rounded-xl border border-white/[0.08] p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-1.5 rounded-md bg-brand-500/10 ring-1 ring-brand-500/20">
              <BarChart2 size={14} className="text-brand-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-primary">Grupos por Monitoramento</h3>
              <p className="text-[11px] text-ink-muted mt-0.5">Total coletado por fonte ativa</p>
            </div>
          </div>
          <div className="h-56">
            <GroupsChart data={chartData} />
          </div>
        </div>

        {/* Monitoramentos recentes — 1/3 */}
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

      {/* ── Grupos Recentes ── */}
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
