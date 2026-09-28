"use client";

import { useSyncExternalStore } from "react";

/**
 * `⌘K` no mac, `ctrl K` no resto. `navigator` só existe no cliente:
 * useSyncExternalStore lê esse estado externo sem effect e sem quebrar a
 * hidratação — o servidor renderiza "ctrl" e o cliente corrige.
 */
export function useIsMac(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => /mac/i.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}

export function KbdShortcut({ className = "" }: { className?: string }) {
  const isMac = useIsMac();
  return (
    <kbd className={`font-sans text-[0.7rem] tracking-tight ${className}`}>
      {isMac ? "⌘" : "ctrl"} K
    </kbd>
  );
}
