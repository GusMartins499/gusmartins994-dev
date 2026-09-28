import { getAllNotes } from "@/lib/notes";
import { site } from "@/lib/site";
import { defaultLocale, bcp47 } from "@/i18n/config";
import { absoluteUrl, FEED_PATH } from "@/lib/seo";

// Feed RSS 2.0 dos notes. Conteúdo em português (o idioma em que são escritos),
// apontando para as URLs do locale padrão.

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

export const dynamic = "force-static";

export async function GET() {
  const notes = getAllNotes();
  const title = `${site.name} — notes`;
  const description =
    "Notes sobre Javascript/Typescript, Node.js, performance e problemas reais de produção.";

  const items = notes
    .map((note) => {
      const url = absoluteUrl(`/${defaultLocale}/notes/${note.slug}`);
      return [
        "    <item>",
        `      <title>${escapeXml(note.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escapeXml(note.description)}</description>`,
        note.date ? `      <pubDate>${rfc822(note.date)}</pubDate>` : "",
        ...note.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${absoluteUrl(`/${defaultLocale}/notes`)}</link>
    <description>${escapeXml(description)}</description>
    <language>${bcp47[defaultLocale]}</language>
    <managingEditor>${site.email} (${escapeXml(site.name)})</managingEditor>
    <atom:link href="${absoluteUrl(FEED_PATH)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
