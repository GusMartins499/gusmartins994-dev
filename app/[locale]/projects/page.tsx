import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/content/projects";
import { site } from "@/lib/site";
import { isLocale, bcp47, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SectionHeading } from "@/components/section";
import { ProjectCard } from "@/components/project-card";
import { CdUp } from "@/components/cd-up";
import { ListKeyboard } from "@/components/list-keyboard";
import { JsonLd } from "@/components/json-ld";
import { alternatesFor, absoluteUrl } from "@/lib/seo";

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
    alternates: alternatesFor(locale, "/projects"),
    openGraph: {
      title: dict.projects.title,
      description: dict.projects.subtitle,
      url: absoluteUrl(`/${locale}/projects`),
      siteName: site.name,
      locale: bcp47[locale].replace("-", "_"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.projects.title,
      description: dict.projects.subtitle,
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

  const projectsLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": absoluteUrl(`/${l}/projects#collection`),
    name: dict.projects.title,
    description: dict.projects.subtitle,
    url: absoluteUrl(`/${l}/projects`),
    inLanguage: bcp47[l],
    isPartOf: { "@id": `${site.url}/#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: projects.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "SoftwareSourceCode",
          name: project.name,
          description: project.description[l],
          codeRepository: project.repo,
          programmingLanguage: project.stack,
          author: { "@id": `${site.url}/#person` },
        },
      })),
    },
  };

  return (
    <div>
      <JsonLd data={projectsLd} />
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
      <ListKeyboard label={dict.common.navigateList} />
    </div>
  );
}
