export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

// Mapa para APIs que esperam BCP-47 (Intl, atributo lang do <html>)
export const bcp47: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en-US",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
