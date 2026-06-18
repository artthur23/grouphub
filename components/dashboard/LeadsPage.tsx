"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Wifi, WifiOff, Loader2, QrCode, Download, Users,
  CheckSquare, Square, RefreshCw, AlertCircle, CheckCircle2, XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GroupResult } from "@/app/api/whatsapp/extract/route";
import type { WAGroup } from "@/app/api/whatsapp/groups/route";

type WAStatus = "disconnected" | "connecting" | "connected";
type RowStatus = "idle" | "extracting" | "done" | "error";

function buildTxt(results: GroupResult[]): string {
  return results
    .filter((r) => r.participants.length > 0)
    .map((r) => {
      const name = r.name ?? "Grupo sem nome";
      const admins  = r.participants.filter((p) => p.isAdmin).map((p) => `${p.phone}***`);
      const regular = r.participants.filter((p) => !p.isAdmin).map((p) => p.phone);
      const total   = r.participants.length;
      return [`{${name}}`, ...admins, ...regular, `total: ${total} contatos`].join("\n");
    })
    .join("\n\n");
}

function downloadTxt(content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `leads_${format(new Date(), "yyyy-MM-dd_HH-mm")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LeadsPage() {
  const [waStatus, setWaStatus]   = useState<WAStatus>("disconnected");
  const [qrCode,   setQrCode]     = useState<string | null>(null);
  const [groups,   setGroups]     = useState<WAGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [rowError,  setRowError]  = useState<Record<string, string>>({});
  const [extracting, setExtracting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const res  = await fetch("/api/whatsapp/status");
      const data = await res.json();
      setWaStatus(data.status);
      setQrCode(data.qr ?? null);
    } catch {}
  }, []);

  useEffect(() => {
    pollStatus();
    pollRef.current = setInterval(pollStatus, 3_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollStatus]);

  const fetchGroups = useCallback(async () => {
    if (waStatus !== "connected") return;
    setLoadingGroups(true);
    try {
      const res  = await fetch("/api/whatsapp/groups");
      const json = await res.json();
      setGroups(json.groups ?? []);
    } catch {}
    finally { setLoadingGroups(false); }
  }, [waStatus]);

  useEffect(() => {
    if (waStatus === "connected") {
      fetchGroups();
    } else {
      setGroups([]);
      setSelected(new Set());
    }
  }, [waStatus, fetchGroups]);

  async function handleConnect() {
    await fetch("/api/whatsapp/connect", { method: "POST" });
    setWaStatus("connecting");
  }

  async function handleDisconnect() {
    await fetch("/api/whatsapp/disconnect", { method: "POST" });
    setWaStatus("disconnected");
    setQrCode(null);
    setGroups([]);
    setSelected(new Set());
  }

  function toggleGroup(jid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(jid) ? next.delete(jid) : next.add(jid);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === groups.length ? new Set() : new Set(groups.map((g) => g.jid))
    );
  }

  async function handleExtract() {
    if (selected.size === 0 || extracting) return;
    setExtracting(true);

    const selectedGroups = groups.filter((g) => selected.has(g.jid));
    const allResults: GroupResult[] = [];

    for (const group of selectedGroups) {
      setRowStatus((p) => ({ ...p, [group.jid]: "extracting" }));

      try {
        const res = await fetch("/api/whatsapp/extract", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            groups: [{ jid: group.jid, name: group.name }],
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro na API");

        const result: GroupResult = data.results[0];

        if (result.error) {
          setRowStatus((p) => ({ ...p, [group.jid]: "error" }));
          setRowError ((p) => ({ ...p, [group.jid]: result.error! }));
        } else {
          setRowStatus((p) => ({ ...p, [group.jid]: "done" }));
          allResults.push(result);
        }
      } catch (err) {
        setRowStatus((p) => ({ ...p, [group.jid]: "error" }));
        setRowError ((p) => ({ ...p, [group.jid]: err instanceof Error ? err.message : "Erro" }));
      }
    }

    if (allResults.length > 0) {
      downloadTxt(buildTxt(allResults));
    }

    setExtracting(false);
  }

  const statusColor = {
    disconnected: "text-red-400",
    connecting:   "text-yellow-400",
    connected:    "text-brand-500",
  }[waStatus];

  const statusLabel = {
    disconnected: "Desconectado",
    connecting:   "Aguardando leitura do QR…",
    connected:    "Conectado",
  }[waStatus];

  const selectedCount = selected.size;
  const allSelected   = groups.length > 0 && selected.size === groups.length;

  return (
    <div className="space-y-5">

      {/* Card de conexão */}
      <div className="bg-surface-card rounded-xl border border-white/[0.08] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-ink-primary">Conexão WhatsApp</h2>
            <p className={`text-xs mt-1 flex items-center gap-1.5 ${statusColor}`}>
              {waStatus === "connecting" && <Loader2 size={11} className="animate-spin" />}
              {waStatus === "connected"   && <Wifi    size={11} />}
              {waStatus === "disconnected"&& <WifiOff size={11} />}
              {statusLabel}
            </p>
            <p className="text-[11px] text-ink-muted mt-1.5 max-w-md">
              Conecte um número WhatsApp para que a plataforma entre nos grupos e extraia a lista de membros automaticamente.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {waStatus === "disconnected" && (
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <QrCode size={14} />
                Conectar WhatsApp
              </button>
            )}
            {waStatus === "connecting" && (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-surface-secondary border border-white/[0.08] text-ink-secondary text-sm rounded-xl hover:text-ink-primary transition-colors"
              >
                Cancelar
              </button>
            )}
            {waStatus === "connected" && (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl hover:bg-red-500/20 transition-colors"
              >
                Desconectar
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {waStatus === "connecting" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-6 flex flex-col items-center gap-3">
                {qrCode ? (
                  <>
                    <div className="p-3 bg-white rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="QR Code WhatsApp" width={220} height={220} />
                    </div>
                    <p className="text-xs text-ink-muted">
                      Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 py-8 text-ink-muted">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Gerando QR code…</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabela de grupos do WhatsApp */}
      <div className="bg-surface-card rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <button onClick={toggleAll} className="text-ink-muted hover:text-ink-primary transition-colors">
              {allSelected
                ? <CheckSquare size={16} className="text-brand-500" />
                : <Square      size={16} />}
            </button>
            <div>
              <h3 className="text-sm font-semibold text-ink-primary">
                Grupos do WhatsApp
                {groups.length > 0 && (
                  <span className="text-ink-muted font-normal ml-1.5">({groups.length})</span>
                )}
              </h3>
              {selectedCount > 0 && (
                <p className="text-[11px] text-brand-500 mt-0.5">{selectedCount} selecionado(s)</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchGroups}
              title="Recarregar lista"
              disabled={waStatus !== "connected"}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink-primary hover:bg-white/[0.04] transition-colors disabled:opacity-40"
            >
              <RefreshCw size={14} className={loadingGroups ? "animate-spin" : ""} />
            </button>

            <button
              onClick={handleExtract}
              disabled={selectedCount === 0 || extracting || waStatus !== "connected"}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                selectedCount > 0 && waStatus === "connected" && !extracting
                  ? "bg-brand-500 hover:bg-brand-600 text-white shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                  : "bg-surface-secondary border border-white/[0.08] text-ink-muted cursor-not-allowed"
              }`}
            >
              {extracting
                ? <><Loader2 size={14} className="animate-spin" /> Extraindo…</>
                : <><Download size={14} /> Extrair Selecionados {selectedCount > 0 ? `(${selectedCount})` : ""}</>
              }
            </button>
          </div>
        </div>

        {waStatus !== "connected" ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-ink-muted">
            <WifiOff size={24} className="opacity-25" />
            <p className="text-sm">Conecte o WhatsApp para ver seus grupos.</p>
          </div>
        ) : loadingGroups ? (
          <div className="flex items-center justify-center gap-2 py-12 text-ink-muted">
            <Loader2 size={16} className="animate-spin text-brand-500" />
            <span className="text-sm">Carregando grupos do WhatsApp…</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-ink-muted">
            <Users size={24} className="opacity-25" />
            <p className="text-sm">Nenhum grupo encontrado neste WhatsApp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="w-10 px-5 py-2.5" />
                  <th className="pb-2.5 pt-2.5 text-left px-2 text-[11px] font-medium text-ink-muted uppercase tracking-wider">Grupo</th>
                  <th className="pb-2.5 pt-2.5 text-center px-2 text-[11px] font-medium text-ink-muted uppercase tracking-wider">Membros</th>
                  <th className="pb-2.5 pt-2.5 text-center px-2 text-[11px] font-medium text-ink-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const rs = rowStatus[group.jid] ?? "idle";
                  const isSelected = selected.has(group.jid);

                  return (
                    <tr
                      key={group.jid}
                      onClick={() => toggleGroup(group.jid)}
                      className={`border-b border-white/[0.04] last:border-0 cursor-pointer transition-colors ${
                        isSelected ? "bg-brand-500/[0.06]" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div onClick={(e) => { e.stopPropagation(); toggleGroup(group.jid); }}>
                          {isSelected
                            ? <CheckSquare size={15} className="text-brand-500" />
                            : <Square      size={15} className="text-ink-muted" />}
                        </div>
                      </td>

                      <td className="py-3 px-2">
                        <div className="font-medium text-ink-primary truncate max-w-[300px]">
                          {group.name}
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center text-xs text-ink-secondary">
                        {group.participants}
                      </td>

                      <td className="py-3 px-2 text-center">
                        {rs === "idle" && (
                          <span className="text-[11px] text-ink-muted">—</span>
                        )}
                        {rs === "extracting" && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-yellow-400">
                            <Loader2 size={10} className="animate-spin" /> Extraindo
                          </span>
                        )}
                        {rs === "done" && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-brand-500">
                            <CheckCircle2 size={10} /> Concluído
                          </span>
                        )}
                        {rs === "error" && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-red-400"
                            title={rowError[group.jid]}
                          >
                            <XCircle size={10} /> Erro
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {waStatus !== "connected" && selectedCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm">
          <AlertCircle size={14} className="shrink-0" />
          Conecte o WhatsApp antes de extrair os leads.
        </div>
      )}
    </div>
  );
}
