import Link from "next/link";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { href: "/projects", label: "projetos" },
  { href: "/notes", label: "notes" },
];

export function Header() {
  return (
    <header className="border-b border-base-300">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="font-medium text-base-content hover:text-primary"
        >
          <span className="text-primary">~/</span>
          {site.name.replace(/\s+/g, "")}
        </Link>
        <nav aria-label="Navegação principal" className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-field px-3 py-1.5 text-sm text-muted hover:bg-base-200 hover:text-base-content"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
