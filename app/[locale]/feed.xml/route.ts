import { notFound } from "next/navigation";
import { buildFeed, FEED_HEADERS } from "@/lib/feed";
import { locales, isLocale, defaultLocale } from "@/i18n/config";

// Feed por locale. O locale padrão vive em /feed.xml (rota na raiz), então
// aqui só respondem os demais — duas URLs para o mesmo feed dariam conteúdo
// duplicado com dois <atom:link rel="self"> diferentes.

export const dynamic = "force-static";

export function generateStaticParams() {
  return locales.filter((l) => l !== defaultLocale).map((locale) => ({ locale }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === defaultLocale) notFound();
  return new Response(buildFeed(locale), { headers: FEED_HEADERS });
}
