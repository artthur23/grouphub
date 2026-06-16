import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runExtraction, calculateNextRun } from "@/lib/extraction";
import { isValidUrl, normalizeUrl, sanitizeErrorMessage } from "@/lib/parsing";
import type { CreateMonitoredSourceDto } from "@/types";

// GET /api/monitored-sources
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("monitored_sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err) },
      { status: 500 }
    );
  }
}

// POST /api/monitored-sources
export async function POST(req: NextRequest) {
  try {
    const body: CreateMonitoredSourceDto = await req.json();

    // Validação
    const { source_url, list_name, source_type, interval_minutes } = body;

    if (!source_url || !list_name || !source_type || !interval_minutes) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    if (!isValidUrl(source_url)) {
      return NextResponse.json(
        { error: "URL de origem inválida" },
        { status: 400 }
      );
    }

    if (![30, 60, 90].includes(interval_minutes)) {
      return NextResponse.json(
        { error: "Frequência deve ser 30, 60 ou 90 minutos" },
        { status: 400 }
      );
    }

    const validSources = ["sendflow", "devzapp", "manual", "other"];
    if (!validSources.includes(source_type)) {
      return NextResponse.json(
        { error: "Tipo de fonte inválido" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const normalizedUrl = normalizeUrl(source_url);

    // Criar monitoramento
    const { data: source, error: createError } = await supabase
      .from("monitored_sources")
      .insert({
        source_url: normalizedUrl,
        list_name: list_name.trim(),
        source_type,
        interval_minutes,
        status: "active",
        next_run_at: calculateNextRun(interval_minutes),
      })
      .select()
      .single();

    if (createError || !source) {
      throw createError ?? new Error("Falha ao criar monitoramento");
    }

    // Executar primeira busca imediatamente
    const extractionResult = await runExtraction(source);

    return NextResponse.json(
      { source, extraction: extractionResult },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err) },
      { status: 500 }
    );
  }
}
