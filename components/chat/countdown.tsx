"use client";

import { useEffect, useState } from "react";

/**
 * Contagem regressiva até a cota liberar.
 *
 * O servidor já manda `retryAfter` em segundos no corpo do 429 e no header
 * `retry-after`; antes a UI jogava fora e dizia só "tenta de novo daqui a
 * pouco". Dizer quanto falta é a diferença entre um limite e um castigo.
 */
export function Countdown({
  seconds,
  label,
  onDone,
}: {
  seconds: number;
  label: string;
  onDone?: () => void;
}) {
  // Sem effect de sincronia (proibido pelo react-hooks/set-state-in-effect
  // do eslint-config-next 16): o pai passa `key={seconds}` e o componente
  // remonta quando o valor muda.
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) {
      onDone?.();
      return;
    }
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, onDone]);

  if (left <= 0) return null;

  const minutes = Math.floor(left / 60);
  const secs = left % 60;
  const text =
    minutes > 0 ? `${minutes}m${String(secs).padStart(2, "0")}s` : `${secs}s`;

  return (
    <span className="text-faint">
      {label} <span className="tabular-nums text-secondary">{text}</span>
    </span>
  );
}
