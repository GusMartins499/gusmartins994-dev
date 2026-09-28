import Link from "next/link";
import { site } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangToggle } from "@/components/lang-toggle";
import { NavLink } from "@/components/nav-link";
import { Palette } from "@/components/palette";

export function Header({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/85 backdrop-blur-md">
      {/* Sem wrap: os quatro links não cabem em 375px, então abaixo de `sm`
          eles dão lugar ao gatilho da paleta — que é o menu no mobile. */}
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        <Link
          href={`/${locale}`}
          className="shrink-0 text-sm font-medium text-base-content hover:text-primary sm:text-base"
        >
          <span className="text-primary">~/</span>
          {site.handle}
        </Link>

        <nav
          aria-label="Navegação principal"
          className="ml-auto flex items-center gap-1"
        >
          <div className="hidden items-center gap-0.5 sm:flex">
            <NavLink href={`/${locale}/projects`}>{dict.nav.projects}</NavLink>
            <NavLink href={`/${locale}/notes`}>{dict.nav.notes}</NavLink>
            <NavLink href={`/${locale}/chat`}>{dict.nav.chat}</NavLink>
            <a
              href={`/cv/${locale}`}
              target="_blank"
              rel="noopener"
              className="rounded-field px-2 py-1.5 text-sm text-muted transition-colors hover:bg-base-200/60 hover:text-base-content sm:px-2.5"
            >
              {dict.nav.resume}
            </a>

            {/* separador: à esquerda navegação, à direita controles */}
            <span
              aria-hidden="true"
              className="mx-1.5 h-4 w-px bg-base-300"
            />
          </div>

          <Palette locale={locale} dict={dict} />
          <LangToggle current={locale} label={dict.a11y.language} />
          <ThemeToggle
            toLightLabel={dict.a11y.themeToLight}
            toDarkLabel={dict.a11y.themeToDark}
          />
        </nav>
      </div>
    </header>
  );
}
