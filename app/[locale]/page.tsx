import Link from "next/link";
import { site, stack } from "@/lib/site";
import { featuredProjects, projects } from "@/content/projects";
import { getAllNotes } from "@/lib/notes";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section";
import { ProjectCard } from "@/components/project-card";
import { NoteCard } from "@/components/note-card";
import { TagList } from "@/components/tag";
import { KbdShortcut } from "@/components/kbd-shortcut";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l: Locale = locale;
  const dict = getDictionary(l);
  const notes = getAllNotes(l);
  const latestNotes = notes.slice(0, 2);
  const techCount = new Set(stack.flatMap((group) => group.items)).size;

  // O hero se comporta como um comando e sua saída: `whoami` é digitado e as
  // linhas seguintes "imprimem" em cascata. Os atrasos ficam aqui, em um só
  // lugar, para a sequência continuar legível.
  const line = (delay: number) =>
    ({ "--line-delay": `${delay}ms` }) as React.CSSProperties;

  return (
    <div className="space-y-20">
      {/* Hero / about */}
      <section aria-labelledby="whoami" className="py-8 sm:py-14">
        <p className="text-sm text-faint">
          <span className="text-primary">~/{site.handle}</span>
          {" $ "}
          <span
            className="typewriter text-base-content"
            style={
              {
                "--type-steps": String(dict.home.whoami.length),
                "--type-width": `${dict.home.whoami.length}ch`,
                "--type-duration": "0.45s",
              } as React.CSSProperties
            }
          >
            {dict.home.whoami}
          </span>
          <span
            className="terminal-cursor ml-0.5 text-primary"
            aria-hidden="true"
          />
        </p>

        <h1
          id="whoami"
          className="boot-line mt-5 text-4xl font-medium tracking-tight text-base-content sm:text-5xl"
          style={line(520)}
        >
          {site.name}
        </h1>

        <p className="boot-line mt-3 text-lg text-primary" style={line(620)}>
          {`// ${site.role[l]}`}
        </p>

        <div
          className="boot-line mt-5 max-w-xl space-y-1 leading-relaxed text-muted"
          style={line(720)}
        >
          {site.about[l].map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>

        <div
          className="boot-line mt-8 flex flex-wrap items-center gap-2"
          style={line(820)}
        >
          <Link href={`/${l}/projects`} className="term-btn term-btn-primary">
            <span aria-hidden="true">›</span>
            {dict.home.cta.projects}
          </Link>
          <Link href={`/${l}/chat`} className="term-btn">
            <span aria-hidden="true" className="text-primary">
              ›
            </span>
            {dict.home.cta.chat}
          </Link>
          <a
            href={`/cv/${l}`}
            target="_blank"
            rel="noopener"
            className="term-btn"
          >
            {dict.home.cta.resume}
            <span aria-hidden="true" className="text-faint">
              ↗
            </span>
          </a>
        </div>

        <p
          className="boot-line mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint"
          style={line(920)}
        >
          <span className="tabular-nums">
            {projects.length} {dict.home.stats.projects}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {notes.length} {dict.home.stats.notes}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {techCount} {dict.home.stats.tech}
          </span>
        </p>

        <p
          className="boot-line mt-2 hidden items-center gap-1.5 text-xs text-faint sm:flex"
          style={line(1000)}
        >
          <KbdShortcut className="rounded-field border border-base-300 px-1.5 py-0.5" />
          {dict.home.paletteHint}
        </p>
      </section>

      {/* Skills & tech stack */}
      <section aria-labelledby="stack">
        <SectionHeading id="stack">{dict.sections.stack}</SectionHeading>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stack.map((group) => (
            <div
              key={group.group.pt}
              /* estático: sem o hover do .card-term, que só faz sentido
                 onde há para onde clicar */
              className="rounded-box border border-base-300 bg-base-200/60 p-4"
            >
              <dt className="mb-2.5 text-sm text-secondary">
                <span aria-hidden="true" className="text-faint">
                  ##{" "}
                </span>
                {group.group[l]}
              </dt>
              <dd>
                <TagList items={group.items} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Projetos em destaque */}
      <section aria-labelledby="projetos">
        <div className="mb-5 flex items-baseline justify-between">
          <SectionHeading id="projetos">
            {dict.sections.projects}
          </SectionHeading>
          <Link
            href={`/${l}/projects`}
            className="group text-sm text-muted hover:text-primary"
          >
            {dict.common.seeAll}{" "}
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {featuredProjects.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
              locale={l}
              openLabel={dict.a11y.openRepo}
            />
          ))}
        </div>
      </section>

      {/* Últimos notes */}
      {latestNotes.length > 0 && (
        <section aria-labelledby="notes">
          <div className="mb-5 flex items-baseline justify-between">
            <SectionHeading id="notes">{dict.sections.notes}</SectionHeading>
            <Link
              href={`/${l}/notes`}
              className="group text-sm text-muted hover:text-primary"
            >
              {dict.common.seeAll}{" "}
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {latestNotes.map((note) => (
              <NoteCard
              key={note.slug}
              note={note}
              locale={l}
              readingLabel={dict.notes.readingTime}
            />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
