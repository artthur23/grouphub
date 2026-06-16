import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkGroupLinkStatus } from "@/lib/validation";
import { sanitizeErrorMessage } from "@/lib/parsing";
import type { PulledGroup } from "@/types";

const BATCH_SIZE = 100;
const CONCURRENCY = 5;

// POST /api/cron/validate-groups
// Revalida periodicamente os links de grupos já puxados, marcando
// como "invalid" os convites expirados/removidos. Chamado pelo
// Vercel Cron ou manualmente. Protegido por CRON_SECRET.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  try {
    const { data: groups, error } = await supabase
      .from("pulled_groups")
      .select("*")
      .eq("status", "active")
      .order("last_checked_at", { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE);

    if (error) throw error;
    if (!groups || groups.length === 0) {
      return NextResponse.json({ checked: 0, message: "Nenhum grupo para revalidar" });
    }

    const summary = { checked: 0, active: 0, invalid: 0, error: 0 };

    for (let i = 0; i < groups.length; i += CONCURRENCY) {
      const chunk = groups.slice(i, i + CONCURRENCY) as PulledGroup[];

      const results = await Promise.allSettled(
        chunk.map(async (group) => {
          const { status, errorMessage } = await checkGroupLinkStatus(group.group_link);

          await supabase
            .from("pulled_groups")
            .update({
              status,
              error_message: errorMessage,
              last_checked_at: now,
            })
            .eq("id", group.id);

          return status;
        })
      );

      for (const result of results) {
        summary.checked++;
        if (result.status === "fulfilled") {
          summary[result.value]++;
        } else {
          summary.error++;
        }
      }
    }

    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 });
  }
}

// GET para Vercel Cron (Vercel também usa GET em alguns casos)
export async function GET(req: NextRequest) {
  return POST(req);
}
