"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Link do header que sabe onde você está. O marcador `›` (o chevron do
 * prompt) só aparece na rota ativa — é o "você está aqui" do terminal.
 * Em telas grandes o espaço do chevron fica reservado nos inativos para
 * que a linha não dance ao navegar.
 */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "rounded-field px-2 py-1.5 text-sm transition-colors sm:px-2.5",
        active
          ? "bg-base-200 text-base-content"
          : "text-muted hover:bg-base-200/60 hover:text-base-content",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={
          active ? "text-primary" : "hidden text-transparent sm:inline"
        }
      >
        ›
      </span>
      {children}
    </Link>
  );
}
