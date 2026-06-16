import type { NormalizedGroup } from "@/types";
import {
  isWhatsAppGroupLink,
  extractGroupHash,
  normalizeUrl,
  cleanUrl,
} from "@/lib/parsing";

// ============================================================
// Adaptador Manual
// O usuário fornece diretamente o link do grupo WhatsApp.
// ============================================================

export async function fetchGroupsFromManual(
  sourceUrl: string
): Promise<NormalizedGroup[]> {
  const normalized = cleanUrl(normalizeUrl(sourceUrl));

  if (!isWhatsAppGroupLink(normalized)) {
    throw new Error(
      "Para fonte Manual, o link deve ser um link direto de grupo WhatsApp (chat.whatsapp.com/...)"
    );
  }

  const hash = extractGroupHash(normalized);
  if (!hash) {
    throw new Error("Não foi possível extrair o hash do link de grupo WhatsApp");
  }

  return [
    {
      groupLink: normalized,
      groupHash: hash,
      rawPayload: { link: normalized, source: "manual" },
    },
  ];
}
