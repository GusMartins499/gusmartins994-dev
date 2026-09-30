import { getAllNotes } from "@/lib/notes";
import { site } from "@/lib/site";
import { bcp47, defaultLocale, type Locale } from "@/i18n/config";
import { absoluteUrl, feedPathFor } from "@/lib/seo";
import { getDictionary } from "@/i18n/dictionaries";

// Feed RSS 2.0 dos notes, um por locale. Antes existia um só, em português,
// anunciado também em /en/notes — quem assinasse de lá recebia português.

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    c === "<"
      ? "&lt;"
      : c === ">"
        ? "&gt;"
        : c === "&"
          ? "&amp;"
          : c === "'"
            ? "&apos;"
            : "&quot;",
  );
}

function rfc822(iso: string): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00Z`).toUTCString();
}

export function buildFeed(locale: Locale = defaultLocale): string {
  const dict = getDictionary(locale);
  const notes = getAllNotes(locale);
  const title = `${site.name} — ${dict.notes.title}`;

  const items = notes
    .map((note) => {
      const url = absoluteUrl(`/${locale}/notes/${note.slug}`);
      return [
        "    <item>",
        `      <title>${escapeXml(note.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escapeXml(note.description)}</description>`,
        note.date ? `      <pubDate>${rfc822(note.date)}</pubDate>` : "",
        ...note.tags.map(
          (tag) => `      <category>${escapeXml(tag)}</category>`,
        ),
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${absoluteUrl(`/${locale}/notes`)}</link>
    <description>${escapeXml(dict.notes.subtitle)}</description>
    <language>${bcp47[locale]}</language>
    <managingEditor>${site.email} (${escapeXml(site.name)})</managingEditor>
    <atom:link href="${absoluteUrl(feedPathFor(locale))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

export const FEED_HEADERS = {
  "Content-Type": "application/rss+xml; charset=utf-8",
  "Cache-Control":
    "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
};
