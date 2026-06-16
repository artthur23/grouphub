"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Settings, User } from "lucide-react";
import { Sidebar, PAGE_META, type NavId } from "@/components/layout/Sidebar";
import { DashboardHome } from "./DashboardHome";
import { CreateMonitoringForm } from "./CreateMonitoringForm";
import { MonitoredSourcesTable } from "./MonitoredSourcesTable";
import { PulledGroupsTable } from "./PulledGroupsTable";
import type { MonitoredSource, ExtractionResult } from "@/types";

export function DashboardPage() {
  const [selected, setSelected] = useState<NavId>("painel");
  const [collapsed, setCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const meta = PAGE_META[selected];

  function handleMonitoringCreated(_source: MonitoredSource, _extraction: ExtractionResult) {
    setRefreshKey((k) => k + 1);
    setSelected("groups");
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

          <div className="flex items-center gap-1 shrink-0 ml-4">
            <button
              title="Notificações"
              className="relative p-2 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-white/[0.04] transition-colors"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
            </button>
            <button
              title="Configurações"
              className="p-2 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-white/[0.04] transition-colors"
            >
              <Settings size={16} />
            </button>

            <div className="w-px h-4 bg-white/[0.08] mx-1.5" />

            <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
              <div className="w-7 h-7 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
                <User size={13} className="text-brand-500" />
              </div>
            </button>
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
