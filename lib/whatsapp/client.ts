import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} from "@whiskeysockets/baileys";
import path from "path";

export type WAStatus = "disconnected" | "connecting" | "connected";
export type WASocketInstance = ReturnType<typeof makeWASocket>;

// Logger silencioso — evita poluir o console
const silentLogger = {
  level: "silent",
  trace: () => {},
  debug: () => {},
  info:  () => {},
  warn:  () => {},
  error: () => {},
  child: function () { return this; },
} as any;

// Singleton global — sobrevive a hot-reloads no dev
const g = globalThis as typeof globalThis & {
  __wa: {
    sock:   WASocketInstance | null;
    qr:     string | null;
    status: WAStatus;
  };
};

if (!g.__wa) {
  g.__wa = { sock: null, qr: null, status: "disconnected" };
}

export const wa = g.__wa;

const AUTH_DIR = path.join(process.cwd(), ".wauth");

export async function connectWA(): Promise<void> {
  if (wa.status !== "disconnected") return;

  wa.status = "connecting";
  wa.qr = null;

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: silentLogger,
    browser: Browsers.macOS("Desktop"),
    connectTimeoutMs: 60_000,
  });

  wa.sock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) wa.qr = qr;

    if (connection === "close") {
      const code = (lastDisconnect?.error as any)?.output?.statusCode;
      wa.status = "disconnected";
      wa.sock = null;
      wa.qr = null;

      // Reconecta automaticamente, exceto quando foi logout explícito
      if (code !== DisconnectReason.loggedOut) {
        setTimeout(() => connectWA(), 5_000);
      }
    }

    if (connection === "open") {
      wa.status = "connected";
      wa.qr = null;
    }
  });
}

export function disconnectWA(): void {
  try { wa.sock?.end(undefined); } catch {}
  wa.sock   = null;
  wa.status = "disconnected";
  wa.qr     = null;
}
