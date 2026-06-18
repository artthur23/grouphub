import { NextResponse } from "next/server";
import { wa } from "@/lib/whatsapp/client";

export interface WAGroup {
  jid:          string;
  name:         string;
  participants: number;
  creation:     number;
}

export async function GET() {
  if (!wa.sock || wa.status !== "connected") {
    return NextResponse.json({ error: "WhatsApp não conectado" }, { status: 400 });
  }

  try {
    const all = await wa.sock.groupFetchAllParticipating();

    const groups: WAGroup[] = Object.entries(all).map(([jid, meta]) => ({
      jid,
      name:         (meta as any).subject ?? "Sem nome",
      participants: (meta as any).participants?.length ?? 0,
      creation:     (meta as any).creation ?? 0,
    }));

    groups.sort((a, b) => b.creation - a.creation);

    return NextResponse.json({ groups });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao buscar grupos" },
      { status: 500 },
    );
  }
}
