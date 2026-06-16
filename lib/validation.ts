import type { GroupStatus } from "@/types";
import { sanitizeErrorMessage } from "@/lib/parsing";

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

export interface GroupLinkCheckResult {
  status: GroupStatus;
  errorMessage: string | null;
}

export async function checkGroupLinkStatus(groupLink: string): Promise<GroupLinkCheckResult> {
  try {
    const response = await fetch(groupLink, {
      headers: { "User-Agent": "GroupHub-Bot/1.0" },
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 404) {
      return { status: "invalid", errorMessage: null };
    }

    if (!response.ok) {
      return { status: "error", errorMessage: `A página retornou HTTP ${response.status}` };
    }

    const html = await response.text();
    const match = html.match(OG_TITLE_PATTERN);

    if (!match) {
      // Não achou a meta tag esperada — página mudou de formato, tratar como erro transitório
      return { status: "error", errorMessage: "Meta tag og:title não encontrada na página de convite" };
    }

    if (match[1].trim() === "") {
      return { status: "invalid", errorMessage: null };
    }

    return { status: "active", errorMessage: null };
  } catch (err) {
    return { status: "error", errorMessage: sanitizeErrorMessage(err) };
  }
}
