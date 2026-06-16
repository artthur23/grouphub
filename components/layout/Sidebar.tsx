"use client";

import { LayoutDashboard, PlusCircle, Radio, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type NavId = "painel" | "create" | "sources" | "groups";

export const NAV_ITEMS: { id: NavId; label: string; description: string; icon: React.ElementType }[] = [
  { id: "painel",  label: "Painel",        description: "Visão geral do negócio",        icon: LayoutDashboard },
  { id: "create",  label: "Cadastrar",     description: "Adicionar novo link de origem", icon: PlusCircle },
  { id: "sources", label: "Monitoramentos",description: "Fontes ativas e configuração",  icon: Radio },
  { id: "groups",  label: "Grupos Puxados",description: "Histórico de grupos coletados", icon: Users },
];

export const PAGE_META: Record<NavId, { title: string; subtitle: string }> = {
  painel:  { title: "Painel",                   subtitle: "Visão geral do negócio" },
  create:  { title: "Cadastrar Monitoramento",   subtitle: "Adicione um novo link de origem para ser monitorado periodicamente." },
  sources: { title: "Monitoramentos Ativos",     subtitle: "Links sendo consultados periodicamente para encontrar novos grupos." },
  groups:  { title: "Grupos Puxados",            subtitle: "Todos os grupos WhatsApp encontrados pelos monitoramentos." },
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
      className={`relative flex flex-col bg-surface-sidebar border-r border-white/[0.08] transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? "w-[60px]" : "w-[220px]"
      }`}
    >
      {/* Brand */}
      <div
        className={`flex items-center gap-3 border-b border-white/[0.08] px-3 py-4 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div
            onClick={collapsed ? onToggle : undefined}
            title={collapsed ? "Expandir" : undefined}
            className={`w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(34,197,94,0.35)] ${
              collapsed ? "cursor-pointer hover:brightness-110 transition-all" : ""
            }`}
          >
            <span className="text-white font-bold text-sm select-none">G</span>
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="brand-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="font-semibold text-ink-primary text-sm leading-tight whitespace-nowrap">GroupHub</div>
                <div className="text-[10px] text-ink-muted leading-tight whitespace-nowrap">Monitor de grupos</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.button
              key="collapse-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onToggle}
              title="Recolher"
              className="w-6 h-6 rounded-md flex items-center justify-center text-ink-muted hover:text-ink-secondary hover:bg-white/[0.06] transition-colors shrink-0"
            >
              <ChevronLeft size={13} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, description, icon: Icon }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 border ${
                active
                  ? "bg-brand-500/10 text-brand-500 border-brand-500/20"
                  : "text-ink-secondary hover:bg-white/[0.04] hover:text-ink-primary border-transparent"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={17} className="shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    key={`label-${id}`}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden min-w-0"
                  >
                    <div className="text-[13px] font-medium leading-tight truncate whitespace-nowrap">{label}</div>
                    <div className="text-[10px] opacity-55 truncate leading-tight mt-0.5 whitespace-nowrap">{description}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Expand button quando collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-white/[0.08]">
          <button
            onClick={onToggle}
            title="Expandir"
            className="w-full flex items-center justify-center p-2 rounded-md text-ink-muted hover:text-ink-secondary hover:bg-white/[0.04] transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Rodapé */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-3 border-t border-white/[0.08]"
          >
            <div className="text-[10px] text-ink-muted">v1.0 · GroupHub</div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
