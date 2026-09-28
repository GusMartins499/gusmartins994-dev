import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export type CommandName =
  | "help"
  | "clear"
  | "projects"
  | "notes"
  | "cv"
  | "theme"
  | "lang";

export const COMMAND_NAMES: CommandName[] = [
  "help",
  "clear",
  "projects",
  "notes",
  "cv",
  "theme",
  "lang",
];

export function commandList(dict: Dictionary) {
  return COMMAND_NAMES.map((name) => ({
    name,
    description: dict.chat.commands[name],
  }));
}

/** Prefixo digitado (`/pro`) → comandos que casam, para o autocompletar. */
export function matchCommands(input: string): CommandName[] {
  if (!input.startsWith("/")) return [];
  const term = input.slice(1).toLowerCase();
  return COMMAND_NAMES.filter((c) => c.startsWith(term));
}

export function hrefFor(name: CommandName, locale: Locale): string | null {
  switch (name) {
    case "projects":
      return `/${locale}/projects`;
    case "notes":
      return `/${locale}/notes`;
    case "cv":
      return `/cv/${locale}`;
    default:
      return null;
  }
}
