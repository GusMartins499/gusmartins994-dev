import type { Locale } from "@/i18n/config";

/** `/pt/notes/foo` + `en` → `/en/notes/foo`. */
export function withLocale(pathname: string, target: Locale): string {
  const segments = pathname.split("/");
  segments[1] = target;
  return segments.join("/") || `/${target}`;
}

/** Persiste a preferência de idioma pro middleware (proxy.ts) ler. */
export function rememberLocale(target: Locale): void {
  try {
    document.cookie = `NEXT_LOCALE=${target};path=/;max-age=31536000`;
  } catch {
    // ignora indisponibilidade de cookies
  }
}
