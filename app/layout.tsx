import type { Metadata } from "next";
import { site } from "@/lib/site";

// Layout raiz mínimo: o <html>/<body> vivem em app/[locale]/layout.tsx,
// onde o locale está disponível para o atributo lang.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
