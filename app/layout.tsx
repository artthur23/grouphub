import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GroupHub — Monitor de grupos WhatsApp",
  description: "Dashboard para monitorar e coletar grupos WhatsApp de múltiplas fontes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans">{children}</body>
    </html>
  );
}
