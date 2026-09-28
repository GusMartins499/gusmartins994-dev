import type { Project } from "@/content/projects";
import type { Locale } from "@/i18n/config";
import { TagList } from "@/components/tag";

/** `https://github.com/GusMartins499/woovi-challenge` → `GusMartins499/woovi-challenge` */
function repoPath(repo: string): string {
  return repo.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, "");
}

export function ProjectCard({
  project,
  locale,
  openLabel,
}: {
  project: Project;
  locale: Locale;
  openLabel: string;
}) {
  return (
    <a
      href={project.repo}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${project.name} — ${openLabel}`}
      data-nav-item
      className="card-term group block p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 truncate font-medium text-base-content transition-colors group-hover:text-primary">
          <span
            aria-hidden="true"
            className="inline-block text-primary transition-transform duration-200 group-hover:translate-x-0.5"
          >
            {"> "}
          </span>
          {project.name}
        </h3>
        <ExternalIcon />
      </div>

      {/* para onde o card leva, dito por extenso */}
      <p className="mt-0.5 truncate text-xs text-faint">
        github.com/{repoPath(project.repo)}
      </p>

      <p className="mt-3 mb-4 text-sm text-muted">
        {project.description[locale]}
      </p>

      <TagList items={project.stack} />
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
      className="shrink-0 text-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}
