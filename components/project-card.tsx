import type { Project } from "@/content/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={project.repo}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${project.name} — abrir repositório no GitHub (nova aba)`}
      className="group block rounded-box border border-base-300 bg-base-200 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-lg hover:shadow-primary/10 focus-visible:border-primary"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-medium text-base-content group-hover:text-primary">
          <span aria-hidden="true" className="text-primary">
            {"> "}
          </span>
          {project.name}
        </h3>
        <ExternalIcon />
      </div>
      <p className="mb-4 text-sm text-muted">{project.description}</p>
      <ul className="flex flex-wrap gap-1.5">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded-field bg-accent-soft px-2 py-0.5 text-xs text-primary"
          >
            {tech}
          </li>
        ))}
      </ul>
    </a>
  );
}

function ExternalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}
