"use client";

import { useSyncExternalStore } from "react";
import { currentTheme, subscribeTheme, toggleTheme } from "@/lib/theme";

export function ThemeToggle({
  toLightLabel,
  toDarkLabel,
}: {
  toLightLabel: string;
  toDarkLabel: string;
}) {
  // O tema mora no DOM (`data-theme`, aplicado pelo theme-script antes da
  // hidratação) e pode ser trocado também pela paleta de comandos — ler o
  // atributo como store externo mantém os dois sempre no mesmo estado.
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => currentTheme(),
    () => "dark" as const,
  );

  const label = theme === "dark" ? toLightLabel : toDarkLabel;

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className="btn btn-ghost btn-sm btn-square"
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
