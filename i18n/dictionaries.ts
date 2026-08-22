import type { Locale } from "./config";
import { pt, type Dictionary } from "./pt";
import { en } from "./en";

const dictionaries: Record<Locale, Dictionary> = { pt, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
