import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sanitizeErrorMessage } from "@/lib/parsing";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/pulled-groups/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("pulled_groups")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 });
  }
}
