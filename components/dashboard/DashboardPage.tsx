"use client";

import { useState } from "react";
import { Sun, Moon, Bell, User } from "lucide-react";
import { Sidebar, PAGE_META, type NavId } from "@/components/layout/Sidebar";
import { DashboardHome } from "./DashboardHome";
import { CreateMonitoringForm } from "./CreateMonitoringForm";
import { MonitoredSourcesTable } from "./MonitoredSourcesTable";
import { PulledGroupsTable } from "./PulledGroupsTable";
import type { MonitoredSource, ExtractionResult } from "@/types";

export function DashboardPage() {
  const [selected, setSelected] = useState<NavId>("painel");
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
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
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 max-w-2xl">
            <CreateMonitoringForm onSuccess={handleMonitoringCreated} />
          </div>
        );
      case "sources":
        return (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <MonitoredSourcesTable key={`sources-${refreshKey}`} />
          </div>
        );
      case "groups":
        return (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <PulledGroupsTable key={`groups-${refreshKey}`} />
          </div>
        );
    }
  }

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
        <Sidebar
          selected={selected}
          onSelect={setSelected}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">{meta.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{meta.subtitle}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-4">
              <button
                onClick={() => setIsDark((v) => !v)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={isDark ? "Modo claro" : "Modo escuro"}
              >
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
          <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
        </div>
      </div>
    </div>
  );
}
