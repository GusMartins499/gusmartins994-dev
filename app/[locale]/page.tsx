import Link from "next/link";
import { site, stack } from "@/lib/site";
import { featuredProjects } from "@/content/projects";
import { getAllNotes } from "@/lib/notes";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section";
import { ProjectCard } from "@/components/project-card";
import { NoteCard } from "@/components/note-card";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l: Locale = locale;
  const dict = getDictionary(l);
  const latestNotes = getAllNotes().slice(0, 2);

  return (
    <div className="space-y-20">
      {/* Hero / about */}
      <section aria-labelledby="whoami" className="py-10 sm:py-16">
        <h1
          id="whoami"
          className="text-3xl font-medium tracking-tight text-base-content sm:text-4xl"
        >
          <span className="text-muted">~ </span>
          <span
            className="typewriter"
            style={
              {
                "--type-steps": String(site.name.length),
                "--type-width": `${site.name.length}ch`,
              } as React.CSSProperties
            }
          >
            {site.name}
          </span>
          <span
            className="terminal-cursor ml-0.5 text-primary"
            aria-hidden="true"
          />
        </h1>
        <p className="mt-4 text-lg text-primary">{`// ${site.role[l]}`}</p>
        <div className="mt-6 max-w-xl space-y-1 leading-relaxed text-muted">
          {site.about[l].map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      {/* Skills & tech stack */}
      <section aria-labelledby="stack">
        <SectionHeading id="stack">{dict.sections.stack}</SectionHeading>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stack.map((group) => (
            <div
              key={group.group.pt}
              className="rounded-box border border-base-300 bg-base-200 p-4"
            >
              <dt className="mb-2 text-sm text-secondary">{group.group[l]}</dt>
              <dd>
                <ul className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-field bg-base-100 px-2 py-0.5 text-xs text-base-content"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
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
              <NoteCard key={note.slug} note={note} locale={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
