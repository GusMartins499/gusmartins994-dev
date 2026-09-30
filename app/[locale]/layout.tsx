import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { site, socials, stack } from "@/lib/site";
import { locales, isLocale, bcp47, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ThemeScript } from "@/components/theme-script";
import { JsonLd } from "@/components/json-ld";
import { alternatesFor, FEED_PATH } from "@/lib/seo";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingNav } from "@/components/floating-nav";
import { PageTransition } from "@/components/page-transition";

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
    applicationName: site.name,
    authors: [{ name: site.name, url: site.url }],
    creator: site.name,
    publisher: site.name,
    keywords: [
      site.name,
      "portfólio",
      "portfolio",
      "software engineer",
      "full-stack developer",
      "typescript",
      "javascript",
      "react",
      "next.js",
      "node.js",
    ],
    alternates: {
      ...alternatesFor(locale, ""),
      types: { "application/rss+xml": FEED_PATH },
    },
    openGraph: {
      title,
      description,
      siteName: site.name,
      url: `${site.url}/${locale}`,
      locale: bcp47[locale].replace("-", "_"),
      alternateLocale: locale === "pt" ? ["en_US"] : ["pt_BR"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      other: process.env.BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
        : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale: Locale = locale;
  const dict = getDictionary(typedLocale);

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${site.url}/#person`,
    name: site.name,
    url: `${site.url}/${typedLocale}`,
    image: `${site.url}/${typedLocale}/opengraph-image`,
    email: `mailto:${site.email}`,
    jobTitle: site.role[typedLocale],
    description: site.about[typedLocale].join(" "),
    knowsAbout: stack.flatMap((group) => group.items),
    knowsLanguage: ["pt-BR", "en"],
    sameAs: socials
      .filter((s) => s.href.startsWith("http"))
      .map((s) => s.href),
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: site.name,
    url: site.url,
    inLanguage: bcp47[typedLocale],
    author: { "@id": `${site.url}/#person` },
    publisher: { "@id": `${site.url}/#person` },
  };

  return (
    // `data-theme` fica fora do JSX de propósito: quem manda nele é o
    // `ThemeScript`/`lib/theme` no DOM. Se o atributo viesse daqui, trocar de
    // idioma (que remonta este layout em outro segmento `[locale]`) faria o
    // React reescrever o valor e jogar o tema de volta pro padrão.
    <html
      lang={bcp47[typedLocale]}
      className={jetbrainsMono.variable}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <JsonLd data={personLd} />
        <JsonLd data={websiteLd} />
      </head>
      <body className="min-h-dvh bg-base-100 text-base-content antialiased">
        <a href="#conteudo" className="skip-link">
          {dict.a11y.skip}
        </a>
        <Header locale={typedLocale} dict={dict} />
        <main id="conteudo" className="mx-auto max-w-3xl px-4 py-12">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer dict={dict} />
        <FloatingNav
          locale={typedLocale}
          backHomeLabel={dict.a11y.backHome}
          scrollTopLabel={dict.a11y.scrollTop}
        />
      </body>
    </html>
  );
}
