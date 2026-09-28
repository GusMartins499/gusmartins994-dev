import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getNote, formatDate } from "@/lib/notes";
import { site } from "@/lib/site";
import { isLocale } from "@/i18n/config";
import { OgFrame, og, ogSize, loadOgFonts } from "@/components/og";

export const alt = `${site.name} — notes`;
export const size = ogSize;
export const contentType = "image/png";

// Capa própria por note: o título do post é o que aparece quando o link é
// compartilhado, em vez do card genérico do perfil.
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l = isLocale(locale) ? locale : "pt";
  const note = getNote(slug);
  if (!note) notFound();

  // Títulos longos precisam de corpo menor p/ não estourar a moldura.
  const fontSize = note.title.length > 60 ? 48 : note.title.length > 40 ? 58 : 68;

  return new ImageResponse(
    (
      <OgFrame path={`${site.url.replace("https://", "")}/${l}/notes`}>
        <div style={{ display: "flex", fontSize: 30, color: og.muted }}>
          <span style={{ color: og.secondary }}>~&nbsp;</span>
          <span>cat {slug}.mdx</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize,
            lineHeight: 1.15,
            fontFamily: "monoBold",
            color: og.content,
          }}
        >
          {note.title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 24,
            color: og.muted,
            marginTop: 8,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: og.primary, flexShrink: 0 }}>{site.name}</span>
          {note.date ? (
            <span style={{ flexShrink: 0 }}>{formatDate(note.date, l)}</span>
          ) : null}
          {note.tags.length > 0 ? (
            <span style={{ color: og.secondary, flexShrink: 0 }}>
              {note.tags.slice(0, 2).map((tag) => `#${tag}`).join(" ")}
            </span>
          ) : null}
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await loadOgFonts() },
  );
}
