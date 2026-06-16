import { NextResponse } from "next/server";
import { disconnectWA } from "@/lib/whatsapp/client";

export async function POST() {
  disconnectWA();
  return NextResponse.json({ ok: true });
}
