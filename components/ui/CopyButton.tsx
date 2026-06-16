"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      title="Copiar link"
      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-ink-secondary hover:text-ink-primary ring-1 ring-white/[0.06] transition-all"
    >
      {copied ? (
        <Check size={11} className="text-brand-500" />
      ) : (
        <Copy size={11} />
      )}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
