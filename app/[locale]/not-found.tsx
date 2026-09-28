"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/lib/site";

/**
 * 404 no idioma da própria URL. É client component porque precisa do
 * caminho que o visitante tentou — a graça da tela é ele aparecer no
 * comando que falhou, como num shell de verdade.
 */
export default function NotFound() {
  const pathname = usePathname() ?? "/";
  const segment = pathname.split("/")[1];
  const locale = isLocale(segment) ? segment : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <section className="py-10 sm:py-16">
      <p className="text-sm text-faint">
        <span className="text-primary">~/{site.handle}</span> $ cd {pathname}
      </p>
      <p className="mt-2 text-sm text-error">
        cd: {pathname}: {dict.notFound.reason}
      </p>

      <h1 className="mt-8 text-4xl font-medium tracking-tight text-base-content sm:text-5xl">
        404
      </h1>
      <p className="mt-3 max-w-md text-muted">{dict.notFound.hint}</p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Link href={`/${locale}`} className="term-btn term-btn-primary">
          <span aria-hidden="true">›</span>
          {dict.notFound.home}
        </Link>
        <Link href={`/${locale}/notes`} className="term-btn">
          <span aria-hidden="true" className="text-primary">
            ›
          </span>
          {dict.nav.notes}
        </Link>
        <Link href={`/${locale}/projects`} className="term-btn">
          <span aria-hidden="true" className="text-primary">
            ›
          </span>
          {dict.nav.projects}
        </Link>
      </div>
    </section>
  );
}
