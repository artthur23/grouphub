import { NextResponse } from "next/server";
import { wa } from "@/lib/whatsapp/client";
import QRCode from "qrcode";

export async function GET() {
  let qrImage: string | null = null;

  if (wa.qr) {
    try {
      qrImage = await QRCode.toDataURL(wa.qr, { width: 256, margin: 2 });
    } catch {}
  }

  return NextResponse.json({ status: wa.status, qr: qrImage });
}
