import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { locales, bcp47 } from "@/i18n/config";
import { getAllNotes } from "@/lib/notes";

// Constrói o objeto `languages` (hreflang) para uma rota relativa,
// apontando cada locale para sua URL absoluta correspondente.
function languagesFor(path: string): Record<string, string> {
  return Object.fromEntries(
    locales.map((l) => [bcp47[l], `${site.url}/${l}${path}`]),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; changeFrequency: "monthly" | "weekly"; priority: number }[] = [
    { path: "", changeFrequency: "monthly", priority: 1 },
    { path: "/projects", changeFrequency: "monthly", priority: 0.8 },
    { path: "/notes", changeFrequency: "weekly", priority: 0.7 },
  ];

  const notes = getAllNotes();
  const lastNote = notes[0]?.date;

  const staticEntries: MetadataRoute.Sitemap = routes.flatMap((route) =>
    locales.map((l) => ({
      url: `${site.url}/${l}${route.path}`,
      lastModified: route.path === "/notes" && lastNote ? lastNote : undefined,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: languagesFor(route.path) },
    })),
  );

  const noteEntries: MetadataRoute.Sitemap = notes.flatMap((note) =>
    locales.map((l) => ({
      url: `${site.url}/${l}/notes/${note.slug}`,
      lastModified: note.date || undefined,
      changeFrequency: "yearly" as const,
      priority: 0.6,
      alternates: { languages: languagesFor(`/notes/${note.slug}`) },
    })),
  );

  return [...staticEntries, ...noteEntries];
}
