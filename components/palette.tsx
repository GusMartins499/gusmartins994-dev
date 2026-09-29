"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { MASCOT_INLINE } from "@/lib/chat/ascii";
import { site, socials } from "@/lib/site";
import { currentTheme, subscribeTheme, toggleTheme } from "@/lib/theme";
import { rememberLocale, withLocale } from "@/lib/locale";

/**
 * Paleta de comandos global: ⌘K / ctrl+K (ou `/`) em qualquer página.
 *
 * Não é um segundo chat. Ela navega, executa ações locais (tema, idioma,
 * copiar e-mail) e, para qualquer texto livre, entrega a pergunta ao /chat
 * via `?q=` — assim continua existindo uma só implementação de conversa,
 * sem duplicar estado, histórico nem orçamento.
 */

type Item = {
  id: string;
  group: "go" | "actions" | "ask";
  glyph: string;
  label: string;
  hint?: string;
  /** Termos extras de busca (ex.: o nome em inglês da rota). */
  keywords?: string;
  run: () => void;
};

/** Busca tolerante: ignora caixa e acentos. */
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function Palette({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  /** Onde o dedo/ponteiro encostou: separa toque de arrasto (scroll). */
  const pressRef = useRef<{ x: number; y: number } | null>(null);

  const p = dict.palette;

  // O tema vive no DOM (`data-theme`), fora do React. Observar o atributo
  // mantém a dica do item "alternar tema" correta mesmo quando quem trocou
  // foi o botão do header — e evita ler `document` durante o SSR.
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => currentTheme(),
    () => "dark" as const,
  );

  // Na própria página do chat a paleta não faz sentido — o terminal já
  // captura o teclado.
  const onChatPage = pathname?.endsWith("/chat") ?? false;

  function close() {
    setOpen(false);
    setQuery("");
    setPicked(null);
    setFlash(null);
  }

  function ask(question: string) {
    const text = question.trim();
    close();
    router.push(
      text ? `/${locale}/chat?q=${encodeURIComponent(text)}` : `/${locale}/chat`,
    );
  }

  function go(href: string) {
    close();
    router.push(href);
  }

  function openExternal(href: string) {
    close();
    window.open(href, "_blank", "noopener,noreferrer");
  }

  const other: Locale = locales.find((l) => l !== locale) ?? locale;

  const items: Item[] = useMemo(() => {
    const external = socials.filter((s) => s.href.startsWith("http"));

    return [
      {
        id: "go-home",
        group: "go",
        glyph: "~",
        label: p.go.home,
        hint: `/${locale}`,
        keywords: "home inicio start",
        run: () => go(`/${locale}`),
      },
      {
        id: "go-projects",
        group: "go",
        glyph: "›",
        label: p.go.projects,
        hint: `/${locale}/projects`,
        keywords: "projects projetos repos github",
        run: () => go(`/${locale}/projects`),
      },
      {
        id: "go-notes",
        group: "go",
        glyph: "›",
        label: p.go.notes,
        hint: `/${locale}/notes`,
        keywords: "notes blog posts artigos",
        run: () => go(`/${locale}/notes`),
      },
      {
        id: "go-chat",
        group: "go",
        glyph: "›",
        label: p.go.chat,
        hint: `/${locale}/chat`,
        keywords: "chat terminal ia ai",
        run: () => go(`/${locale}/chat`),
      },
      {
        id: "go-cv",
        group: "go",
        glyph: "↗",
        label: p.go.resume,
        hint: p.newTab,
        keywords: "cv curriculo resume pdf",
        run: () => openExternal(`/cv/${locale}`),
      },
      {
        id: "act-theme",
        group: "actions",
        glyph: "◐",
        label: p.actions.theme,
        hint:
          theme === "dark"
            ? p.actions.themeHint.toLight
            : p.actions.themeHint.toDark,
        keywords: "theme tema dark light claro escuro",
        run: () => {
          toggleTheme();
          close();
        },
      },
      {
        id: "act-lang",
        group: "actions",
        glyph: "⇄",
        label: p.actions.lang,
        hint: `${locale} → ${other}`,
        keywords: "lang idioma language pt en",
        run: () => {
          rememberLocale(other);
          go(withLocale(pathname ?? `/${locale}`, other));
        },
      },
      {
        id: "act-email",
        group: "actions",
        glyph: "@",
        label: p.actions.copyEmail,
        hint: flash === "act-email" ? p.actions.copied : site.email,
        keywords: `email e-mail contato contact ${site.email}`,
        run: () => {
          navigator.clipboard
            ?.writeText(site.email)
            .then(() => setFlash("act-email"))
            .catch(() => {
              // sem clipboard (http, permissão negada): abre o cliente de e-mail
              window.location.href = `mailto:${site.email}`;
            });
        },
      },
      ...external.map<Item>((social) => ({
        id: `act-${social.label.toLowerCase()}`,
        group: "actions",
        glyph: "↗",
        label: social.label.toLowerCase(),
        hint: p.newTab,
        keywords: social.href,
        run: () => openExternal(social.href),
      })),
      ...dict.chat.suggestions.map<Item>((suggestion, i) => ({
        id: `ask-${i}`,
        group: "ask",
        glyph: "›",
        label: suggestion,
        run: () => ask(suggestion),
      })),
    ];
    // `flash` entra para que a dica "copiado ✓" reapareça na lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, other, pathname, p, dict.chat.suggestions, flash, theme]);

  const term = normalize(query.trim());
  const filtered = useMemo(
    () =>
      term
        ? items.filter((item) =>
            normalize(`${item.label} ${item.keywords ?? ""}`).includes(term),
          )
        : items,
    [items, term],
  );

  // Texto livre sempre tem saída: vira pergunta pro chat. Se a pessoa
  // escreveu mais de uma palavra é quase certo que é pergunta, não comando —
  // então a opção sobe para o topo e já fica selecionada.
  const askItem: Item | null = query.trim()
    ? {
        id: "ask-free",
        group: "ask",
        glyph: MASCOT_INLINE,
        label: `${p.askWith}: ${query.trim()}`,
        hint: "enter",
        run: () => ask(query),
      }
    : null;

  const looksLikeQuestion = query.trim().includes(" ");
  const visible: Item[] = askItem
    ? looksLikeQuestion || filtered.length === 0
      ? [askItem, ...filtered]
      : [...filtered, askItem]
    : filtered;

  // Seleção derivada: se o item escolhido sumiu da filtragem, cai no
  // primeiro. Evita sincronizar índice com effect a cada tecla.
  const activeId =
    visible.find((item) => item.id === picked)?.id ?? visible[0]?.id ?? null;
  const activeIndex = visible.findIndex((item) => item.id === activeId);

  useEffect(() => {
    if (onChatPage) return;
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // "/" abre a paleta — atalho de terminal, só quando não se está digitando
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChatPage]);

  // No celular a paleta é o menu: focar o campo sobe o teclado e engole a
  // lista antes da pessoa ler os comandos. Só damos foco automático onde há
  // ponteiro fino (mouse/trackpad); no toque o teclado sobe quando ela
  // realmente tocar no campo.
  useEffect(() => {
    if (!open) return;
    const fine =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: fine)").matches;
    if (fine) inputRef.current?.focus();
  }, [open]);

  // Trava o scroll do fundo enquanto a paleta está aberta.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // O teclado virtual encolhe a viewport visual sem mexer em `vh`/`dvh`:
  // sem isso o diálogo continua dimensionado para a tela inteira e metade
  // dele fica atrás do teclado. Espelhamos a viewport visual em variáveis
  // CSS e a paleta se dimensiona por elas.
  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const apply = () => {
      root.style.setProperty("--palette-vh", `${viewport.height}px`);
      root.style.setProperty("--palette-top", `${viewport.offsetTop}px`);
    };
    apply();
    viewport.addEventListener("resize", apply);
    viewport.addEventListener("scroll", apply);
    return () => {
      viewport.removeEventListener("resize", apply);
      viewport.removeEventListener("scroll", apply);
      root.style.removeProperty("--palette-vh");
      root.style.removeProperty("--palette-top");
    };
  }, [open]);

  // Prende o foco no diálogo enquanto ele está aberto.
  useEffect(() => {
    if (!open) return;
    function onFocusIn(event: FocusEvent) {
      if (!dialogRef.current?.contains(event.target as Node)) {
        inputRef.current?.focus();
      }
    }
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [open]);

  // Mantém a linha selecionada visível ao navegar com as setas.
  useEffect(() => {
    if (!open || !activeId) return;
    document
      .getElementById(`palette-${activeId}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeId]);

  function move(delta: number) {
    if (visible.length === 0) return;
    const next = (activeIndex + delta + visible.length) % visible.length;
    setPicked(visible[next].id);
  }

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = visible[activeIndex];
      if (item) item.run();
      else if (query.trim()) ask(query);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  if (onChatPage) return null;

  // Cabeçalhos de grupo: só antes do primeiro item de cada grupo.
  const groupLabel: Record<Item["group"], string> = {
    go: p.groups.go,
    actions: p.groups.actions,
    ask: p.groups.ask,
  };

  return (
    <>
      {/* No mobile a paleta é o menu: os links do header não cabem em 375px
          e ela já tem todas as rotas, idioma e tema. No desktop não há
          gatilho visível — o atalho (⌘K / ctrl+K / `/`) basta, e o header
          fica limpo. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={p.open}
        title={p.open}
        className="btn btn-ghost btn-sm btn-square text-primary sm:hidden"
      >
        <span aria-hidden="true" className="text-sm">
          {MASCOT_INLINE}
        </span>
      </button>

      {open && (
        <div
          className="palette-overlay z-50 flex items-start justify-center bg-base-100/70 px-3 pt-4 pb-3 backdrop-blur-sm sm:px-4 sm:pt-[12vh]"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={p.title}
            className="palette-panel flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-box border border-base-300 bg-base-200 shadow-2xl"
          >
            {/* chrome de janela de terminal */}
            <div className="flex items-center gap-2 border-b border-base-300 bg-base-300/30 px-3 py-1.5 text-xs text-faint">
              <span aria-hidden="true" className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-primary/70" />
                <span className="h-2 w-2 rounded-full bg-secondary/70" />
                <span className="h-2 w-2 rounded-full bg-base-content/25" />
              </span>
              <span className="mx-auto truncate">{p.chrome}</span>
              <kbd className="shrink-0 rounded-field border border-base-300 px-1.5 py-0.5 text-[0.65rem]">
                esc
              </kbd>
            </div>

            {/* linha de prompt */}
            <div className="flex items-center gap-2.5 border-b border-base-300 px-4 py-4">
              <span aria-hidden="true" className="text-primary">
                ~
              </span>
              <label htmlFor="palette-input" className="sr-only">
                {p.title}
              </label>
              <input
                id="palette-input"
                ref={inputRef}
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={
                  activeId ? `palette-${activeId}` : undefined
                }
                aria-autocomplete="list"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKey}
                placeholder={p.placeholder}
                autoComplete="off"
                spellCheck={false}
                maxLength={500}
                className="min-w-0 flex-1 bg-transparent text-base text-base-content outline-none placeholder:text-faint"
              />
            </div>

            {/* resultados */}
            <ul
              id="palette-list"
              role="listbox"
              aria-label={p.title}
              className="min-h-[6rem] flex-1 overflow-y-auto overscroll-contain p-2 sm:min-h-[9rem]"
            >
              {visible.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-faint">
                  {p.empty}
                </li>
              )}
              {visible.map((item, i) => {
                const active = item.id === activeId;
                const newGroup = i === 0 || visible[i - 1].group !== item.group;
                return (
                  <li key={item.id}>
                    {newGroup && (
                      <p
                        aria-hidden="true"
                        className="px-3 pt-3 pb-1 text-[0.7rem] text-faint first:pt-1"
                      >
                        <span className="text-primary/70">## </span>
                        {groupLabel[item.group]}
                      </p>
                    )}
                    <div
                      id={`palette-${item.id}`}
                      role="option"
                      aria-selected={active}
                      onPointerDown={(event) => {
                        pressRef.current = {
                          x: event.clientX,
                          y: event.clientY,
                        };
                      }}
                      onClick={(event) => {
                        // Rolar a lista com o dedo termina em `click` no item
                        // sob ele. Só executa se o ponteiro praticamente não
                        // andou entre o toque e o solte.
                        const from = pressRef.current;
                        pressRef.current = null;
                        if (
                          from &&
                          Math.hypot(
                            event.clientX - from.x,
                            event.clientY - from.y,
                          ) > 10
                        ) {
                          return;
                        }
                        item.run();
                      }}
                      onMouseMove={() => setPicked(item.id)}
                      className={[
                        "flex cursor-pointer items-center gap-3 rounded-field border-l-2 px-3 py-3 text-sm transition-colors sm:py-2.5",
                        active
                          ? "border-primary bg-base-100 text-base-content"
                          : "border-transparent text-muted",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-4 shrink-0 text-center ${active ? "text-primary" : "text-faint"}`}
                      >
                        {item.glyph}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className="hidden shrink-0 text-xs text-faint sm:inline">
                          {item.hint}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* legenda de teclado */}
            <div className="hidden items-center gap-4 border-t border-base-300 px-4 py-2.5 text-[0.7rem] text-faint sm:flex">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-field border border-base-300 px-1">
                  ↑↓
                </kbd>
                {p.keys.nav}
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-field border border-base-300 px-1">
                  ↵
                </kbd>
                {p.keys.run}
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <kbd className="rounded-field border border-base-300 px-1">
                  esc
                </kbd>
                {p.keys.close}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
