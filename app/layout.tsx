import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { ThemeScript } from "@/components/theme-script";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s · ${site.name}`,
  },
  description: `Portfólio de ${site.name}, ${site.role}.`,
  openGraph: {
    title: `${site.name} — ${site.role}`,
    description: `Portfólio de ${site.name}, ${site.role}.`,
    url: site.url,
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.locale} data-theme="dark" className={jetbrainsMono.variable}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-base-100 text-base-content antialiased">
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo" className="mx-auto max-w-3xl px-4 py-12">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
