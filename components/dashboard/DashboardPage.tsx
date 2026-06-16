"use client";

import { useState } from "react";
import { PlusCircle, List, Radio } from "lucide-react";
import { CreateMonitoringForm } from "./CreateMonitoringForm";
import { MonitoredSourcesTable } from "./MonitoredSourcesTable";
import { PulledGroupsTable } from "./PulledGroupsTable";
import type { MonitoredSource, ExtractionResult } from "@/types";

type Tab = "create" | "groups" | "sources";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "create",  label: "Cadastrar monitoramento",  icon: PlusCircle },
  { id: "groups",  label: "Grupos puxados",           icon: List },
  { id: "sources", label: "Monitoramentos ativos",    icon: Radio },
];

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleMonitoringCreated(_source: MonitoredSource, _extraction: ExtractionResult) {
    setRefreshKey((k) => k + 1);
    setActiveTab("groups");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">GroupHub</h1>
            <p className="text-xs text-gray-500">Monitor de grupos WhatsApp</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex gap-0 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? "border-green-600 text-green-700"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo das abas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {activeTab === "create" && (
            <div className="max-w-2xl">
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                Novo monitoramento
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Informe um link de origem e o sistema buscará grupos automaticamente na frequência definida.
              </p>
              <CreateMonitoringForm onSuccess={handleMonitoringCreated} />
            </div>
          )}

          {activeTab === "groups" && (
            <div key={`groups-${refreshKey}`}>
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                Histórico de grupos puxados
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Todos os grupos WhatsApp encontrados pelos monitoramentos ativos.
              </p>
              <PulledGroupsTable />
            </div>
          )}

          {activeTab === "sources" && (
            <div key={`sources-${refreshKey}`}>
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                Monitoramentos ativos
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Links sendo monitorados periodicamente para encontrar novos grupos.
              </p>
              <MonitoredSourcesTable />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
