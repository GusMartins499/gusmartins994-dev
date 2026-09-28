"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Boot } from "./boot";
import { Spinner } from "./spinner";
import { Countdown } from "./countdown";
import {
  commandList,
  hrefFor,
  matchCommands,
  type CommandName,
} from "./commands";

type SystemLine = { id: string; kind: "system" | "error"; text: string };

function textOf(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function Terminal({
  locale,
  dict,
  mock,
}: {
  locale: Locale;
  dict: Dictionary;
  mock: boolean;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [systemLines, setSystemLines] = useState<SystemLine[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  // "colado no fim": enquanto true, cada token novo rola o log. Vira false
  // assim que o visitante rola para cima para reler algo.
  const [stuck, setStuck] = useState(true);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { locale },
      }),
    [locale],
  );

  const { messages, sendMessage, status, stop, error, setMessages, clearError } =
    useChat({ transport });

  const busy = status === "submitted" || status === "streaming";

  // Rola para o fim a cada token novo — mexendo em scrollTop do próprio
  // log, não em scrollIntoView: scrollIntoView rola TODOS os ancestrais
  // scrolláveis, o que arrastava a página inteira junto.
  useEffect(() => {
    if (!stuck) return;
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [messages, systemLines, busy, stuck]);

  // Soltar/recolar conforme o visitante rola o log.
  function onLogScroll() {
    const log = logRef.current;
    if (!log) return;
    const distanceFromBottom =
      log.scrollHeight - log.scrollTop - log.clientHeight;
    setStuck(distanceFromBottom < 32);
  }

  const jumpToEnd = useCallback(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
    setStuck(true);
  }, []);

  const pushSystem = useCallback((text: string, kind: SystemLine["kind"] = "system") => {
    setSystemLines((lines) => [
      ...lines,
      { id: `${Date.now()}-${Math.random()}`, kind, text },
    ]);
  }, []);

  // ── Slash commands ─────────────────────────────────────────────────────
  const runCommand = useCallback(
    (raw: string): boolean => {
      if (!raw.startsWith("/")) return false;
      const name = raw.slice(1).trim().toLowerCase() as CommandName;

      switch (name) {
        case "help":
          pushSystem(
            [
              dict.chat.commands.header,
              ...commandList(dict).map(
                (c) => `  /${c.name.padEnd(9)} ${c.description}`,
              ),
            ].join("\n"),
          );
          return true;
        case "clear":
          setMessages([]);
          setSystemLines([]);
          return true;
        case "theme": {
          const root = document.documentElement;
          const next =
            root.getAttribute("data-theme") === "light" ? "dark" : "light";
          root.setAttribute("data-theme", next);
          try {
            localStorage.setItem("theme", next);
          } catch {
            // modo privado / storage bloqueado: o tema só não persiste
          }
          return true;
        }
        case "lang":
          router.push(locale === "pt" ? "/en/chat" : "/pt/chat");
          return true;
        case "projects":
        case "notes":
        case "cv": {
          const href = hrefFor(name, locale);
          if (href) router.push(href);
          return true;
        }
        default:
          pushSystem(`${dict.chat.commands.unknown} ${raw}`, "error");
          return true;
      }
    },
    [dict, locale, pushSystem, router, setMessages],
  );

  const submit = useCallback(
    (value: string) => {
      const text = value.trim();
      if (!text || busy) return;

      setHistory((h) => [...h, text]);
      setHistoryIndex(null);
      setInput("");
      clearError();

      if (runCommand(text)) return;
      void sendMessage({ text });
    },
    [busy, clearError, runCommand, sendMessage],
  );

  // ── Teclado: histórico com ↑/↓, esc cancela ou limpa ───────────────────
  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (busy) {
        void stop();
      } else {
        setInput("");
      }
      return;
    }
    if (event.key === "ArrowUp" && history.length > 0) {
      event.preventDefault();
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setInput(history[next]);
      return;
    }
    if (event.key === "ArrowDown" && historyIndex !== null) {
      event.preventDefault();
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(null);
        setInput("");
      } else {
        setHistoryIndex(next);
        setInput(history[next]);
      }
      return;
    }
    if (event.key === "Tab") {
      const matches = matchCommands(input);
      if (matches.length === 1) {
        event.preventDefault();
        setInput(`/${matches[0]}`);
      }
    }
  }

  // Digitar em qualquer lugar da página foca o input, como num terminal.
  useEffect(() => {
    function onWindowKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key.length === 1 || event.key === "Backspace") {
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onWindowKey);
    return () => window.removeEventListener("keydown", onWindowKey);
  }, []);

  const suggestions = matchCommands(input);
  const parsed = parseError(error, dict);

  // A pergunta que falhou fica pendurada em `messages` sem resposta, o que
  // parece travamento. Marca ela como não enviada.
  const lastMessage = messages[messages.length - 1];
  const failedId =
    parsed && lastMessage?.role === "user" ? lastMessage.id : null;

  return (
    <div className="rounded-box border border-base-300 bg-base-200/60 backdrop-blur-[1px]">
      {/* barra de título estilo janela de terminal */}
      <div className="flex items-center gap-2 border-b border-base-300 px-4 py-2">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-primary/70" />
          <span className="size-2.5 rounded-full bg-secondary/70" />
          <span className="size-2.5 rounded-full bg-base-300" />
        </span>
        <span className="ml-1 truncate text-xs text-faint">
          {dict.chat.bootCwd} — {dict.chat.title}
        </span>
      </div>

      {/* altura FIXA: o terminal nunca cresce, então a página nunca reflui
          enquanto a conversa anda — o scroll acontece só aqui dentro. */}
      <div className="relative">
      <div
        ref={logRef}
        onScroll={onLogScroll}
        className="h-[min(60vh,32rem)] overflow-y-auto overscroll-contain px-4 py-4"
      >
        <Boot dict={dict} mock={mock} />

        <div
          className="mt-4 space-y-4"
          aria-live="polite"
          aria-label={dict.chat.logLabel}
        >
          {messages.map((message) => {
            const body = textOf(message);
            const isUser = message.role === "user";
            const isLast = message.id === messages[messages.length - 1]?.id;
            const failed = message.id === failedId;
            return (
              <div key={message.id} className="text-sm leading-relaxed">
                <span
                  aria-hidden="true"
                  className={
                    failed ? "text-error" : isUser ? "text-muted" : "text-primary"
                  }
                >
                  {failed ? "✗ " : isUser ? "~ " : "> "}
                </span>
                <span className="sr-only">
                  {isUser ? `${dict.chat.you}: ` : `${dict.chat.assistant}: `}
                </span>
                <span
                  className={`whitespace-pre-wrap ${
                    failed ? "text-faint line-through" : "text-base-content"
                  } ${!isUser && isLast && status === "streaming" ? "stream-cursor" : ""}`}
                >
                  {body}
                </span>
                {failed && (
                  <span className="ml-2 text-xs text-faint">
                    ({dict.chat.errors.notSent})
                  </span>
                )}
              </div>
            );
          })}

          {systemLines.map((line) => (
            <pre
              key={line.id}
              className={`whitespace-pre-wrap text-sm ${
                line.kind === "error" ? "text-error" : "text-secondary"
              }`}
            >
              {line.text}
            </pre>
          ))}

          {status === "submitted" && (
            <Spinner
              verbs={dict.chat.thinking}
              hint={dict.chat.escToCancel}
              srLabel={dict.chat.thinkingSr}
            />
          )}

          {parsed && (
            <div className="space-y-1 text-sm">
              <p className="text-error">{parsed.text}</p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {parsed.retryAfter !== null && (
                  <Countdown
                    key={parsed.retryAfter}
                    seconds={parsed.retryAfter}
                    label={dict.chat.errors.retryIn}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    const last = history[history.length - 1];
                    if (last) submit(last);
                  }}
                  className="text-faint underline underline-offset-4 hover:text-primary"
                >
                  {dict.chat.errors.retry}
                </button>
              </p>
            </div>
          )}
        </div>

        {/* sugestões iniciais — só antes da primeira pergunta */}
        {messages.length === 0 && systemLines.length === 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {dict.chat.suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => submit(s)}
                  className="rounded-field border border-base-300 bg-base-100 px-2.5 py-1 text-xs text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}

      </div>

        {/* aparece só quando o visitante soltou o fim para reler algo */}
        {!stuck && (
          <button
            type="button"
            onClick={jumpToEnd}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-field border border-base-300 bg-base-100 px-2.5 py-1 text-xs text-muted shadow-sm hover:border-primary hover:text-primary"
          >
            <span aria-hidden="true">↓ </span>
            {dict.chat.jumpToEnd}
          </button>
        )}
      </div>

      {/* autocompletar de comandos */}
      {suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-2 border-t border-base-300 px-4 py-2">
          {suggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => {
                  setInput(`/${name}`);
                  inputRef.current?.focus();
                }}
                className="text-xs text-faint hover:text-primary"
              >
                /{name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-base-300 px-4 py-3"
      >
        <span aria-hidden="true" className="text-primary">
          ~
        </span>
        <label htmlFor="chat-input" className="sr-only">
          {dict.chat.inputLabel}
        </label>
        <input
          id="chat-input"
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={dict.chat.placeholder}
          autoComplete="off"
          spellCheck={false}
          maxLength={500}
          className="min-w-0 flex-1 bg-transparent text-sm text-base-content outline-none placeholder:text-faint"
        />
        {busy ? (
          <button
            type="button"
            onClick={() => void stop()}
            className="shrink-0 text-xs text-faint hover:text-primary"
          >
            {dict.chat.stop}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 text-xs text-faint hover:text-primary disabled:opacity-40 disabled:hover:text-faint"
          >
            {dict.chat.send}
          </button>
        )}
      </form>

      <p className="border-t border-base-300 px-4 py-2 text-xs text-faint">
        {dict.chat.disclaimer}
      </p>
    </div>
  );
}

type ParsedError = { text: string; retryAfter: number | null };

/**
 * Lê o corpo json do 429/413 que a rota devolve ({error, retryAfter}).
 *
 * Antes isto casava substring no texto do erro, o que era frágil: "ip"
 * aparece dentro de outras palavras. Agora extrai o json de verdade e só
 * cai no genérico se não achar.
 */
function parseError(
  error: Error | undefined,
  dict: Dictionary,
): ParsedError | null {
  if (!error) return null;
  const raw = error.message ?? "";
  const match = raw.match(/\{[\s\S]*\}/);

  if (match) {
    try {
      const body = JSON.parse(match[0]) as {
        error?: string;
        retryAfter?: number;
      };
      const key = body.error;
      if (key === "day" || key === "minute" || key === "ip" || key === "too_long") {
        return {
          text: dict.chat.errors[key],
          retryAfter: typeof body.retryAfter === "number" ? body.retryAfter : null,
        };
      }
    } catch {
      // corpo não era json — cai no genérico
    }
  }
  return { text: dict.chat.errors.generic, retryAfter: null };
}
