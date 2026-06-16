"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Settings, User, LogOut, Radio, Users, LayoutDashboard, PlusCircle, BellOff, Keyboard } from "lucide-react";
import { Sidebar, PAGE_META, type NavId } from "@/components/layout/Sidebar";
import { DashboardHome } from "./DashboardHome";
import { CreateMonitoringForm } from "./CreateMonitoringForm";
import { MonitoredSourcesTable } from "./MonitoredSourcesTable";
import { PulledGroupsTable } from "./PulledGroupsTable";
import { createClient } from "@/lib/supabase/client";
import type { MonitoredSource, ExtractionResult } from "@/types";

type OpenDropdown = "bell" | "settings" | "profile" | null;

const SETTINGS_ITEMS = [
  { icon: LayoutDashboard, label: "Painel",          nav: "painel"  as NavId },
  { icon: PlusCircle,      label: "Cadastrar",       nav: "create"  as NavId },
  { icon: Radio,           label: "Monitoramentos",  nav: "sources" as NavId },
  { icon: Users,           label: "Grupos Puxados",  nav: "groups"  as NavId },
];

const SHORTCUTS = [
  { keys: ["P"], label: "Painel" },
  { keys: ["C"], label: "Cadastrar" },
  { keys: ["M"], label: "Monitoramentos" },
  { keys: ["G"], label: "Grupos" },
];

export function DashboardPage() {
  const [selected, setSelected] = useState<NavId>("painel");
  const [collapsed, setCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const meta = PAGE_META[selected];

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
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
    }
  }

  const dropdownBase =
    "absolute right-0 top-full mt-2 z-50 bg-surface-card border border-white/[0.10] rounded-xl shadow-2xl shadow-black/50 overflow-hidden";

  return (
    <div className="flex h-screen bg-surface-base overflow-hidden">
      <Sidebar
        selected={selected}
        onSelect={setSelected}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-surface-card border-b border-white/[0.08] px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-ink-primary truncate">{meta.title}</h1>
            <p className="text-xs text-ink-muted mt-0.5 truncate">{meta.subtitle}</p>
          </div>

          <div ref={headerRef} className="flex items-center gap-1 shrink-0 ml-4 relative">

            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("bell")}
                title="Notificações"
                className={`relative p-2 rounded-lg transition-colors ${
                  openDropdown === "bell"
                    ? "text-ink-primary bg-white/[0.06]"
                    : "text-ink-muted hover:text-ink-secondary hover:bg-white/[0.04]"
                }`}
              >
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
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
                className={`p-2 rounded-lg transition-colors ${
                  openDropdown === "settings"
                    ? "text-ink-primary bg-white/[0.06]"
                    : "text-ink-muted hover:text-ink-secondary hover:bg-white/[0.04]"
                }`}
              >
                <Settings size={16} />
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

            <div className="w-px h-4 bg-white/[0.08] mx-1.5" />

            {/* Perfil */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("profile")}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                  openDropdown === "profile" ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
                  <User size={13} className="text-brand-500" />
                </div>
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
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-grid">
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
