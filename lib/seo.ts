import type { Metadata } from "next";
import { locales, bcp47, defaultLocale, type Locale } from "@/i18n/config";
import { site } from "@/lib/site";

// Helpers de SEO compartilhados. A ideia é ter um único lugar que sabe
// montar canonical/hreflang, para os quatro `generateMetadata` do app não
// divergirem entre si conforme novas rotas aparecem.

/** Feed do locale padrão. Mantido na raiz: é a URL que já está no ar. */
export const FEED_PATH = "/feed.xml";

/** Feed de um locale. O padrão fica na raiz para não quebrar quem já assina. */
export function feedPathFor(locale: Locale): string {
  return locale === defaultLocale ? FEED_PATH : `/${locale}/feed.xml`;
}

/** URL absoluta a partir de um path relativo (`/pt/notes` → `https://.../pt/notes`). */
export function absoluteUrl(path: string): string {
  return `${site.url}${path}`;
}

/**
 * hreflang de uma rota relativa ao locale (`""`, `"/notes"`, `"/notes/slug"`).
 *
 * O `x-default` aponta para a URL do locale padrão, não para o path sem
 * locale. O path sem locale até descreve melhor a ideia (o proxy negocia o
 * idioma ali), mas ele responde 307, e hreflang apontando para redirect é
 * sinal mais fraco. Pior: o matcher do proxy ignora path com ponto, então um
 * slug como `node.js-streams` cairia em 404 justamente no x-default.
 */
export function languagesFor(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((l) => [bcp47[l], `/${l}${path}`])),
    "x-default": `/${defaultLocale}${path}`,
  };
}

/** Mesma coisa, com URLs absolutas — o sitemap.xml não passa por metadataBase. */
export function absoluteLanguagesFor(path: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(languagesFor(path)).map(([key, value]) => [
      key,
      absoluteUrl(value),
    ]),
  );
}

/** `alternates` completo (canonical + hreflang) para uma rota localizada. */
export function alternatesFor(
  locale: Locale,
  path: string,
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: `/${locale}${path}`,
    languages: languagesFor(path),
  };
}
