import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllNotes, getNote, formatDate } from "@/lib/notes";
import { mdxComponents } from "@/components/mdx";

export function generateStaticParams() {
  return getAllNotes().map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return {};
  return { title: note.title, description: note.description };
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) notFound();

  return (
    <article className="mx-auto max-w-2xl">
      <Link
        href="/notes"
        className="text-sm text-muted hover:text-primary"
      >
        ← notes
      </Link>

      <div className="mt-6 mb-8 border-b border-base-300 pb-6">
        <h1 className="mb-2 text-2xl font-medium text-base-content">
          {note.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-faint">
          <time dateTime={note.date} className="tabular-nums">
            {formatDate(note.date)}
          </time>
          {note.tags.length > 0 && (
            <span className="flex gap-2 text-secondary">
              {note.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </span>
          )}
        </div>
      </div>

      <div className="leading-relaxed">
        <MDXRemote source={note.content} components={mdxComponents} />
      </div>
    </article>
  );
}
