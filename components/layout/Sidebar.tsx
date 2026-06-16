"use client";

import { LayoutDashboard, PlusCircle, Radio, Users, ChevronLeft, ChevronRight } from "lucide-react";

export type NavId = "painel" | "create" | "sources" | "groups";

export const NAV_ITEMS: { id: NavId; label: string; description: string; icon: React.ElementType }[] = [
  { id: "painel",  label: "Painel",                  description: "Visão geral do negócio",          icon: LayoutDashboard },
  { id: "create",  label: "Cadastrar",                description: "Adicionar novo link de origem",   icon: PlusCircle },
  { id: "sources", label: "Monitoramentos",           description: "Fontes ativas e configuração",    icon: Radio },
  { id: "groups",  label: "Grupos Puxados",           description: "Histórico de grupos coletados",   icon: Users },
];

export const PAGE_META: Record<NavId, { title: string; subtitle: string }> = {
  painel:  { title: "Painel",              subtitle: "Visão geral do negócio" },
  create:  { title: "Cadastrar Monitoramento", subtitle: "Adicione um novo link de origem para ser monitorado periodicamente." },
  sources: { title: "Monitoramentos Ativos",   subtitle: "Links sendo consultados periodicamente para encontrar novos grupos." },
  groups:  { title: "Grupos Puxados",          subtitle: "Todos os grupos WhatsApp encontrados pelos monitoramentos." },
};

interface Props {
  selected: NavId;
  onSelect: (id: NavId) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ selected, onSelect, collapsed, onToggle }: Props) {
  return (
    <aside
      className={`relative flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200 ease-in-out shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand */}
      <div
        className={`flex px-4 py-5 border-b border-gray-100 dark:border-gray-800 ${
          collapsed ? "flex-col items-center gap-3" : "flex-row items-center justify-between"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
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

        <button
          onClick={onToggle}
          title={collapsed ? "Expandir" : "Recolher"}
          className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {collapsed ? (
            <ChevronRight size={12} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft size={12} className="text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, description, icon: Icon }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                active
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <div className="overflow-hidden">
                  <div className="text-sm font-medium leading-tight truncate">{label}</div>
                  <div className="text-xs opacity-70 truncate">{description}</div>
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
