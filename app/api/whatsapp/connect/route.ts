import { NextResponse } from "next/server";
import { connectWA, wa } from "@/lib/whatsapp/client";

export async function POST() {
  try {
    if (wa.status === "connected") {
      return NextResponse.json({ ok: true, status: "connected" });
    }
    connectWA(); // fire-and-forget — QR chega via /api/whatsapp/status
    return NextResponse.json({ ok: true, status: "connecting" });
  } catch {
    return NextResponse.json({ error: "Falha ao iniciar conexão" }, { status: 500 });
  }
}
