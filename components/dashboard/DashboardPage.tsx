"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, Settings, User, LogOut,
  Radio, Users, LayoutDashboard, PlusCircle,
  BellOff, Keyboard,
} from "lucide-react";
import { Sidebar, PAGE_META, type NavId } from "@/components/layout/Sidebar";
import { DashboardHome } from "./DashboardHome";
import { CreateMonitoringForm } from "./CreateMonitoringForm";
import { MonitoredSourcesTable } from "./MonitoredSourcesTable";
import { PulledGroupsTable } from "./PulledGroupsTable";
import { LeadsPage } from "./LeadsPage";
import { createClient } from "@/lib/supabase/client";
import type { MonitoredSource, ExtractionResult } from "@/types";

type OpenDropdown = "bell" | "settings" | "profile" | null;

const SETTINGS_ITEMS = [
  { icon: LayoutDashboard, label: "Painel",         nav: "painel"  as NavId },
  { icon: PlusCircle,      label: "Cadastrar",      nav: "create"  as NavId },
  { icon: Radio,           label: "Monitoramentos", nav: "sources" as NavId },
  { icon: Users,           label: "Grupos Puxados", nav: "groups"  as NavId },
];

const SHORTCUTS = [
  { keys: ["P"], label: "Painel" },
  { keys: ["C"], label: "Cadastrar" },
  { keys: ["M"], label: "Monitoramentos" },
  { keys: ["G"], label: "Grupos" },
];

const FLOAT_BTN =
  "relative w-10 h-10 rounded-xl bg-surface-card border border-white/[0.08] flex items-center justify-center transition-all hover:border-white/[0.14] hover:bg-white/[0.06]";

export function DashboardPage() {
  const [selected, setSelected] = useState<NavId>("painel");
  const [collapsed, setCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  const meta = PAGE_META[selected];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (floatRef.current && !floatRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;
      const map: Record<string, NavId> = { p: "painel", c: "create", m: "sources", g: "groups" };
      const nav = map[e.key.toLowerCase()];
      if (nav) { setSelected(nav); setOpenDropdown(null); }
      if (e.key === "Escape") setOpenDropdown(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function toggleDropdown(name: OpenDropdown) {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }

  function handleMonitoringCreated(_source: MonitoredSource, _extraction: ExtractionResult) {
    setRefreshKey((k) => k + 1);
    setSelected("groups");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function renderContent() {
    switch (selected) {
      case "painel":
        return <DashboardHome onNavigate={setSelected} />;
      case "create":
        return (
          <div className="bg-surface-card rounded-xl border border-white/[0.08] p-6 max-w-2xl">
            <CreateMonitoringForm onSuccess={handleMonitoringCreated} />
          </div>
        );
      case "sources":
        return (
          <div className="bg-surface-card rounded-xl border border-white/[0.08] p-6">
            <MonitoredSourcesTable key={`sources-${refreshKey}`} />
          </div>
        );
      case "groups":
        return (
          <div className="bg-surface-card rounded-xl border border-white/[0.08] p-6">
            <PulledGroupsTable key={`groups-${refreshKey}`} />
          </div>
        );
      case "leads":
        return <LeadsPage />;
    }
  }

  const dropdownBase =
    "absolute right-0 top-full mt-2 z-50 bg-surface-card border border-white/[0.10] rounded-xl shadow-2xl shadow-black/60 overflow-hidden";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        selected={selected}
        onSelect={setSelected}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">

        {/* Ícones flutuantes — ocultos no painel (DashboardHome tem seu próprio header) */}
        {selected !== "painel" && (
        <div
          ref={floatRef}
          className="absolute top-5 right-5 z-40 flex items-center gap-2"
        >
          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("bell")}
              title="Notificações"
              className={`${FLOAT_BTN} ${openDropdown === "bell" ? "border-white/[0.18] bg-white/[0.06]" : ""} text-ink-secondary hover:text-ink-primary`}
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-500" />
            </button>
            <AnimatePresence>
              {openDropdown === "bell" && (
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

          {/* Configurações */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("settings")}
              title="Configurações"
              className={`${FLOAT_BTN} ${openDropdown === "settings" ? "border-white/[0.18] bg-white/[0.06]" : ""} text-ink-secondary hover:text-ink-primary`}
            >
              <Settings size={18} />
            </button>
            <AnimatePresence>
              {openDropdown === "settings" && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`${dropdownBase} w-60`}
                >
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <span className="text-xs font-semibold text-ink-primary">Navegação rápida</span>
                  </div>
                  <div className="p-1.5">
                    {SETTINGS_ITEMS.map(({ icon: Icon, label, nav }) => (
                      <button
                        key={nav}
                        onClick={() => { setSelected(nav); setOpenDropdown(null); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selected === nav
                            ? "bg-brand-500/10 text-brand-500"
                            : "text-ink-secondary hover:bg-white/[0.04] hover:text-ink-primary"
                        }`}
                      >
                        <Icon size={14} className="shrink-0" />
                        {label}
                        {selected === nav && (
                          <span className="ml-auto text-[10px] text-brand-500/70">atual</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-ink-muted mb-2">
                      <Keyboard size={11} />
                      <span className="text-[10px] font-medium">Atalhos de teclado</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {SHORTCUTS.map(({ keys, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <kbd className="text-[9px] bg-white/[0.06] border border-white/[0.08] text-ink-muted px-1.5 py-0.5 rounded font-mono">
                            {keys[0]}
                          </kbd>
                          <span className="text-[10px] text-ink-muted">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Perfil */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("profile")}
              title="Perfil"
              className={`${FLOAT_BTN} ${openDropdown === "profile" ? "border-brand-500/30 bg-brand-500/10" : "border-brand-500/20 bg-brand-500/10"} hover:border-brand-500/40`}
            >
              <User size={18} className="text-brand-500" />
            </button>
            <AnimatePresence>
              {openDropdown === "profile" && (
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
        )}

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Título da página — oculto no painel (hero header já tem título) */}
          {selected !== "painel" && (
            <div className="mb-6 pr-40">
              <h1 className="text-xl font-bold text-ink-primary">{meta.title}</h1>
              <p className="text-sm text-ink-muted mt-0.5">{meta.subtitle}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
