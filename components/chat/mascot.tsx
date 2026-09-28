"use client";

import { MASCOT, cellKind } from "@/lib/chat/ascii";

/**
 * Mascote ASCII derivado de app/icon.svg.
 *
 * A animação revela uma linha por vez (via animation-delay em CSS, sem
 * timer em JS) e o bloco de cursor fica piscando depois. Quem pediu
 * prefers-reduced-motion vê o desenho completo, parado — as regras em
 * globals.css zeram as durações.
 */
export function Mascot({ animate = true }: { animate?: boolean }) {
  return (
    <pre
      aria-hidden="true"
      className="select-none text-[0.5rem] leading-[0.85] sm:text-[0.62rem]"
    >
      {MASCOT.map((row, y) => (
        <div
          key={y}
          className={animate ? "mascot-row" : undefined}
          style={
            animate
              ? ({ "--row-delay": `${y * 55}ms` } as React.CSSProperties)
              : undefined
          }
        >
          {[...row].map((char, x) => {
            const kind = cellKind(char);
            if (kind === "empty") return <span key={x}> </span>;
            return (
              <span
                key={x}
                className={
                  kind === "chevron"
                    ? "text-primary"
                    : "mascot-cursor text-secondary"
                }
              >
                █
              </span>
            );
          })}
        </div>
      ))}
    </pre>
  );
}
