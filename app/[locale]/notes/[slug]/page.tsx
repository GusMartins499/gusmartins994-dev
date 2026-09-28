import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getAllNotes,
  getNote,
  formatDate,
  extractHeadings,
} from "@/lib/notes";
import { locales, isLocale, bcp47, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/lib/site";
import { getMdxComponents } from "@/components/mdx";
import { ReadingProgress } from "@/components/reading-progress";
import Link from "next/link";
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
  const headings = extractHeadings(note.content);

  // A lista vem do mais recente para o mais antigo: o vizinho anterior no
  // array é o post mais novo.
  const all = getAllNotes();
  const index = all.findIndex((n) => n.slug === slug);
  const newer = index > 0 ? all[index - 1] : null;
  const older = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

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
    /* sem `text-justify`: em fonte monoespaçada e medida estreita ele abre
       buracos entre as palavras e atrapalha justamente a leitura */
    <article className="mx-auto max-w-2xl">
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      <ReadingProgress />
      <CdUp />

      <div className="mt-6 mb-8 border-b border-base-300 pb-6">
        <h1 className="mb-2 text-2xl font-medium text-base-content">
          {note.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-faint">
          <span className="text-success" title="read-only">
            -r--r--r--
          </span>
          <time dateTime={note.date} className="tabular-nums">
            {formatDate(note.date, l)}
          </time>
          <span className="tabular-nums">
            {note.readingMinutes} {dict.notes.readingTime}
          </span>
          {note.tags.length > 0 && (
            <span className="flex gap-2 text-secondary">
              {note.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Sumário: só aparece quando o post tem seções o bastante para que
          pular entre elas signifique alguma coisa. */}
      {headings.length >= 2 && (
        <nav
          aria-label={dict.notes.toc}
          className="mb-10 rounded-box border border-base-300 bg-base-200/60 p-4"
        >
          <p className="mb-2 text-sm text-secondary">
            <span aria-hidden="true" className="text-faint">
              ##{" "}
            </span>
            {dict.notes.toc}
          </p>
          <ol className="space-y-1 text-sm">
            {headings.map((heading) => (
              <li
                key={heading.id}
                className={heading.level === 3 ? "pl-4" : undefined}
              >
                <a
                  href={`#${heading.id}`}
                  className="text-muted transition-colors hover:text-primary"
                >
                  <span aria-hidden="true" className="text-faint">
                    ›{" "}
                  </span>
                  {heading.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="leading-relaxed">
        <MDXRemote source={note.content} components={getMdxComponents(dict)} />
      </div>

      {/* Fim do post: o chat já sabe o conteúdo desta note — em vez de
          fazer o visitante ir até /chat e reformular, a pergunta já sai
          pronta daqui. */}
      <div className="mt-10 flex justify-start">
        <Link
          href={`/${l}/chat?q=${encodeURIComponent(
            `${dict.notes.askPrefix} "${note.title}"`,
          )}`}
          className="term-btn"
        >
          <span aria-hidden="true" className="text-primary">
            ›
          </span>
          {dict.notes.askAbout}
        </Link>
      </div>

      {/* Fim do post: para onde ir agora */}
      {(newer || older) && (
        <nav
          aria-label={dict.notes.title}
          className="mt-14 grid grid-cols-1 gap-4 border-t border-base-300 pt-8 sm:grid-cols-2"
        >
          {newer ? (
            <Link
              href={`/${l}/notes/${newer.slug}`}
              className="card-term group p-4"
            >
              <span className="text-xs text-faint">
                <span aria-hidden="true">← </span>
                {dict.notes.newer}
              </span>
              <span className="mt-1 block text-sm text-base-content transition-colors group-hover:text-primary">
                {newer.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {older && (
            <Link
              href={`/${l}/notes/${older.slug}`}
              className="card-term group p-4 sm:text-right"
            >
              <span className="text-xs text-faint">
                {dict.notes.older}
                <span aria-hidden="true"> →</span>
              </span>
              <span className="mt-1 block text-sm text-base-content transition-colors group-hover:text-primary">
                {older.title}
              </span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
