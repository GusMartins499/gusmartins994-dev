"use client";

import { usePathname } from "next/navigation";
import { KbdShortcut } from "@/components/kbd-shortcut";

/**
 * Lembrete do atalho da paleta. Sem gatilho visível no header do desktop,
 * é aqui (e no hero) que a paleta se anuncia. Some na página do chat, onde
 * o atalho não vale — o terminal já captura o teclado.
 */
export function PaletteHint({ label }: { label: string }) {
  const pathname = usePathname();
  if (pathname?.endsWith("/chat")) return null;

  return (
    <p className="mt-8 hidden items-center gap-2 text-xs text-faint sm:flex">
      <KbdShortcut className="rounded-field border border-base-300 px-1.5 py-0.5" />
      {label}
    </p>
  );
}
