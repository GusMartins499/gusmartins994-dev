import type { Metadata } from "next";
import { projects } from "@/content/projects";
import { SectionHeading } from "@/components/section";
import { ProjectCard } from "@/components/project-card";

export const metadata: Metadata = {
  title: "projetos",
  description: "Projetos e experimentos.",
};

export default function ProjectsPage() {
  return (
    <div>
      <SectionHeading as="h1">projetos</SectionHeading>
      <p className="mb-8 text-muted">
        Cada card abre o repositório no GitHub em nova aba.
      </p>
      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </div>
  );
}
