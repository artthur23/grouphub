import { NextRequest, NextResponse } from "next/server";
import { wa } from "@/lib/whatsapp/client";

export interface ParticipantResult {
  phone:   string;
  isAdmin: boolean;
}

export interface GroupResult {
  jid:          string;
  name:         string;
  participants: ParticipantResult[];
  error?:       string;
}

function formatPhone(jid: string): string {
  if (jid.endsWith("@lid")) return jid;
  return jid.replace(/@s\.whatsapp\.net$/, "").replace(/@c\.us$/, "");
}

export async function POST(req: NextRequest) {
  const { groups } = (await req.json()) as {
    groups: { jid: string; name: string }[];
  };

  if (!wa.sock || wa.status !== "connected") {
    return NextResponse.json({ error: "WhatsApp não conectado" }, { status: 400 });
  }

  const results: GroupResult[] = [];

  for (const group of groups) {
    try {
      const meta = await wa.sock.groupMetadata(group.jid);

      const seen = new Set<string>();
      const participants: ParticipantResult[] = [];

      for (const p of meta.participants) {
        if (!p.admin) continue;
        const phone = formatPhone(p.id);
        if (seen.has(phone)) continue;
        seen.add(phone);
        participants.push({ phone, isAdmin: true });
      }

      for (const p of meta.participants) {
        if (p.admin) continue;
        const phone = formatPhone(p.id);
        if (seen.has(phone)) continue;
        seen.add(phone);
        participants.push({ phone, isAdmin: false });
      }

      results.push({ jid: group.jid, name: meta.subject ?? group.name, participants });
    } catch (err) {
      results.push({
        jid:          group.jid,
        name:         group.name,
        participants: [],
        error:        err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }

  return NextResponse.json({ results });
}
