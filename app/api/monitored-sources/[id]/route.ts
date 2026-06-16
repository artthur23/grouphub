import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isValidUrl, normalizeUrl, sanitizeErrorMessage } from "@/lib/parsing";
import type { UpdateMonitoredSourceDto } from "@/types";

type Params = { params: Promise<{ id: string }> };

// GET /api/monitored-sources/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("monitored_sources")
      .select("*, extraction_runs(id, started_at, status, groups_inserted_count)")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 });
  }
}

// PATCH /api/monitored-sources/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body: UpdateMonitoredSourceDto = await req.json();

    const updates: Record<string, unknown> = {};

    if (body.source_url !== undefined) {
      if (!isValidUrl(body.source_url)) {
        return NextResponse.json({ error: "URL inválida" }, { status: 400 });
      }
      updates.source_url = normalizeUrl(body.source_url);
    }

    if (body.list_name !== undefined) {
      updates.list_name = body.list_name.trim();
    }

    if (body.source_type !== undefined) {
      const valid = ["sendflow", "devzapp", "manual", "other"];
      if (!valid.includes(body.source_type)) {
        return NextResponse.json({ error: "Tipo de fonte inválido" }, { status: 400 });
      }
      updates.source_type = body.source_type;
    }

    if (body.interval_minutes !== undefined) {
      if (![30, 60, 90].includes(body.interval_minutes)) {
        return NextResponse.json({ error: "Frequência inválida" }, { status: 400 });
      }
      updates.interval_minutes = body.interval_minutes;
    }

    if (body.status !== undefined) {
      const valid = ["active", "paused", "error"];
      if (!valid.includes(body.status)) {
        return NextResponse.json({ error: "Status inválido" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("monitored_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 });
  }
}

// DELETE /api/monitored-sources/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("monitored_sources")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 });
  }
}
