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
import { alternatesFor, absoluteUrl } from "@/lib/seo";

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
    alternates: alternatesFor(l, path),
    openGraph: {
      type: "article",
      title: note.title,
      description: note.description,
      url: absoluteUrl(`/${l}${path}`),
      siteName: site.name,
      locale: bcp47[l].replace("-", "_"),
      publishedTime: note.date || undefined,
      modifiedTime: note.date || undefined,
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

  const noteUrl = absoluteUrl(`/${l}/notes/${slug}`);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${noteUrl}#article`,
    headline: note.title,
    description: note.description,
    datePublished: note.date || undefined,
    dateModified: note.date || undefined,
    inLanguage: bcp47[l],
    keywords: note.tags.join(", "),
    url: noteUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": noteUrl },
    image: `${noteUrl}/opengraph-image`,
    // Contagem aproximada (o corpo é MDX), suficiente p/ o rich result.
    wordCount: note.content.trim().split(/\s+/).length,
    isPartOf: { "@id": absoluteUrl(`/${l}/notes#blog`) },
    author: { "@id": `${site.url}/#person` },
    publisher: { "@id": `${site.url}/#person` },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: site.name,
        item: absoluteUrl(`/${l}`),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: dict.notes.title,
        item: absoluteUrl(`/${l}/notes`),
      },
      { "@type": "ListItem", position: 3, name: note.title, item: noteUrl },
    ],
  };

  return (
    <article className="mx-auto max-w-2xl text-justify">
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
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
        </div>
      </div>

      <div className="leading-relaxed">
        <MDXRemote source={note.content} components={mdxComponents} />
      </div>
    </article>
  );
}
