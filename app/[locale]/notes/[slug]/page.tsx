import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllNotes, getNote, formatDate } from "@/lib/notes";
import { locales, isLocale, bcp47, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/lib/site";
import { mdxComponents } from "@/components/mdx";
import { JsonLd } from "@/components/json-ld";
import { CdUp } from "@/components/cd-up";

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
  const { locale, slug } = await params;
  const l = isLocale(locale) ? locale : "pt";
  const note = getNote(slug);
  if (!note) return {};
  const path = `/notes/${slug}`;
  return {
    title: note.title,
    description: note.description,
    keywords: note.tags,
    authors: [{ name: site.name, url: site.url }],
    alternates: {
      canonical: `/${l}${path}`,
      languages: {
        "pt-BR": `/pt${path}`,
        "en-US": `/en${path}`,
        "x-default": `/pt${path}`,
      },
    },
    openGraph: {
      type: "article",
      title: note.title,
      description: note.description,
      url: `${site.url}/${l}${path}`,
      siteName: site.name,
      locale: bcp47[l].replace("-", "_"),
      publishedTime: note.date || undefined,
      authors: [site.name],
      tags: note.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: note.title,
      description: note.description,
    },
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

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: note.title,
    description: note.description,
    datePublished: note.date || undefined,
    dateModified: note.date || undefined,
    inLanguage: bcp47[l],
    keywords: note.tags.join(", "),
    url: `${site.url}/${l}/notes/${slug}`,
    mainEntityOfPage: `${site.url}/${l}/notes/${slug}`,
    author: { "@type": "Person", name: site.name, url: site.url },
  };

  return (
    <article className="mx-auto max-w-2xl">
      <JsonLd data={articleLd} />
      <CdUp />
      <div className="mt-6 mb-8 border-b border-base-300 pb-6">
        <h1 className="mb-2 text-2xl font-medium text-base-content">
          {note.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-faint">
          <span className="text-success" title="read-only">
            -r--r--r--
          </span>
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
