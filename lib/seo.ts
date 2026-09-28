import type { Metadata } from "next";
import { locales, bcp47, type Locale } from "@/i18n/config";
import { site } from "@/lib/site";

// Helpers de SEO compartilhados. A ideia é ter um único lugar que sabe
// montar canonical/hreflang, para os quatro `generateMetadata` do app não
// divergirem entre si conforme novas rotas aparecem.

export const FEED_PATH = "/feed.xml";

/** URL absoluta a partir de um path relativo (`/pt/notes` → `https://.../pt/notes`). */
export function absoluteUrl(path: string): string {
  return `${site.url}${path}`;
}

/**
 * hreflang de uma rota relativa ao locale (`""`, `"/notes"`, `"/notes/slug"`).
 *
 * O `x-default` aponta para o path SEM locale: o proxy negocia o idioma por
 * cookie/Accept-Language ali, que é exatamente o que o x-default descreve.
 */
export function languagesFor(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((l) => [bcp47[l], `/${l}${path}`])),
    "x-default": path || "/",
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
