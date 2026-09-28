export type Theme = "dark" | "light";

/**
 * Leitura/escrita do tema no DOM. O `theme-script` já aplica `data-theme` no
 * <html> antes da hidratação — aqui só lemos o que ele deixou e alternamos.
 * Centralizado para que o toggle do header e a paleta de comandos não
 * divirjam.
 */
export function currentTheme(): Theme {
  return (
    (document.documentElement.getAttribute("data-theme") as Theme | null) ??
    "dark"
  );
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignora indisponibilidade de storage
  }
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

/**
 * Assina mudanças do `data-theme` no <html>. Serve de store externo para
 * `useSyncExternalStore`: o toggle do header e a paleta mexem no mesmo DOM,
 * então ambos se mantêm em sincronia sem estado compartilhado em React.
 */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}
