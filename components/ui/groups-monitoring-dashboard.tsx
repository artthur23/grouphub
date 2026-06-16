"use client";

import { useState } from "react";
import {
  LayoutDashboard, PlusCircle, Radio, Users, ClipboardList,
  Database, Settings, HelpCircle, Moon, Sun, Bell, User,
  Clock, Link2, CheckCircle, AlertCircle, Copy, Download,
  ChevronLeft, ChevronRight, Loader2, RotateCcw, Pencil,
  Trash2, Play, Pause, Search, Filter, Globe,
  Activity, Zap, TrendingUp, RefreshCw, Check,
} from "lucide-react";

// ================================================================
// Types
// ================================================================

type SourceType = "Sendflow" | "Devzapp" | "Manual" | "Outra";
type MonitoringStatus = "active" | "paused" | "error";
type RunStatus = "success" | "failed" | "running";
type GroupStatus = "active" | "invalid" | "error";

type NavId =
  | "dashboard" | "create" | "sources" | "groups"
  | "logs" | "integrations" | "settings" | "help";

interface MonitoredSource {
  id: string;
  listName: string;
  sourceUrl: string;
  sourceType: SourceType;
  intervalMinutes: 30 | 60 | 90;
  status: MonitoringStatus;
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalGroupsFound: number;
  lastErrorMessage?: string | null;
}

interface PulledGroup {
  id: string;
  groupLink: string;
  listName: string;
  sourceType: SourceType;
  groupHash: string;
  pulledAt: string;
  status: GroupStatus;
}

interface ExtractionRun {
  id: string;
  listName: string;
  sourceType: SourceType;
  startedAt: string;
  finishedAt: string | null;
  status: RunStatus;
  groupsFoundCount: number;
  groupsInsertedCount: number;
  groupsSkippedCount: number;
  errorMessage: string | null;
}

// ================================================================
// Mock Data
// TODO: substituir por chamadas reais à API
// ================================================================

const MOCK_SOURCES: MonitoredSource[] = [
  {
    id: "1",
    listName: "Leads-SEMANADOCROCHE",
    sourceUrl: "https://sendflow.com/exemplo/lista123",
    sourceType: "Sendflow",
    intervalMinutes: 30,
    status: "active",
    lastRunAt: "15/01/2025 14:30",
    nextRunAt: "15/01/2025 15:00",
    totalGroupsFound: 12,
  },
  {
    id: "2",
    listName: "Afiliados-TRICO2025",
    sourceUrl: "https://devzapp.com.br/listas/trico",
    sourceType: "Devzapp",
    intervalMinutes: 60,
    status: "active",
    lastRunAt: "15/01/2025 13:00",
    nextRunAt: "15/01/2025 14:00",
    totalGroupsFound: 34,
  },
  {
    id: "3",
    listName: "VIP-LANÇAMENTO",
    sourceUrl: "https://chat.whatsapp.com/ABC123DEF456GHI",
    sourceType: "Manual",
    intervalMinutes: 90,
    status: "paused",
    lastRunAt: "14/01/2025 10:00",
    nextRunAt: null,
    totalGroupsFound: 1,
  },
  {
    id: "4",
    listName: "Masterclass-RENDA",
    sourceUrl: "https://outraplataforma.com/lista/renda",
    sourceType: "Outra",
    intervalMinutes: 30,
    status: "error",
    lastRunAt: "15/01/2025 12:00",
    nextRunAt: "15/01/2025 12:30",
    totalGroupsFound: 5,
    lastErrorMessage: "Timeout ao conectar com a fonte",
  },
];

const MOCK_GROUPS: PulledGroup[] = [
  {
    id: "1",
    groupLink: "https://chat.whatsapp.com/FDXKTYmuKWDD16ABdU14Rm",
    listName: "Leads-SEMANADOCROCHE",
    sourceType: "Sendflow",
    groupHash: "FDXKTYmuKWDD16ABdU14Rm",
    pulledAt: "15/01/2025 14:30",
    status: "active",
  },
  {
    id: "2",
    groupLink: "https://chat.whatsapp.com/HJK789LMN012OPQ345RST",
    listName: "Leads-SEMANADOCROCHE",
    sourceType: "Sendflow",
    groupHash: "HJK789LMN012OPQ345RST",
    pulledAt: "15/01/2025 14:30",
    status: "active",
  },
  {
    id: "3",
    groupLink: "https://chat.whatsapp.com/XYZ111ABC222DEF333GHI",
    listName: "Afiliados-TRICO2025",
    sourceType: "Devzapp",
    groupHash: "XYZ111ABC222DEF333GHI",
    pulledAt: "15/01/2025 13:00",
    status: "active",
  },
  {
    id: "4",
    groupLink: "https://chat.whatsapp.com/INVALIDEXPIREDLNK000",
    listName: "Masterclass-RENDA",
    sourceType: "Outra",
    groupHash: "INVALIDEXPIREDLNK000",
    pulledAt: "15/01/2025 12:00",
    status: "invalid",
  },
];

const MOCK_RUNS: ExtractionRun[] = [
  {
    id: "1",
    listName: "Leads-SEMANADOCROCHE",
    sourceType: "Sendflow",
    startedAt: "15/01/2025 14:30",
    finishedAt: "15/01/2025 14:31",
    status: "success",
    groupsFoundCount: 5,
    groupsInsertedCount: 2,
    groupsSkippedCount: 3,
    errorMessage: null,
  },
  {
    id: "2",
    listName: "Afiliados-TRICO2025",
    sourceType: "Devzapp",
    startedAt: "15/01/2025 13:00",
    finishedAt: "15/01/2025 13:01",
    status: "success",
    groupsFoundCount: 8,
    groupsInsertedCount: 8,
    groupsSkippedCount: 0,
    errorMessage: null,
  },
  {
    id: "3",
    listName: "Masterclass-RENDA",
    sourceType: "Outra",
    startedAt: "15/01/2025 12:00",
    finishedAt: "15/01/2025 12:00",
    status: "failed",
    groupsFoundCount: 0,
    groupsInsertedCount: 0,
    groupsSkippedCount: 0,
    errorMessage: "Timeout ao conectar com a fonte",
  },
  {
    id: "4",
    listName: "Leads-SEMANADOCROCHE",
    sourceType: "Sendflow",
    startedAt: "15/01/2025 15:00",
    finishedAt: null,
    status: "running",
    groupsFoundCount: 0,
    groupsInsertedCount: 0,
    groupsSkippedCount: 0,
    errorMessage: null,
  },
];

// ================================================================
// Sidebar nav config
// ================================================================

const NAV_ITEMS: { id: NavId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",    label: "Dashboard",               icon: LayoutDashboard },
  { id: "create",       label: "Cadastrar Monitoramento", icon: PlusCircle },
  { id: "sources",      label: "Monitoramentos Ativos",   icon: Radio },
  { id: "groups",       label: "Grupos Puxados",          icon: Users },
  { id: "logs",         label: "Execuções / Logs",        icon: ClipboardList },
  { id: "integrations", label: "Fontes",                  icon: Database },
  { id: "settings",     label: "Configurações",           icon: Settings },
  { id: "help",         label: "Ajuda",                   icon: HelpCircle },
];

const PAGE_META: Record<NavId, { title: string; subtitle: string }> = {
  dashboard:    { title: "Dashboard",               subtitle: "Monitore links de origem e puxe novos grupos automaticamente." },
  create:       { title: "Cadastrar Monitoramento", subtitle: "Adicione um novo link de origem para ser monitorado periodicamente." },
  sources:      { title: "Monitoramentos Ativos",   subtitle: "Links sendo consultados periodicamente para encontrar novos grupos." },
  groups:       { title: "Grupos Puxados",          subtitle: "Todos os grupos WhatsApp encontrados pelos monitoramentos." },
  logs:         { title: "Execuções / Logs",        subtitle: "Histórico de buscas realizadas pelo scheduler automático." },
  integrations: { title: "Fontes",                  subtitle: "Gerencie as integrações com plataformas de origem." },
  settings:     { title: "Configurações",           subtitle: "Preferências e configurações gerais da plataforma." },
  help:         { title: "Ajuda",                   subtitle: "Documentação e suporte para uso da plataforma." },
};

// ================================================================
// StatusBadge
// ================================================================

export function StatusBadge({ status }: { status: MonitoringStatus | RunStatus | GroupStatus }) {
  const styles: Record<string, string> = {
    active:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    paused:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    error:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    success:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    failed:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    running:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    invalid:  "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  const labels: Record<string, string> = {
    active: "Ativo", paused: "Pausado", error: "Erro",
    success: "Sucesso", failed: "Falhou", running: "Executando", invalid: "Inválido",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ================================================================
// IntervalBadge
// ================================================================

export function IntervalBadge({ minutes }: { minutes: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
      <Clock size={10} />
      {minutes}min
    </span>
  );
}

// ================================================================
// CopyButton
// ================================================================

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handle() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handle}
      title="Copiar link"
      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}

// ================================================================
// ExportCsvButton
// ================================================================

export function ExportCsvButton({ data, filename = "grupos.csv" }: { data: PulledGroup[]; filename?: string }) {
  function handle() {
    if (!data.length) return;
    const headers = ["Link", "Lista", "Fonte", "Hash", "Puxado em", "Status"];
    const rows = data.map((g) => [g.groupLink, g.listName, g.sourceType, g.groupHash, g.pulledAt, g.status]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button
      onClick={handle}
      disabled={!data.length}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
    >
      <Download size={14} />
      Exportar CSV ({data.length})
    </button>
  );
}

// ================================================================
// RunNowButton
// ================================================================

export function RunNowButton({ sourceId, onDone }: { sourceId: string; onDone?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handle() {
    setLoading(true);
    setMsg(null);
    try {
      // TODO: POST /api/monitored-sources/:id/run
      await new Promise((r) => setTimeout(r, 1500));
      setMsg("✓ 2 novos grupos encontrados");
      onDone?.();
    } catch {
      setMsg("Erro na execução");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 3500);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handle}
        disabled={loading}
        title="Executar agora"
        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
        {loading ? "..." : "Executar"}
      </button>
      {msg && (
        <div className="absolute left-0 top-full mt-1 z-20 whitespace-nowrap text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md px-2 py-1 text-gray-700 dark:text-gray-300">
          {msg}
        </div>
      )}
    </div>
  );
}

// ================================================================
// StatsCard
// ================================================================

export function StatsCard({
  title, value, subtitle, icon: Icon, trendLabel, color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trendLabel?: string;
  color: "green" | "blue" | "purple" | "orange";
}) {
  const iconColors = {
    green:  "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    blue:   "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${iconColors[color]}`}>
          <Icon size={20} />
        </div>
        {trendLabel && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-0.5">
            <TrendingUp size={11} />
            {trendLabel}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{title}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</div>
      </div>
    </div>
  );
}

// ================================================================
// DashboardContent (home)
// ================================================================

function DashboardHome({ onNavigate }: { onNavigate: (id: NavId) => void }) {
  // TODO: GET /api/monitored-sources, /api/pulled-groups, /api/extraction-runs

  const activeCount = MOCK_SOURCES.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Monitoramentos Ativos" value={activeCount} subtitle="Links consultados automaticamente" icon={Radio} color="green" trendLabel="+1 hoje" />
        <StatsCard title="Grupos Puxados" value={MOCK_GROUPS.length} subtitle="Total na base de dados" icon={Users} color="blue" trendLabel="+2 hoje" />
        <StatsCard title="Execuções Hoje" value={14} subtitle="Buscas feitas pelo scheduler" icon={Activity} color="purple" />
        <StatsCard title="Novos Grupos" value={3} subtitle="Última execução" icon={Zap} color="orange" trendLabel="+3 agora" />
      </div>

      {/* Recent sources */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Monitoramentos Recentes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Última execução por fonte</p>
          </div>
          <button onClick={() => onNavigate("sources")} className="text-xs text-green-600 hover:underline">
            Ver todos →
          </button>
        </div>
        <div className="space-y-2">
          {MOCK_SOURCES.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  s.status === "active" ? "bg-green-500" :
                  s.status === "paused" ? "bg-yellow-500" : "bg-red-500"
                }`} />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{s.listName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{s.sourceType} · {s.intervalMinutes}min</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.totalGroupsFound} grupos</div>
                <div className="text-xs text-gray-400">{s.lastRunAt ?? "—"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent runs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Execuções Recentes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Últimas buscas do scheduler</p>
          </div>
          <button onClick={() => onNavigate("logs")} className="text-xs text-green-600 hover:underline">
            Ver todas →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="pb-2 text-left font-medium">Lista</th>
                <th className="pb-2 text-left font-medium">Fonte</th>
                <th className="pb-2 text-center font-medium">Status</th>
                <th className="pb-2 text-center font-medium">Encontrados</th>
                <th className="pb-2 text-center font-medium">Novos</th>
                <th className="pb-2 text-left font-medium">Início</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {MOCK_RUNS.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="py-2.5 font-medium text-gray-900 dark:text-white">{r.listName}</td>
                  <td className="py-2.5 text-gray-600 dark:text-gray-400">{r.sourceType}</td>
                  <td className="py-2.5 text-center"><StatusBadge status={r.status} /></td>
                  <td className="py-2.5 text-center text-gray-700 dark:text-gray-300">{r.groupsFoundCount}</td>
                  <td className="py-2.5 text-center font-semibold text-green-600 dark:text-green-400">{r.groupsInsertedCount}</td>
                  <td className="py-2.5 text-xs text-gray-500 dark:text-gray-400">{r.startedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// CreateMonitoringForm
// ================================================================

export function CreateMonitoringForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({
    sourceUrl: "",
    listName: "",
    sourceType: "Sendflow" as SourceType,
    intervalMinutes: 30 as 30 | 60 | 90,
    status: "active" as "active" | "paused",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      // TODO: POST /api/monitored-sources
      await new Promise((r) => setTimeout(r, 1500));
      setFeedback({ type: "success", message: "Monitoramento criado! 3 grupo(s) encontrado(s) agora." });
      setForm({ sourceUrl: "", listName: "", sourceType: "Sendflow", intervalMinutes: 30, status: "active" });
      onSuccess?.();
    } catch {
      setFeedback({ type: "error", message: "Erro ao criar monitoramento. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-60 placeholder:text-gray-400 dark:placeholder:text-gray-500";

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Informe um link de origem e o sistema buscará grupos automaticamente na frequência definida.
        Se o link contiver vários grupos, <strong className="text-gray-700 dark:text-gray-300">todos serão salvos individualmente</strong> — duplicatas são ignoradas automaticamente.
      </p>

      {feedback && (
        <div className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm mb-5 border ${
          feedback.type === "success"
            ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
        }`}>
          {feedback.type === "success"
            ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
            : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Link de origem <span className="text-red-500">*</span>
          </label>
          <input type="text" value={form.sourceUrl} onChange={(e) => setField("sourceUrl", e.target.value)}
            placeholder="https://sendflow.com/exemplo/lista123" required disabled={loading} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome da lista / campanha <span className="text-red-500">*</span>
          </label>
          <input type="text" value={form.listName} onChange={(e) => setField("listName", e.target.value)}
            placeholder="Leads-SEMANADOCROCHE" required disabled={loading} className={inputCls} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fonte <span className="text-red-500">*</span>
            </label>
            <select value={form.sourceType} onChange={(e) => setField("sourceType", e.target.value as SourceType)}
              disabled={loading} className={inputCls}>
              <option value="Sendflow">Sendflow</option>
              <option value="Devzapp">Devzapp</option>
              <option value="Manual">Manual (link direto)</option>
              <option value="Outra">Outra plataforma</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequência <span className="text-red-500">*</span>
            </label>
            <select value={form.intervalMinutes} onChange={(e) => setField("intervalMinutes", Number(e.target.value) as 30 | 60 | 90)}
              disabled={loading} className={inputCls}>
              <option value={30}>A cada 30 minutos</option>
              <option value={60}>A cada 60 minutos</option>
              <option value={90}>A cada 90 minutos</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status inicial
          </label>
          <div className="flex gap-3">
            {(["active", "paused"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setField("status", s)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  form.status === s
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700"
                    : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}>
                {s === "active" ? "✓ Ativo — consultar agora" : "⏸ Pausado — só salvar"}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
          <strong>Como funciona:</strong> Ao salvar, o sistema executa uma primeira busca imediatamente.
          Cada execução futura roda automaticamente no intervalo escolhido.
          Grupos duplicados são ignorados — cada grupo é salvo apenas uma vez por monitoramento.
        </div>

        <button type="submit" disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {loading ? "Salvando e buscando..." : "Salvar e puxar agora"}
        </button>
      </form>
    </div>
  );
}

// ================================================================
// MonitoredSourcesTable
// ================================================================

export function MonitoredSourcesTable() {
  const [sources, setSources] = useState<MonitoredSource[]>(MOCK_SOURCES);

  function handleToggle(id: string) {
    // TODO: PATCH /api/monitored-sources/:id { status }
    setSources((prev) => prev.map((s) =>
      s.id === id ? { ...s, status: s.status === "active" ? "paused" : "active" } : s
    ));
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este monitoramento e todos os grupos associados?")) return;
    // TODO: DELETE /api/monitored-sources/:id
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{sources.length} monitoramento(s) cadastrado(s)</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Lista / Fonte</th>
              <th className="px-4 py-3 text-left">Link</th>
              <th className="px-4 py-3 text-center">Freq.</th>
              <th className="px-4 py-3 text-center">Última exec.</th>
              <th className="px-4 py-3 text-center">Próxima</th>
              <th className="px-4 py-3 text-center">Grupos</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {sources.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{s.listName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.sourceType}</div>
                </td>
                <td className="px-4 py-3 max-w-[160px]">
                  <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs truncate block" title={s.sourceUrl}>
                    {s.sourceUrl}
                  </a>
                  {s.lastErrorMessage && (
                    <div className="text-xs text-red-500 mt-0.5 truncate" title={s.lastErrorMessage}>
                      ⚠ {s.lastErrorMessage}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-center"><IntervalBadge minutes={s.intervalMinutes} /></td>
                <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{s.lastRunAt ?? "—"}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{s.nextRunAt ?? "—"}</td>
                <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">{s.totalGroupsFound}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-center flex-wrap">
                    <RunNowButton sourceId={s.id} />
                    <button onClick={() => handleToggle(s.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 transition-colors">
                      {s.status === "active" ? <Pause size={11} /> : <RotateCcw size={11} />}
                      {s.status === "active" ? "Pausar" : "Reativar"}
                    </button>
                    <button className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                      <Pencil size={11} />
                      Editar
                    </button>
                    <button onClick={() => handleDelete(s.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-400 transition-colors">
                      <Trash2 size={11} />
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

// ================================================================
// PulledGroupsTable
// ================================================================

export function PulledGroupsTable() {
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<SourceType | "">("");
  const [filterStatus, setFilterStatus] = useState<GroupStatus | "">("");

  // TODO: GET /api/pulled-groups?list_name=&source_type=&status=
  const filtered = MOCK_GROUPS.filter((g) => {
    if (search && !g.listName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSource && g.sourceType !== filterSource) return false;
    if (filterStatus && g.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Filter size={14} /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por lista..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-green-500 focus:border-green-500 focus:outline-none" />
          </div>
          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value as SourceType | "")}
            className="text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-green-500 focus:border-green-500 focus:outline-none">
            <option value="">Todas as fontes</option>
            {(["Sendflow", "Devzapp", "Manual", "Outra"] as SourceType[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as GroupStatus | "")}
            className="text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-green-500 focus:border-green-500 focus:outline-none">
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="invalid">Inválido</option>
            <option value="error">Erro</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} grupo(s)</p>
        <ExportCsvButton data={filtered} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Link do Grupo</th>
              <th className="px-4 py-3 text-left">Lista</th>
              <th className="px-4 py-3 text-left">Fonte</th>
              <th className="px-4 py-3 text-left">Hash</th>
              <th className="px-4 py-3 text-center">Puxado em</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 dark:text-gray-600 text-sm">Nenhum grupo encontrado.</td></tr>
            ) : filtered.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td className="px-4 py-3 max-w-[200px]">
                  <a href={g.groupLink} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-mono text-xs truncate block" title={g.groupLink}>
                    {g.groupLink}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{g.listName}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{g.sourceType}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-400 truncate block max-w-[80px]" title={g.groupHash}>{g.groupHash}</span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{g.pulledAt}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={g.status} /></td>
                <td className="px-4 py-3 text-center"><CopyButton text={g.groupLink} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================================================================
// ExtractionRunsTable
// ================================================================

export function ExtractionRunsTable() {
  // TODO: GET /api/extraction-runs
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <th className="px-4 py-3 text-left">Lista</th>
            <th className="px-4 py-3 text-left">Fonte</th>
            <th className="px-4 py-3 text-left">Início</th>
            <th className="px-4 py-3 text-left">Fim</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-center">Encontrados</th>
            <th className="px-4 py-3 text-center">Novos</th>
            <th className="px-4 py-3 text-center">Ignorados</th>
            <th className="px-4 py-3 text-left">Erro</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
          {MOCK_RUNS.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.listName}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.sourceType}</td>
              <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{r.startedAt}</td>
              <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{r.finishedAt ?? "—"}</td>
              <td className="px-4 py-3 text-center"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{r.groupsFoundCount}</td>
              <td className="px-4 py-3 text-center font-semibold text-green-600 dark:text-green-400">{r.groupsInsertedCount}</td>
              <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{r.groupsSkippedCount}</td>
              <td className="px-4 py-3 text-xs text-red-500 max-w-[160px]">
                {r.errorMessage
                  ? <span className="truncate block" title={r.errorMessage}>{r.errorMessage}</span>
                  : <span className="text-gray-400">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ================================================================
// SourcesSettings
// ================================================================

const SOURCES_INFO = [
  { type: "Sendflow",  icon: Globe,    description: "Plataforma de automação de WhatsApp com listas de leads.",     configured: true },
  { type: "Devzapp",  icon: Database,  description: "Integração via API com a plataforma Devzapp.",                 configured: false },
  { type: "Manual",   icon: Link2,     description: "Cadastro direto de links de grupos WhatsApp.",                 configured: true },
  { type: "Outra",    icon: Globe,     description: "Scraping genérico de URLs para extração de links.",            configured: true },
];

export function SourcesSettings() {
  return (
    <div className="space-y-5">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <strong>Segurança:</strong> API keys e tokens são gerenciados exclusivamente no backend via variáveis de ambiente.
        Nunca exponha credenciais no frontend.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SOURCES_INFO.map(({ type, icon: Icon, description, configured }) => (
          <div key={type} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Icon size={18} className="text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{type}</div>
                <div className={`text-xs mt-0.5 ${configured ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                  {configured ? "✓ Configurado" : "Não configurado"}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
            <button className="w-full py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Configurar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================================================
// Sidebar
// ================================================================

function Sidebar({
  selected, onSelect, collapsed, onToggle,
}: {
  selected: NavId;
  onSelect: (id: NavId) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className={`relative flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200 ease-in-out shrink-0 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">G</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight">GroupHub</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Monitor de grupos</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} className="text-gray-600 dark:text-gray-400" /> : <ChevronLeft size={12} className="text-gray-600 dark:text-gray-400" />}
      </button>
    </aside>
  );
}

// ================================================================
// GroupsMonitoringDashboard — main export
// ================================================================

export function GroupsMonitoringDashboard() {
  const [selected, setSelected] = useState<NavId>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const meta = PAGE_META[selected];

  function renderContent() {
    switch (selected) {
      case "dashboard":    return <DashboardHome onNavigate={setSelected} />;
      case "create":       return <CreateMonitoringForm onSuccess={() => setSelected("sources")} />;
      case "sources":      return <MonitoredSourcesTable />;
      case "groups":       return <PulledGroupsTable />;
      case "logs":         return <ExtractionRunsTable />;
      case "integrations": return <SourcesSettings />;
      case "settings":     return (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
          <Settings size={44} className="mb-3 opacity-30" />
          <p className="text-sm">Configurações em desenvolvimento.</p>
        </div>
      );
      case "help": return (
        <div className="max-w-2xl space-y-3">
          {[
            { q: "Como cadastrar um monitoramento?", a: "Clique em 'Cadastrar Monitoramento' na sidebar, preencha o link de origem e clique em 'Salvar e puxar agora'." },
            { q: "Com que frequência os links são consultados?", a: "Você define 30, 60 ou 90 minutos ao cadastrar. O scheduler roda automaticamente no intervalo escolhido." },
            { q: "O que acontece se o link tiver vários grupos?", a: "Todos os grupos encontrados são salvos individualmente — duplicatas são ignoradas automaticamente." },
            { q: "Posso pausar um monitoramento?", a: "Sim. Em 'Monitoramentos Ativos', clique em 'Pausar' na linha correspondente. Para reativar, clique em 'Reativar'." },
            { q: "O que é 'Executar agora'?", a: "Dispara uma busca manual imediata, sem aguardar o próximo ciclo automático do scheduler." },
            { q: "Como exportar os grupos?", a: "Na aba 'Grupos Puxados', use o botão 'Exportar CSV' para baixar os grupos filtrados." },
          ].map((item) => (
            <div key={item.q} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="font-medium text-gray-900 dark:text-white mb-1">{item.q}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{item.a}</div>
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
        <Sidebar selected={selected} onSelect={setSelected} collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">{meta.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{meta.subtitle}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-4">
              <button onClick={() => setIsDark((v) => !v)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={isDark ? "Modo claro" : "Modo escuro"}>
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
              </button>
              <button className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <User size={18} />
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
