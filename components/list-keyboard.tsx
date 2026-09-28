"use client";

import { useEffect } from "react";

/**
 * `j` / `k` percorrem a lista, como em qualquer pager de terminal (e no
 * Vim). Move o foco de verdade entre os itens — então `enter` abre, o
 * leitor de tela anuncia e o `:focus-within` do card acende sozinho.
 *
 * Os itens se marcam com `data-nav-item` e precisam ser focáveis.
 */
export function ListKeyboard({ label }: { label: string }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (typing) return;

      const key = event.key.toLowerCase();
      if (key !== "j" && key !== "k") return;

      const items = Array.from(
        document.querySelectorAll<HTMLElement>("[data-nav-item]"),
      );
      if (items.length === 0) return;
      event.preventDefault();

      const active = document.activeElement;
      const current = items.findIndex(
        (item) => item === active || item.contains(active),
      );
      const next =
        current === -1
          ? 0
          : key === "j"
            ? Math.min(items.length - 1, current + 1)
            : Math.max(0, current - 1);

      const item = items[next];
      item.focus({ preventScroll: true });
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;
      item.scrollIntoView({
        block: "nearest",
        behavior: reduce ? "auto" : "smooth",
      });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <p className="mt-6 hidden items-center gap-1.5 text-xs text-faint sm:flex">
      <kbd className="rounded-field border border-base-300 px-1.5 py-0.5">j</kbd>
      <kbd className="rounded-field border border-base-300 px-1.5 py-0.5">k</kbd>
      {label}
    </p>
  );
}
