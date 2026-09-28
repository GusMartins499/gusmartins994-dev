import Link from "next/link";
import { formatDate, type NoteMeta } from "@/lib/notes";
import type { Locale } from "@/i18n/config";

export function NoteCard({
  note,
  locale,
  readingLabel,
}: {
  note: NoteMeta;
  locale: Locale;
  readingLabel: string;
}) {
  return (
    <article className="card-term group relative p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 font-medium text-base-content transition-colors group-hover:text-primary">
          <span
            aria-hidden="true"
            className="inline-block text-primary transition-transform duration-200 group-hover:translate-x-0.5"
          >
            {"> "}
          </span>
          {/* link esticado: o card inteiro é clicável, mas as tags abaixo
              continuam fora da âncora (não viram parte do nome do link) */}
          <Link
            href={`/${locale}/notes/${note.slug}`}
            data-nav-item
            className="underline-offset-4 after:absolute after:inset-0 group-hover:underline"
          >
            {note.title}
          </Link>
        </h3>
        <time
          dateTime={note.date}
          className="shrink-0 text-xs text-faint tabular-nums"
        >
          {formatDate(note.date, locale)}
        </time>
      </div>

      {/* o post é literalmente este arquivo no repositório */}
      <p className="mt-0.5 truncate text-xs text-faint">
        content/notes/{note.slug}.mdx
        <span aria-hidden="true"> · </span>
        <span className="tabular-nums">
          {note.readingMinutes} {readingLabel}
        </span>
      </p>

      <p className="mt-3 text-sm text-muted">{note.description}</p>

      {note.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
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
