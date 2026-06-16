"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";

interface Props {
  sourceId: string;
  onSuccess?: (result: { found: number; inserted: number; skipped: number }) => void;
}

export function RunNowButton({ sourceId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/monitored-sources/${sourceId}/run`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha na execução");
      const r = json.result;
      setMessage(`✓ ${r.inserted} novos, ${r.skipped} já existiam`);
      onSuccess?.(r);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleRun}
        disabled={loading}
        title="Executar agora"
        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 ring-1 ring-brand-500/20 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <Play size={11} />
        )}
        {loading ? "Executando..." : "Executar"}
      </button>
      {message && (
        <div className="absolute left-0 top-full mt-1.5 z-10 whitespace-nowrap text-xs bg-surface-card border border-white/[0.12] text-ink-secondary rounded-lg shadow-xl px-3 py-1.5">
          {message}
        </div>
      )}
    </div>
  );
}
