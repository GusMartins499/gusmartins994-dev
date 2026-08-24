import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllNotes } from "@/lib/notes";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SectionHeading } from "@/components/section";
import { NoteCard } from "@/components/note-card";
import { CdUp } from "@/components/cd-up";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.notes.title };
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

  return (
    <div>
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
