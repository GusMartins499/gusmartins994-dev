import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { locales } from "@/i18n/config";
import { getAllNotes } from "@/lib/notes";
import { absoluteLanguagesFor } from "@/lib/seo";

/**
 * `lastModified` das rotas que não têm data própria no conteúdo.
 *
 * Escrito à mão de propósito. `new Date()` seria automático, mas mudaria a
 * cada build: o crawler que vê `lastmod` andar sem o conteúdo mudar passa a
 * ignorar o campo, e aí ele não serve para nada. Data de arquivo (mtime)
 * também não resolve — o build da Vercel parte de um clone novo, então todo
 * arquivo nasce com a data do build.
 *
 * Então: ao mudar o conteúdo de uma destas páginas, atualize a data dela aqui.
 * `/notes` é a exceção — a data vem da nota mais recente.
 */
const routes: {
  path: string;
  lastModified: string;
  changeFrequency: "monthly" | "weekly";
  priority: number;
}[] = [
  {
    path: "",
    lastModified: "2026-09-30",
    changeFrequency: "monthly",
    priority: 1,
  },
  {
    path: "/projects",
    lastModified: "2026-09-30",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/notes",
    lastModified: "2026-09-30",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/chat",
    lastModified: "2026-09-30",
    changeFrequency: "monthly",
    priority: 0.6,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const notes = getAllNotes();
  const lastNote = notes[0]?.date;

  const staticEntries: MetadataRoute.Sitemap = routes.flatMap((route) =>
    locales.map((l) => ({
      url: `${site.url}/${l}${route.path}`,
      lastModified:
        route.path === "/notes" && lastNote ? lastNote : route.lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: absoluteLanguagesFor(route.path) },
    })),
  );

  const noteEntries: MetadataRoute.Sitemap = notes.flatMap((note) =>
    locales.map((l) => ({
      url: `${site.url}/${l}/notes/${note.slug}`,
      lastModified: note.date || undefined,
      changeFrequency: "yearly" as const,
      priority: 0.6,
      alternates: { languages: absoluteLanguagesFor(`/notes/${note.slug}`) },
    })),
  );

  return [...staticEntries, ...noteEntries];
}
