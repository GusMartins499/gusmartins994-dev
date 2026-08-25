import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/content/projects";
import { site } from "@/lib/site";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SectionHeading } from "@/components/section";
import { ProjectCard } from "@/components/project-card";
import { CdUp } from "@/components/cd-up";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.projects.title,
    description: dict.projects.subtitle,
    alternates: {
      canonical: `/${locale}/projects`,
      languages: {
        "pt-BR": "/pt/projects",
        "en-US": "/en/projects",
        "x-default": "/pt/projects",
      },
    },
    openGraph: {
      title: dict.projects.title,
      description: dict.projects.subtitle,
      url: `${site.url}/${locale}/projects`,
      type: "website",
    },
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l: Locale = locale;
  const dict = getDictionary(l);

  return (
    <div>
      <div className="mb-6">
        <CdUp />
      </div>
      <SectionHeading as="h1">{dict.projects.title}</SectionHeading>
      <p className="mb-8 text-muted">{dict.projects.subtitle}</p>
      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.name}
            project={project}
            locale={l}
            openLabel={dict.a11y.openRepo}
          />
        ))}
      </div>
    </div>
  );
}
