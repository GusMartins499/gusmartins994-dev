import { site, socials } from "@/lib/site";
import type { Dictionary } from "@/i18n/dictionaries";

export function Footer({ dict }: { dict: Dictionary }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-base-300">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="mb-4 text-sm text-primary">## {dict.footer.contact}</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-base-content hover:text-primary"
              >
                <span className="text-muted">{s.label}:</span> {s.handle}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-faint">
          © {year} {site.name} — {dict.footer.builtWith}
        </p>
      </div>
    </footer>
  );
}
