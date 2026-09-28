"use client";

import { useEffect, useRef, useState } from "react";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * Spinner braille com verbo rotativo e tempo decorrido — o estado de
 * "loading" do Claude Code. O texto vivo fica fora do aria-live (seria
 * ruído a 80ms); um resumo estável é anunciado uma vez só.
 */
export function Spinner({
  verbs,
  hint,
  srLabel,
}: {
  verbs: string[];
  hint: string;
  srLabel: string;
}) {
  const [frame, setFrame] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  // Date.now() só dentro do effect: chamar em render quebra a pureza
  // exigida pelo react-hooks/purity do eslint-config-next 16.
  const started = useRef<number | null>(null);

  useEffect(() => {
    started.current = Date.now();
    const spin = setInterval(() => setFrame((f) => f + 1), 80);
    const tick = setInterval(
      () =>
        setElapsed(
          Math.floor((Date.now() - (started.current ?? Date.now())) / 100) / 10,
        ),
      100,
    );
    return () => {
      clearInterval(spin);
      clearInterval(tick);
    };
  }, []);

  // Troca de verbo a cada ~2.4s, para a espera não parecer travada.
  const verb = verbs[Math.floor(frame / 30) % verbs.length];

  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <span aria-hidden="true" className="text-primary">
        {FRAMES[frame % FRAMES.length]}
      </span>
      <span aria-hidden="true" className="text-muted">
        {verb}
      </span>
      <span aria-hidden="true" className="text-faint tabular-nums">
        {elapsed.toFixed(1)}s
      </span>
      <span aria-hidden="true" className="text-faint">
        · {hint}
      </span>
      <span className="sr-only">{srLabel}</span>
    </div>
  );
}
