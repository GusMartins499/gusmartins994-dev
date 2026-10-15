import { getAllNotes } from "@/lib/notes";
import { locales } from "@/i18n/config";
import { site } from "@/lib/site";

// As specs leem o conteúdo pelas mesmas funções do site, em vez de fixar
// slugs: note nova não quebra a suíte, e note que some do site quebra.

export { locales, site };

/** Notes de um locale, já com o fallback para o locale padrão. */
export const notesFor = getAllNotes;

/** Rotas estáticas, relativas ao locale. */
export const staticRoutes = ["", "/projects", "/notes", "/chat"] as const;

/** Toda página pública do site: rotas estáticas + notes, nos dois locales. */
export function allPages(): string[] {
  return locales.flatMap((locale) => [
    ...staticRoutes.map((route) => `/${locale}${route}`),
    ...notesFor(locale).map((note) => `/${locale}/notes/${note.slug}`),
  ]);
}

/** Path de uma URL absoluta ou relativa (o `location` de um redirect). */
export function pathOf(url: string): string {
  const parsed = new URL(url, "http://localhost");
  return parsed.pathname + parsed.search;
}
