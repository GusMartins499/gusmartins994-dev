import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { locales } from "@/i18n/config";
import { getAllNotes } from "@/lib/notes";
import { absoluteLanguagesFor } from "@/lib/seo";

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
