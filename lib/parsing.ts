// ============================================================
// Funções de parsing e normalização de links de grupos WhatsApp
// ============================================================

const WA_GROUP_PATTERN = /https?:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]{20,})/;
const WA_GROUP_HASH_PATTERN = /([A-Za-z0-9]{20,})/;

/** Valida se uma string é uma URL válida */
export function isValidUrl(raw: string): boolean {
  try {
    new URL(normalizeUrl(raw));
    return true;
  } catch {
    return false;
  }
}

/** Adiciona https:// se não houver protocolo */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Verifica se é um link de grupo WhatsApp */
export function isWhatsAppGroupLink(url: string): boolean {
  return WA_GROUP_PATTERN.test(url);
}

/** Extrai o hash de um link de grupo WhatsApp */
export function extractGroupHash(groupLink: string): string | null {
  const match = groupLink.match(WA_GROUP_PATTERN);
  if (match) return match[1];

  // Fallback: qualquer sequência alfanumérica longa
  const fallback = groupLink.match(WA_GROUP_HASH_PATTERN);
  return fallback ? fallback[1] : null;
}

/** Remove query params e fragmentos de uma URL */
export function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Normaliza e valida um link de grupo WhatsApp */
export function normalizeGroupLink(raw: string): string | null {
  const normalized = normalizeUrl(raw);
  if (!isWhatsAppGroupLink(normalized)) return null;
  return cleanUrl(normalized);
}

/** Remove duplicatas de um array de links pelo hash */
export function deduplicateGroups<T extends { groupHash: string }>(groups: T[]): T[] {
  const seen = new Set<string>();
  return groups.filter((g) => {
    if (seen.has(g.groupHash)) return false;
    seen.add(g.groupHash);
    return true;
  });
}

/** Extrai todos os links de grupos WhatsApp de um texto HTML/JSON arbitrário */
export function extractWhatsAppLinksFromText(text: string): string[] {
  const regex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/g;
  const matches = text.match(regex) ?? [];
  return [...new Set(matches.map(cleanUrl))];
}

/** Sanitiza mensagem de erro para não vazar detalhes internos */
export function sanitizeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Remove possíveis tokens/headers de mensagens de erro de rede
    return err.message.replace(/Bearer\s+\S+/gi, "[REDACTED]").substring(0, 500);
  }
  return "Erro desconhecido";
}
