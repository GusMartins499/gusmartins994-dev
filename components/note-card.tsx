import Link from "next/link";
import { formatDate, type NoteMeta } from "@/lib/notes";

export function NoteCard({ note }: { note: NoteMeta }) {
  return (
    <article className="group rounded-box border border-base-300 bg-base-200 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
      <Link href={`/notes/${note.slug}`} className="group block">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h3 className="font-medium text-base-content underline-offset-4 group-hover:text-primary group-hover:underline">
            {note.title}
          </h3>
          <time
            dateTime={note.date}
            className="shrink-0 text-xs text-faint tabular-nums"
          >
            {formatDate(note.date)}
          </time>
        </div>
        <p className="text-sm text-muted">{note.description}</p>
      </Link>
      {note.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <li key={tag} className="text-xs text-secondary">
              #{tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
