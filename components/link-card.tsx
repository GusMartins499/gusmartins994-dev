import { ExternalIcon } from "@/components/project-card";

// Card de link externo no MDX, no lugar de um iframe: sites que mandam
// `frame-ancestors 'none'` não podem ser embutidos.
//
// Uso no MDX:  <LinkCard href="https://..." title="..." description="..." />

export function LinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="card-term group my-6 block p-5 no-underline"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate font-medium text-base-content transition-colors group-hover:text-primary">
          <span
            aria-hidden="true"
            className="inline-block text-primary transition-transform duration-200 group-hover:translate-x-0.5"
          >
            {"> "}
          </span>
          {title}
        </span>
        <ExternalIcon />
      </div>

      {/* para onde o card leva, dito por extenso */}
      <p className="mt-0.5 truncate text-xs text-faint">
        {href.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      </p>

      {description && <p className="mt-3 text-sm text-muted">{description}</p>}
    </a>
  );
}
