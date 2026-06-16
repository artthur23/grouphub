import { createAdminClient } from "@/lib/supabase/server";
import { fetchGroupsBySourceType } from "@/lib/adapters";
import { deduplicateGroups, sanitizeErrorMessage } from "@/lib/parsing";
import { checkGroupLinkStatus } from "@/lib/validation";
import type { MonitoredSource, ExtractionResult } from "@/types";

// ============================================================
// Motor de extração — coração do sistema
// Chamado pelo endpoint /run, pelo cron e pelo "Salvar e puxar agora"
// ============================================================

export async function runExtraction(source: MonitoredSource): Promise<ExtractionResult> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. Registrar início da execução
  const { data: run, error: runCreateError } = await supabase
    .from("extraction_runs")
    .insert({
      monitored_source_id: source.id,
      started_at: now,
      status: "running",
    })
    .select()
    .single();

  if (runCreateError || !run) {
    throw new Error("Falha ao criar registro de execução: " + runCreateError?.message);
  }

  const result: ExtractionResult = {
    found: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  let rawResponse: Record<string, unknown> = {};

  try {
    // 2. Buscar grupos via adaptador da fonte
    const groups = await fetchGroupsBySourceType(source.source_type, source.source_url);
    const unique = deduplicateGroups(groups);

    result.found = unique.length;
    rawResponse = { groups_found: unique.length, sample: unique.slice(0, 3) };

    // 3. Validar e inserir cada grupo (ignorar duplicatas via ON CONFLICT DO NOTHING)
    for (const group of unique) {
      const check = await checkGroupLinkStatus(group.groupLink);

      const { error: insertError } = await supabase.from("pulled_groups").insert({
        monitored_source_id: source.id,
        group_link: group.groupLink,
        list_name: source.list_name,
        source_type: source.source_type,
        group_hash: group.groupHash,
        pulled_at: now,
        status: check.status,
        group_name: check.groupName,
        error_message: check.errorMessage,
        raw_payload: group.rawPayload,
        last_checked_at: now,
      });

      if (insertError) {
        // Código 23505 = unique_violation (duplicata) — esperado, não é erro
        if (insertError.code === "23505") {
          result.skipped++;
        } else {
          result.errors.push(sanitizeErrorMessage(insertError));
        }
      } else {
        result.inserted++;
      }
    }

    // 4. Atualizar contador total da fonte
    await supabase
      .from("monitored_sources")
      .update({
        total_groups_found: source.total_groups_found + result.inserted,
        last_run_at: now,
        next_run_at: calculateNextRun(source.interval_minutes),
        last_error_message: null,
        status: "active",
      })
      .eq("id", source.id);

    // 5. Finalizar run com sucesso
    await supabase
      .from("extraction_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "success",
        groups_found_count: result.found,
        groups_inserted_count: result.inserted,
        groups_skipped_count: result.skipped,
        raw_response: rawResponse,
      })
      .eq("id", run.id);
  } catch (err) {
    const message = sanitizeErrorMessage(err);
    result.errors.push(message);

    // Marcar fonte com erro
    await supabase
      .from("monitored_sources")
      .update({
        last_run_at: now,
        next_run_at: calculateNextRun(source.interval_minutes),
        last_error_message: message,
        status: "error",
      })
      .eq("id", source.id);

    // Finalizar run com erro
    await supabase
      .from("extraction_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "error",
        groups_found_count: result.found,
        groups_inserted_count: result.inserted,
        groups_skipped_count: result.skipped,
        error_message: message,
        raw_response: rawResponse,
      })
      .eq("id", run.id);
  }

  return result;
}

/** Calcula o próximo horário de execução baseado no intervalo em minutos */
export function calculateNextRun(intervalMinutes: number): string {
  const next = new Date();
  next.setMinutes(next.getMinutes() + intervalMinutes);
  return next.toISOString();
}

/** Verifica se uma fonte está vencida (deveria ter sido executada) */
export function isSourceDue(source: MonitoredSource): boolean {
  if (source.status !== "active") return false;
  if (!source.next_run_at) return true;
  return new Date(source.next_run_at) <= new Date();
}
