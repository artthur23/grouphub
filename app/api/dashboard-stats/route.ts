import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sanitizeErrorMessage } from "@/lib/parsing";

// GET /api/dashboard-stats
// Resumo agregado para o painel principal: contagens de monitoramentos e
// grupos por status, mais listas recentes para os painéis de atividade.
export async function GET() {
  try {
    const supabase = createAdminClient();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      sourcesTotal,
      sourcesActive,
      sourcesPaused,
      sourcesError,
      groupsTotal,
      groupsActive,
      groupsInvalid,
      groupsError,
      groupsToday,
      recentSources,
      recentGroups,
    ] = await Promise.all([
      supabase.from("monitored_sources").select("id", { count: "exact", head: true }),
      supabase.from("monitored_sources").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("monitored_sources").select("id", { count: "exact", head: true }).eq("status", "paused"),
      supabase.from("monitored_sources").select("id", { count: "exact", head: true }).eq("status", "error"),
      supabase.from("pulled_groups").select("id", { count: "exact", head: true }),
      supabase.from("pulled_groups").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("pulled_groups").select("id", { count: "exact", head: true }).eq("status", "invalid"),
      supabase.from("pulled_groups").select("id", { count: "exact", head: true }).eq("status", "error"),
      supabase.from("pulled_groups").select("id", { count: "exact", head: true }).gte("pulled_at", startOfToday.toISOString()),
      supabase
        .from("monitored_sources")
        .select("id, list_name, source_type, status, total_groups_found, last_run_at")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("pulled_groups")
        .select("id, group_name, list_name, status, pulled_at")
        .order("pulled_at", { ascending: false })
        .limit(5),
    ]);

    const firstError = [
      sourcesTotal, sourcesActive, sourcesPaused, sourcesError,
      groupsTotal, groupsActive, groupsInvalid, groupsError, groupsToday,
      recentSources, recentGroups,
    ].find((r) => r.error)?.error;
    if (firstError) throw firstError;

    return NextResponse.json({
      sources: {
        total: sourcesTotal.count ?? 0,
        active: sourcesActive.count ?? 0,
        paused: sourcesPaused.count ?? 0,
        error: sourcesError.count ?? 0,
      },
      groups: {
        total: groupsTotal.count ?? 0,
        active: groupsActive.count ?? 0,
        invalid: groupsInvalid.count ?? 0,
        error: groupsError.count ?? 0,
        today: groupsToday.count ?? 0,
      },
      recentSources: recentSources.data ?? [],
      recentGroups: recentGroups.data ?? [],
    });
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 });
  }
}
