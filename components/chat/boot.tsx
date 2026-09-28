"use client";

import { Mascot } from "./mascot";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Abertura da sessão, no espírito do boot do Claude Code: mascote desenhado
 * linha a linha, depois as linhas de status em cascata.
 *
 * Os atrasos são CSS (--line-delay), não timers — então o conteúdo já está
 * no DOM desde o primeiro paint. Leitor de tela e busca leem tudo; quem
 * pediu reduced-motion vê estático.
 */
export function Boot({ dict, mock }: { dict: Dictionary; mock: boolean }) {
  const lines: { text: string; className: string }[] = [
    { text: dict.chat.version, className: "text-base-content" },
    { text: dict.chat.bootModel, className: "text-muted" },
    { text: dict.chat.bootCwd, className: "text-faint" },
  ];

  return (
    <div className="flex items-start gap-4 pb-2">
      <Mascot />
      <div className="min-w-0 space-y-0.5 text-sm">
        {lines.map((line, i) => (
          <p
            key={line.text}
            className={`boot-line ${line.className}`}
            style={
              { "--line-delay": `${420 + i * 90}ms` } as React.CSSProperties
            }
          >
            {line.text}
          </p>
        ))}
        <p
          className="boot-line pt-2 text-muted"
          style={{ "--line-delay": "730ms" } as React.CSSProperties}
        >
          {dict.chat.bootTip}
        </p>
        {mock && (
          <p
            className="boot-line text-secondary"
            style={{ "--line-delay": "820ms" } as React.CSSProperties}
          >
            {dict.chat.bootMock}
          </p>
        )}
      </div>
    </div>
  );
}
