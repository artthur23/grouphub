import type { GroupStatus } from "@/types";
import { sanitizeErrorMessage, BROWSER_USER_AGENT } from "@/lib/parsing";

// ============================================================
// Revalidação de links de grupo WhatsApp
//
// Não existe API pública oficial para checar validade de um
// convite. A página de convite (https://chat.whatsapp.com/<hash>)
// é renderizada por JS e o HTML estático é idêntico para convites
// válidos e inválidos — exceto a meta tag og:title, que o
// WhatsApp preenche server-side com o nome do grupo quando o
// convite é válido, e deixa vazia (content="") quando é inválido.
// Confirmado empiricamente comparando um link ativo e um expirado.
// ============================================================

const OG_TITLE_PATTERN = /<meta\s+property="og:title"\s+content="([^"]*)"/i;

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#039": "'",
  apos: "'",
};

/** Decodifica entidades HTML básicas (numéricas e nomeadas) de um og:title */
function decodeHtmlEntities(raw: string): string {
  return raw.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z0-9]+);/g, (match, code) => {
    if (code.startsWith("#x")) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return HTML_ENTITIES[code] ?? match;
  });
}

export interface GroupLinkCheckResult {
  status: GroupStatus;
  groupName: string | null;
  errorMessage: string | null;
}

export async function checkGroupLinkStatus(groupLink: string): Promise<GroupLinkCheckResult> {
  try {
    const response = await fetch(groupLink, {
      headers: { "User-Agent": BROWSER_USER_AGENT },
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 404) {
      return { status: "invalid", groupName: null, errorMessage: null };
    }

    if (!response.ok) {
      return {
        status: "error",
        groupName: null,
        errorMessage: `A página retornou HTTP ${response.status}`,
      };
    }

    const html = await response.text();
    const match = html.match(OG_TITLE_PATTERN);

    if (!match) {
      // Não achou a meta tag esperada — página mudou de formato, tratar como erro transitório
      return {
        status: "error",
        groupName: null,
        errorMessage: "Meta tag og:title não encontrada na página de convite",
      };
    }

    const title = decodeHtmlEntities(match[1]).trim();

    if (title === "") {
      return { status: "invalid", groupName: null, errorMessage: null };
    }

    return { status: "active", groupName: title, errorMessage: null };
  } catch (err) {
    return { status: "error", groupName: null, errorMessage: sanitizeErrorMessage(err) };
  }
}
