import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runExtraction, isSourceDue } from "@/lib/extraction";
import { sanitizeErrorMessage } from "@/lib/parsing";
import type { MonitoredSource } from "@/types";

// POST /api/cron/process-sources
// Chamado pelo Vercel Cron ou manualmente. Protegido por CRON_SECRET.
export async function POST(req: NextRequest) {
  // Verificar autorização
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  try {
    // Buscar todas as fontes ativas com next_run_at vencido
    const { data: sources, error } = await supabase
      .from("monitored_sources")
      .select("*")
      .eq("status", "active")
      .lte("next_run_at", now);

    if (error) throw error;
    if (!sources || sources.length === 0) {
      return NextResponse.json({ processed: 0, message: "Nenhuma fonte vencida" });
    }

    // Processar cada fonte vencida (com filtro extra de segurança)
    const due = (sources as MonitoredSource[]).filter(isSourceDue);

    const results = await Promise.allSettled(
      due.map((source) => runExtraction(source))
    );

    const summary = results.map((r, i) => ({
      source_id: due[i].id,
      list_name: due[i].list_name,
      status: r.status,
      ...(r.status === "fulfilled"
        ? { result: r.value }
        : { error: sanitizeErrorMessage(r.reason) }),
    }));

    return NextResponse.json({
      processed: due.length,
      summary,
    });
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 });
  }
}

// GET para Vercel Cron (Vercel também usa GET em alguns casos)
export async function GET(req: NextRequest) {
  return POST(req);
}
