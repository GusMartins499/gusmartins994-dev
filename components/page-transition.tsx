"use client";

import { usePathname } from "next/navigation";

/**
 * Continuidade entre rotas: o conteúdo entra com um fade curto em vez de
 * aparecer de um quadro pro outro.
 *
 * O `key` no pathname é o truque — trocar a chave remonta a subárvore e a
 * animação CSS roda de novo, sem precisar de biblioteca nem da View
 * Transitions API (o `<ViewTransition>` do React ainda é canary; aqui roda
 * React 19 estável). `prefers-reduced-motion` já zera a animação no CSS.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
