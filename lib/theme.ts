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

/**
 * Último tema escolhido nesta aba. O `localStorage` é a persistência entre
 * visitas, mas pode estar bloqueado (modo privado); guardar em memória mantém
 * a escolha válida enquanto a aba viver — inclusive quando o React remonta o
 * <html> e o `ThemeSync` precisa repor o atributo.
 */
let chosen: Theme | null = null;

export function applyTheme(theme: Theme): void {
  chosen = theme;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignora indisponibilidade de storage
  }
}

/**
 * A preferência efetiva, na mesma ordem do `theme-script`: escolha desta
 * visita, escolha salva, preferência do sistema, escuro.
 */
export function preferredTheme(): Theme {
  if (chosen) return chosen;
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // ignora indisponibilidade de storage
  }
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

/**
 * Repõe `data-theme` quando ele sumiu do <html>, sem gravar nada: quem nunca
 * escolheu um tema continua seguindo o sistema.
 */
export function restoreTheme(): void {
  const root = document.documentElement;
  if (root.getAttribute("data-theme")) return;
  root.setAttribute("data-theme", preferredTheme());
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
