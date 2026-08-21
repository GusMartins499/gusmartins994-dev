import type { Metadata } from "next";
import { getAllNotes } from "@/lib/notes";
import { SectionHeading } from "@/components/section";
import { NoteCard } from "@/components/note-card";

export const metadata: Metadata = {
  title: "notes",
  description: "Anotações e textos soltos.",
};

export default function NotesPage() {
  const notes = getAllNotes();

  return (
    <div>
      <SectionHeading as="h1">notes</SectionHeading>
      <p className="mb-8 text-muted">
        Um canto pra escrever sobre o que ando aprendendo.
      </p>
      {notes.length === 0 ? (
        <p className="text-faint">Nada por aqui ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.slug} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
