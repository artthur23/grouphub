import type { NormalizedGroup } from "@/types";
import {
  extractWhatsAppLinksFromText,
  extractGroupHash,
  deduplicateGroups,
  BROWSER_USER_AGENT,
} from "@/lib/parsing";

// ============================================================
// Adaptador Devzapp
//
// TODO: Substituir o bloco de fetch abaixo pela chamada real à
//       API da Devzapp quando os endpoints forem confirmados.
//
// Endpoints prováveis (confirmar com documentação Devzapp):
//   GET https://api.devzapp.com.br/groups?token={TOKEN}&list={ID}
//   Authorization: Bearer {DEVZAPP_API_KEY}
// ============================================================

export async function fetchGroupsFromDevzapp(
  sourceUrl: string
): Promise<NormalizedGroup[]> {
  // --------------------------------------------------------
  // PLACEHOLDER — Substituir pela chamada real à API Devzapp
  // --------------------------------------------------------
  // Exemplo de como ficará quando a API estiver disponível:
  //
  // const apiKey = process.env.DEVZAPP_API_KEY;
  // if (!apiKey) throw new Error("DEVZAPP_API_KEY não configurada");
  //
  // const response = await fetch(
  //   `https://api.devzapp.com.br/v2/group-links?url=${encodeURIComponent(sourceUrl)}`,
  //   { headers: { "x-api-key": apiKey } }
  // );
  // const data = await response.json();
  // return data.items.map((item: { groupUrl: string }) => ({
  //   groupLink: item.groupUrl,
  //   groupHash: extractGroupHash(item.groupUrl) ?? item.groupUrl,
  //   rawPayload: item,
  // }));
  // --------------------------------------------------------

  // Fallback atual: scraping da URL pública
  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": BROWSER_USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Devzapp retornou HTTP ${response.status}`);
  }

  const text = await response.text();
  const links = extractWhatsAppLinksFromText(text);

  const groups: NormalizedGroup[] = links.flatMap((link) => {
    const hash = extractGroupHash(link);
    if (!hash) return [];
    return [{ groupLink: link, groupHash: hash, rawPayload: { link, source: "devzapp" } }];
  });

  return deduplicateGroups(groups);
}
