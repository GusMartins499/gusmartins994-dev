"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { MASCOT_INLINE } from "@/lib/chat/ascii";

/**
 * Atalho global para o chat: ⌘K no mac, Ctrl+K no resto.
 *
 * Não é um segundo chat — é um campo que captura a primeira pergunta e
 * navega para /chat já com ela, via ?q=. Assim existe uma só implementação
 * de conversa, e o atalho não duplica estado, histórico nem orçamento.
 */
export function Launcher({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // `navigator` só existe no cliente. useSyncExternalStore é o jeito certo
  // de ler estado de fora do React sem effect (proibido pelo
  // react-hooks/set-state-in-effect) e sem quebrar a hidratação: o servidor
  // renderiza "ctrl" e o cliente corrige para "⌘" no mac.
  const isMac = useSyncExternalStore(
    () => () => {},
    () => /mac/i.test(navigator.platform || navigator.userAgent),
    () => false,
  );

  // Na própria página do chat o atalho não faz sentido — o terminal já
  // captura o teclado.
  const onChatPage = pathname?.endsWith("/chat") ?? false;

  useEffect(() => {
    if (onChatPage) return;
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChatPage]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
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

  function submit(question: string) {
    const text = question.trim();
    setOpen(false);
    setValue("");
    router.push(
      text
        ? `/${locale}/chat?q=${encodeURIComponent(text)}`
        : `/${locale}/chat`,
    );
  }

  if (onChatPage) return null;

  return (
    <>
      {/* dica discreta, só em telas grandes */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-1.5 rounded-field border border-base-300 px-2 py-1 text-xs text-faint hover:border-primary hover:text-primary lg:inline-flex"
        aria-label={dict.chat.launcher.open}
      >
        <span aria-hidden="true" className="text-primary">
          {MASCOT_INLINE}
        </span>
        <kbd className="font-sans">{isMac ? "⌘" : "ctrl"}</kbd>
        <kbd className="font-sans">K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-base-100/80 px-4 pt-[18vh] backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={dict.chat.launcher.title}
            className="w-full max-w-lg overflow-hidden rounded-box border border-base-300 bg-base-200 shadow-xl"
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit(value);
              }}
              className="flex items-center gap-2 border-b border-base-300 px-4 py-3"
            >
              <span aria-hidden="true" className="text-primary">
                ~
              </span>
              <label htmlFor="launcher-input" className="sr-only">
                {dict.chat.launcher.title}
              </label>
              <input
                id="launcher-input"
                ref={inputRef}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={dict.chat.placeholder}
                autoComplete="off"
                spellCheck={false}
                maxLength={500}
                className="min-w-0 flex-1 bg-transparent text-sm text-base-content outline-none placeholder:text-faint"
              />
              <kbd className="shrink-0 rounded-field border border-base-300 px-1.5 py-0.5 text-[0.65rem] text-faint">
                esc
              </kbd>
            </form>

            <ul className="p-2">
              {dict.chat.suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => submit(suggestion)}
                    className="w-full rounded-field px-2 py-1.5 text-left text-sm text-muted hover:bg-base-100 hover:text-primary"
                  >
                    <span aria-hidden="true" className="text-faint">
                      ›{" "}
                    </span>
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>

            <p className="border-t border-base-300 px-4 py-2 text-xs text-faint">
              {dict.chat.launcher.hint}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
