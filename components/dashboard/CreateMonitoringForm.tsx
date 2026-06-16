"use client";

import { useState } from "react";
import { Loader2, PlusCircle, CheckCircle, XCircle } from "lucide-react";
import { IntervalSelect } from "@/components/ui/IntervalSelect";
import { SourceTypeSelect } from "@/components/ui/SourceTypeSelect";
import type { SourceType, MonitoredSource, ExtractionResult } from "@/types";

interface Props {
  onSuccess: (source: MonitoredSource, extraction: ExtractionResult) => void;
}

interface FormState {
  source_url: string;
  list_name: string;
  source_type: SourceType;
  interval_minutes: 30 | 60 | 90;
}

type FeedbackType = "success" | "error" | null;

export function CreateMonitoringForm({ onSuccess }: Props) {
  const [form, setForm] = useState<FormState>({
    source_url: "",
    list_name: "",
    source_type: "sendflow",
    interval_minutes: 30,
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string } | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/monitored-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Falha ao salvar monitoramento");
      }

      const { source, extraction } = json;
      const msg = `Monitoramento criado! ${extraction.inserted} grupo(s) encontrado(s) agora.`;
      setFeedback({ type: "success", message: msg });
      setForm({ source_url: "", list_name: "", source_type: "sendflow", interval_minutes: 30 });
      onSuccess(source, extraction);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <XCircle size={16} className="mt-0.5 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Link de origem */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Link de origem <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.source_url}
          onChange={(e) => setField("source_url", e.target.value)}
          placeholder="https://sendflow.com/exemplo/lista123"
          required
          disabled={loading}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
        />
      </div>

      {/* Nome da lista/campanha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome da lista / campanha <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.list_name}
          onChange={(e) => setField("list_name", e.target.value)}
          placeholder="Leads-SEMANADOCROCHE"
          required
          disabled={loading}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Fonte */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fonte <span className="text-red-500">*</span>
          </label>
          <SourceTypeSelect
            value={form.source_type}
            onChange={(v) => setField("source_type", v)}
            disabled={loading}
          />
        </div>

        {/* Frequência */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frequência de consulta <span className="text-red-500">*</span>
          </label>
          <IntervalSelect
            value={form.interval_minutes}
            onChange={(v) => setField("interval_minutes", v)}
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Salvando e buscando...
          </>
        ) : (
          <>
            <PlusCircle size={16} />
            Salvar e puxar agora
          </>
        )}
      </button>
    </form>
  );
}
