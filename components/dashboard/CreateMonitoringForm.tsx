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

const inputClass =
  "block w-full rounded-lg border border-white/[0.08] bg-surface-secondary text-ink-primary px-3 py-2.5 text-sm placeholder:text-ink-muted focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 disabled:opacity-50 transition-colors";

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
      <div>
        <h2 className="text-base font-semibold text-ink-primary">Novo Monitoramento</h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Adicione um link de origem para monitorar automaticamente novos grupos.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-brand-500/10 border border-brand-500/20 text-brand-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle size={15} className="mt-0.5 shrink-0" />
          ) : (
            <XCircle size={15} className="mt-0.5 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Link de origem */}
      <div>
        <label className="block text-xs font-medium text-ink-secondary mb-1.5">
          Link de origem <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.source_url}
          onChange={(e) => setField("source_url", e.target.value)}
          placeholder="https://sendflow.com/exemplo/lista123"
          required
          disabled={loading}
          className={inputClass}
        />
      </div>

      {/* Nome da lista */}
      <div>
        <label className="block text-xs font-medium text-ink-secondary mb-1.5">
          Nome da lista / campanha <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.list_name}
          onChange={(e) => setField("list_name", e.target.value)}
          placeholder="Leads-SEMANADOCROCHE"
          required
          disabled={loading}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1.5">
            Fonte <span className="text-red-400">*</span>
          </label>
          <SourceTypeSelect
            value={form.source_type}
            onChange={(v) => setField("source_type", v)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1.5">
            Frequência de consulta <span className="text-red-400">*</span>
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
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-[0_0_16px_rgba(34,197,94,0.2)]"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Salvando e buscando...
          </>
        ) : (
          <>
            <PlusCircle size={15} />
            Salvar e puxar agora
          </>
        )}
      </button>
    </form>
  );
}
