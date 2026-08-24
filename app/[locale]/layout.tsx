import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { site } from "@/lib/site";
import { locales, isLocale, bcp47, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ThemeScript } from "@/components/theme-script";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const role = site.role[locale];
  const title = `${site.name} — ${role}`;
  const description = `${dict.meta.portfolioOf} ${site.name}, ${role}.`;
  return {
    title: { default: title, template: `%s · ${site.name}` },
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { "pt-BR": "/pt", en: "/en" },
    },
    openGraph: {
      title,
      description,
      url: `${site.url}/${locale}`,
      locale: bcp47[locale].replace("-", "_"),
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale: Locale = locale;
  const dict = getDictionary(typedLocale);

  return (
    <html
      lang={bcp47[typedLocale]}
      data-theme="dark"
      className={jetbrainsMono.variable}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-base-100 text-base-content antialiased">
        <a href="#conteudo" className="skip-link">
          {dict.a11y.skip}
        </a>
        <Header locale={typedLocale} dict={dict} />
        <main id="conteudo" className="mx-auto max-w-3xl px-4 py-12">
          {children}
        </main>
        <Footer dict={dict} />
      </body>
    </html>
  );
}
