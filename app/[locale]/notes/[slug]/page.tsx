import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllNotes, getNote, formatDate } from "@/lib/notes";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { mdxComponents } from "@/components/mdx";

export function generateStaticParams() {
  const notes = getAllNotes();
  return locales.flatMap((locale) =>
    notes.map((note) => ({ locale, slug: note.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return {};
  return {
    title: note.title,
    description: note.description,
    // O conteúdo é sempre PT — canonical aponta pra versão /pt.
    alternates: { canonical: `/pt/notes/${slug}` },
  };
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const l: Locale = locale;
  const dict = getDictionary(l);
  const note = getNote(slug);
  if (!note) notFound();

  return (
    <article className="mx-auto max-w-2xl">
      <Link href={`/${l}/notes`} className="text-sm text-muted hover:text-primary">
        ← {dict.common.backToNotes}
      </Link>

      <div className="mt-6 mb-8 border-b border-base-300 pb-6">
        <h1 className="mb-2 text-2xl font-medium text-base-content">
          {note.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-faint">
          <time dateTime={note.date} className="tabular-nums">
            {formatDate(note.date, l)}
          </time>
          {note.tags.length > 0 && (
            <span className="flex gap-2 text-secondary">
              {note.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </span>
          )}
          {l === "en" && (
            <span className="rounded-field bg-accent-soft px-2 py-0.5 text-xs text-primary">
              {dict.notes.ptBadge}
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
