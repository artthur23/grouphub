import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sanitizeErrorMessage } from "@/lib/parsing";

// GET /api/pulled-groups
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const listName = searchParams.get("list_name");
    const sourceType = searchParams.get("source_type");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const isExport = searchParams.get("export") === "1";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const perPage = isExport
      ? 10_000
      : Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") ?? "50")));

    const supabase = createAdminClient();

    let query = supabase
      .from("pulled_groups")
      .select(
        "*, monitored_sources!inner(source_url, list_name)",
        { count: "exact" }
      )
      .order("pulled_at", { ascending: false });

    if (listName) query = query.ilike("list_name", `%${listName}%`);
    if (sourceType) query = query.eq("source_type", sourceType);
    if (status) query = query.eq("status", status);
    if (dateFrom) query = query.gte("pulled_at", dateFrom);
    if (dateTo) query = query.lte("pulled_at", `${dateTo}T23:59:59.999`);

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      total: count ?? 0,
      page,
      per_page: perPage,
    });
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 });
  }
}
