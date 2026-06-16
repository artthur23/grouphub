import type { NormalizedGroup } from "@/types";
import {
  extractWhatsAppLinksFromText,
  extractGroupHash,
  deduplicateGroups,
  sanitizeErrorMessage,
  BROWSER_USER_AGENT,
} from "@/lib/parsing";

// ============================================================
// Adaptador Sendflow
//
// TODO: Substituir o bloco de fetch abaixo pela chamada real à
//       API da Sendflow quando os endpoints forem confirmados.
//
// Endpoints prováveis (confirmar com documentação Sendflow):
//   GET https://api.sendflow.com/v1/lists/{listId}/members
//   Authorization: Bearer {SENDFLOW_API_KEY}
//
// O adaptador atualmente faz scraping do HTML da URL pública
// como fallback até que a API oficial seja integrada.
// ============================================================

export async function fetchGroupsFromSendflow(
  sourceUrl: string
): Promise<NormalizedGroup[]> {
  // --------------------------------------------------------
  // PLACEHOLDER — Substituir pela chamada real à API Sendflow
  // --------------------------------------------------------
  // Exemplo de como ficará quando a API estiver disponível:
  //
  // const apiKey = process.env.SENDFLOW_API_KEY;
  // if (!apiKey) throw new Error("SENDFLOW_API_KEY não configurada");
  //
  // const listId = extractListIdFromUrl(sourceUrl);
  // const response = await fetch(
  //   `https://api.sendflow.com/v1/lists/${listId}/whatsapp-groups`,
  //   { headers: { Authorization: `Bearer ${apiKey}` } }
  // );
  // const data = await response.json();
  // return data.groups.map((g: { link: string; hash: string }) => ({
  //   groupLink: g.link,
  //   groupHash: g.hash,
  //   rawPayload: g,
  // }));
  // --------------------------------------------------------

  // Fallback atual: extrai links do conteúdo público da URL
  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": BROWSER_USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Sendflow retornou HTTP ${response.status}`);
  }

  const text = await response.text();
  const links = extractWhatsAppLinksFromText(text);

  const groups: NormalizedGroup[] = links.flatMap((link) => {
    const hash = extractGroupHash(link);
    if (!hash) return [];
    return [{ groupLink: link, groupHash: hash, rawPayload: { link, source: "sendflow" } }];
  });

  return deduplicateGroups(groups);
}
