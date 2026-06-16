import type { NormalizedGroup } from "@/types";
import {
  extractWhatsAppLinksFromText,
  extractGroupHash,
  deduplicateGroups,
} from "@/lib/parsing";

// ============================================================
// Adaptador Genérico (fonte "other")
// Faz scraping da URL e extrai qualquer link WhatsApp encontrado.
// ============================================================

export async function fetchGroupsFromGenericSource(
  sourceUrl: string
): Promise<NormalizedGroup[]> {
  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "GroupHub-Bot/1.0" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`A fonte retornou HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  let text: string;

  if (contentType.includes("application/json")) {
    const json = await response.json();
    text = JSON.stringify(json);
  } else {
    text = await response.text();
  }

  const links = extractWhatsAppLinksFromText(text);

  const groups: NormalizedGroup[] = links.flatMap((link) => {
    const hash = extractGroupHash(link);
    if (!hash) return [];
    return [{ groupLink: link, groupHash: hash, rawPayload: { link, source: "other" } }];
  });

  return deduplicateGroups(groups);
}
