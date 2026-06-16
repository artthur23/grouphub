import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { runExtraction } from "@/lib/extraction";
import { sanitizeErrorMessage } from "@/lib/parsing";

type Params = { params: Promise<{ id: string }> };

// POST /api/monitored-sources/:id/run
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: source, error } = await supabase
      .from("monitored_sources")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !source) {
      return NextResponse.json({ error: "Monitoramento não encontrado" }, { status: 404 });
    }

    if (source.status === "paused") {
      return NextResponse.json(
        { error: "Monitoramento está pausado. Reative antes de executar." },
        { status: 400 }
      );
    }

    const result = await runExtraction(source);
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 });
  }
}
