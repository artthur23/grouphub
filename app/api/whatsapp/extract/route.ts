import { NextRequest, NextResponse } from "next/server";
import { wa } from "@/lib/whatsapp/client";

interface GroupInput {
  id:   string;
  name: string | null;
  link: string;
}

export interface ParticipantResult {
  phone:   string;
  isAdmin: boolean;
}

export interface GroupResult {
  id:           string;
  name:         string | null;
  participants: ParticipantResult[];
  error?:       string;
}

function getInviteCode(link: string): string {
  const m = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
  return m ? m[1] : link;
}

function formatPhone(jid: string): string {
  if (jid.endsWith("@lid")) return jid; // comunidade — mantém @lid
  return jid.replace(/@s\.whatsapp\.net$/, "").replace(/@c\.us$/, "");
}

export async function POST(req: NextRequest) {
  const { groups } = (await req.json()) as { groups: GroupInput[] };

  if (!wa.sock || wa.status !== "connected") {
    return NextResponse.json({ error: "WhatsApp não conectado" }, { status: 400 });
  }

  const results: GroupResult[] = [];

  for (const group of groups) {
    try {
      const code = getInviteCode(group.link);

      // Entra no grupo via código de convite
      const jid = (await wa.sock.groupAcceptInvite(code)) as string;

      // Aguarda sincronização dos dados do grupo
      await new Promise((r) => setTimeout(r, 2_000));

      // Busca metadados com participantes
      const meta = await wa.sock.groupMetadata(jid);

      // Deduplica por número, separa admins de regulares
      const seen = new Set<string>();
      const participants: ParticipantResult[] = [];

      // Admins primeiro
      for (const p of meta.participants) {
        if (!p.admin) continue;
        const phone = formatPhone(p.id);
        if (seen.has(phone)) continue;
        seen.add(phone);
        participants.push({ phone, isAdmin: true });
      }

      // Membros regulares
      for (const p of meta.participants) {
        if (p.admin) continue;
        const phone = formatPhone(p.id);
        if (seen.has(phone)) continue;
        seen.add(phone);
        participants.push({ phone, isAdmin: false });
      }

      results.push({ id: group.id, name: group.name, participants });
    } catch (err) {
      results.push({
        id:           group.id,
        name:         group.name,
        participants: [],
        error:        err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }

  return NextResponse.json({ results });
}
