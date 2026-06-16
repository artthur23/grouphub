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
      const res = await fetch(`/api/monitored-sources/${sourceId}/run`, {
        method: "POST",
      });
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
        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 text-blue-800 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
        {loading ? "Executando..." : "Executar agora"}
      </button>
      {message && (
        <div className="absolute left-0 top-full mt-1 z-10 whitespace-nowrap text-xs bg-white border border-gray-200 rounded shadow px-2 py-1">
          {message}
        </div>
      )}
    </div>
  );
}
