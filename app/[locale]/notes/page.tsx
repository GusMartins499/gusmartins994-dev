import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllNotes } from "@/lib/notes";
import { site } from "@/lib/site";
import { isLocale, bcp47, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SectionHeading } from "@/components/section";
import { NoteCard } from "@/components/note-card";
import { CdUp } from "@/components/cd-up";
import { JsonLd } from "@/components/json-ld";
import { alternatesFor, FEED_PATH, absoluteUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.notes.title,
    description: dict.notes.subtitle,
    alternates: {
      ...alternatesFor(locale, "/notes"),
      types: { "application/rss+xml": FEED_PATH },
    },
    openGraph: {
      title: dict.notes.title,
      description: dict.notes.subtitle,
      url: absoluteUrl(`/${locale}/notes`),
      siteName: site.name,
      locale: bcp47[locale].replace("-", "_"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.notes.title,
      description: dict.notes.subtitle,
    },
  };
}

export default async function NotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l: Locale = locale;
  const dict = getDictionary(l);
  const notes = getAllNotes();

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": absoluteUrl(`/${l}/notes#blog`),
    name: dict.notes.title,
    description: dict.notes.subtitle,
    url: absoluteUrl(`/${l}/notes`),
    inLanguage: bcp47[l],
    author: { "@id": `${site.url}/#person` },
    publisher: { "@id": `${site.url}/#person` },
    isPartOf: { "@id": `${site.url}/#website` },
    blogPost: notes.map((note) => ({
      "@type": "BlogPosting",
      headline: note.title,
      description: note.description,
      datePublished: note.date || undefined,
      url: absoluteUrl(`/${l}/notes/${note.slug}`),
    })),
  };

  return (
    <div>
      <JsonLd data={blogLd} />
      <div className="mb-6">
        <CdUp />
      </div>
      <SectionHeading as="h1">{dict.notes.title}</SectionHeading>
      <p className="mb-8 text-muted">{dict.notes.subtitle}</p>
      <p className="mb-8 text-muted text-xs">
        Soon, all posts will be translated into English
      </p>
      {notes.length === 0 ? (
        <p className="text-faint">{dict.notes.empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.slug} note={note} locale={l} />
          ))}
        </div>
      )}
    </div>
  );
}
