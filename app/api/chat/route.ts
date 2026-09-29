import { createGroq } from "@ai-sdk/groq";
import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  simulateReadableStream,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { isLocale, defaultLocale, type Locale } from "@/i18n/config";
import {
  getContext,
  buildSystemPrompt,
  isOutOfScope,
  outOfScopeReply,
} from "@/lib/chat/context-provider";
import type { Source } from "@/lib/chat/chunk";
import { checkBudget, recordUsage, LIMITS } from "@/lib/chat/budget";

// Sem `export const runtime`: o Edge Runtime está deprecado no Next 16 e
// nodejs já é o default.
export const maxDuration = 30;

const MODEL = "openai/gpt-oss-120b";
const hasKey = Boolean(process.env.GROQ_API_KEY);

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anon";
}

/**
 * O corpo da requisição é do cliente inteiro: nada impede alguém de POSTar
 * `messages` à mão com uma mensagem de role `system` dizendo "ignore as
 * regras". Só `user` e `assistant` sobrevivem — as instruções vêm do
 * servidor, e é o único jeito de isso continuar verdade.
 */
function sanitize(messages: UIMessage[]): UIMessage[] {
  return messages.filter(
    (m) =>
      (m?.role === "user" || m?.role === "assistant") && Array.isArray(m.parts),
  );
}

function textOf(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ");
}

/**
 * Injeta as fontes no stream logo DEPOIS do chunk `start`.
 *
 * O ponto de inserção não é detalhe: escrita antes do `start` chega ao
 * cliente sem nenhuma mensagem aberta para receber a parte, e é
 * silenciosamente descartada. Logo após o `start` é o primeiro instante
 * válido — os links ficam prontos antes do primeiro token do texto.
 */
function withSources(
  stream: ReadableStream<UIMessageChunk>,
  sources: Source[],
): ReadableStream<UIMessageChunk> {
  if (sources.length === 0) return stream;
  let injected = false;

  return stream.pipeThrough(
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        if (!injected && chunk.type === "start") {
          injected = true;
          controller.enqueue({ type: "data-sources", data: sources });
        }
      },
    }),
  );
}

function refuse(reason: string, retryAfter: number) {
  return Response.json(
    { error: reason, retryAfter },
    { status: 429, headers: { "retry-after": String(retryAfter) } },
  );
}

export async function POST(req: Request) {
  let body: { messages?: UIMessage[]; locale?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? sanitize(body.messages) : [];
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const locale: Locale =
    body.locale && isLocale(body.locale) ? body.locale : defaultLocale;

  const question = textOf(messages[messages.length - 1]);
  if (question.length > LIMITS.maxQuestionChars) {
    return Response.json({ error: "too_long" }, { status: 413 });
  }

  // Janela de histórico: sem isso, uma conversa longa cresce sem teto e uma
  // pessoa sozinha consome a cota do dia.
  const windowed = messages.slice(-(LIMITS.historyWindow * 2 + 1));

  const retrieval = await getContext(question, locale);
  const { context, sources } = retrieval;
  const system = buildSystemPrompt(context, locale);

  const estimated =
    Math.ceil((system.length + JSON.stringify(windowed).length) / 4) +
    LIMITS.maxOutputTokens;

  const verdict = await checkBudget(clientIp(req), estimated);
  if (!verdict.ok) return refuse(verdict.reason, verdict.retryAfter);

  // Fora do escopo: a recusa é constante e sai daqui mesmo. Depois do
  // checkBudget de propósito — a pergunta ainda conta para o limite por IP,
  // senão sobra um endpoint livre para floodar. Nenhum token é gasto, então
  // não há `recordUsage`.
  if (isOutOfScope(retrieval)) {
    return createUIMessageStreamResponse({
      stream: textStream(outOfScopeReply[locale]),
    });
  }

  // ── Modo mock: sem GROQ_API_KEY o chat responde com stream simulado,
  //    para dar para testar a UX inteira sem criar conta em lugar nenhum.
  if (!hasKey) {
    return createUIMessageStreamResponse({
      stream: withSources(mockStream(question, locale), sources),
    });
  }

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

  const result = streamText({
    model: groq(MODEL),
    system,
    messages: await convertToModelMessages(windowed),
    maxOutputTokens: LIMITS.maxOutputTokens,
    temperature: 0.3,
    providerOptions: {
      groq: {
        // O gpt-oss emite raciocínio antes da resposta, e esses tokens
        // saem do mesmo orçamento de maxOutputTokens — nos testes davam
        // ~100 dos 400, com risco de cortar a resposta no meio. Para
        // "quais tecnologias ele usa?" não há o que raciocinar: o custo
        // é real e o ganho, nenhum.
        //
        // "low", não "none": o tipo do @ai-sdk/groq aceita "none", mas a
        // api do Groq rejeita com 400 para o gpt-oss — só admite low,
        // medium ou high.
        reasoningEffort: "low",
      },
    },
    onFinish({ usage }) {
      // Consumo REAL, não a estimativa.
      void recordUsage(usage?.totalTokens ?? estimated);
    },
  });

  // As fontes saem do retrieval, não do modelo — é o que garante que o
  // link citado existe de verdade.
  return createUIMessageStreamResponse({
    stream: withSources(
      toUIMessageStream({ stream: result.stream }),
      sources,
    ),
  });
}

// ── Stream simulado (modo mock) ──────────────────────────────────────────
function mockStream(question: string, locale: Locale) {
  const reply =
    locale === "pt"
      ? `modo mock ativo — sem GROQ_API_KEY configurada.\n\nvocê perguntou: "${question}"\n\ncom a chave configurada, aqui viria a resposta real do gpt-oss-120b, montada a partir do conteúdo do portfólio (notes, projetos, stack). a ux é exatamente esta: streaming token a token, cursor piscando, spinner e cancelamento por esc.`
      : `mock mode on — no GROQ_API_KEY configured.\n\nyou asked: "${question}"\n\nwith the key set, the real gpt-oss-120b answer would stream here, built from the portfolio content (notes, projects, stack). the ux is exactly this: token-by-token streaming, blinking cursor, spinner and esc to cancel.`;

  // 450ms: o mock finge a latência de uma chamada real ao modelo.
  return textStream(reply, 450);
}

/**
 * Stream de um texto que o servidor já conhece, palavra a palavra.
 *
 * Mesma forma de onda de uma resposta do modelo — a UI (cursor, spinner,
 * esc para cancelar) não precisa saber que ninguém foi chamado.
 */
function textStream(text: string, initialDelayInMs = 250) {
  const id = `local-${Date.now()}`;
  const words = text.split(/(\s+)/);

  return simulateReadableStream({
    initialDelayInMs,
    chunkDelayInMs: 18,
    chunks: [
      { type: "start" as const },
      { type: "text-start" as const, id },
      ...words.map((w) => ({
        type: "text-delta" as const,
        id,
        delta: w,
      })),
      { type: "text-end" as const, id },
      { type: "finish" as const },
    ],
  });
}
