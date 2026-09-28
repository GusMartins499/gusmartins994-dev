"use client";

import { useState } from "react";

/**
 * O `#` que aparece ao lado do heading no hover: copia o link direto para
 * aquela seção. Cair no endereço certo é o mínimo que um post técnico deve
 * permitir a quem quer citar um trecho.
 */
export function HeadingAnchor({
  id,
  label,
  copiedLabel,
}: {
  id: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => {
        // sem clipboard: ao menos leva o endereço para a barra do navegador
        window.location.hash = id;
      });
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={copied ? copiedLabel : label}
      className="ml-2 cursor-pointer align-middle text-sm text-faint opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
    >
      {copied ? "✓" : "#"}
    </button>
  );
}
