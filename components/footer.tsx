import { site, socials } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-base-300">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="mb-4 text-sm text-primary">## contato</p>
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
          © {year} {site.name} — feito com next.js, tailwind e daisyui.
        </p>
      </div>
    </footer>
  );
}
