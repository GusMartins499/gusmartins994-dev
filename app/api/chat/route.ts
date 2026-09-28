import { createGroq } from "@ai-sdk/groq";
import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  simulateReadableStream,
  type UIMessage,
} from "ai";
import { isLocale, defaultLocale, type Locale } from "@/i18n/config";
import { getContext, buildSystemPrompt } from "@/lib/chat/context-provider";
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

function textOf(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ");
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

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
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

  const { context, matched } = await getContext(question, locale);
  const system = buildSystemPrompt(context, locale, matched);

  const estimated =
    Math.ceil((system.length + JSON.stringify(windowed).length) / 4) +
    LIMITS.maxOutputTokens;

  const verdict = await checkBudget(clientIp(req), estimated);
  if (!verdict.ok) return refuse(verdict.reason, verdict.retryAfter);

  // ── Modo mock: sem GROQ_API_KEY o chat responde com stream simulado,
  //    para dar para testar a UX inteira sem criar conta em lugar nenhum.
  if (!hasKey) {
    return createUIMessageStreamResponse({
      stream: mockStream(question, locale),
    });
  }

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

  const result = streamText({
    model: groq(MODEL),
    system,
    messages: await convertToModelMessages(windowed),
    maxOutputTokens: LIMITS.maxOutputTokens,
    temperature: 0.3,
    onFinish({ usage }) {
      // Consumo REAL, não a estimativa.
      void recordUsage(usage?.totalTokens ?? estimated);
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}

// ── Stream simulado (modo mock) ──────────────────────────────────────────
function mockStream(question: string, locale: Locale) {
  const reply =
    locale === "pt"
      ? `modo mock ativo — sem GROQ_API_KEY configurada.\n\nvocê perguntou: "${question}"\n\ncom a chave configurada, aqui viria a resposta real do gpt-oss-120b, montada a partir do conteúdo do portfólio (notes, projetos, stack). a ux é exatamente esta: streaming token a token, cursor piscando, spinner e cancelamento por esc.`
      : `mock mode on — no GROQ_API_KEY configured.\n\nyou asked: "${question}"\n\nwith the key set, the real gpt-oss-120b answer would stream here, built from the portfolio content (notes, projects, stack). the ux is exactly this: token-by-token streaming, blinking cursor, spinner and esc to cancel.`;

  const id = `mock-${Date.now()}`;
  const words = reply.split(/(\s+)/);

  return simulateReadableStream({
    initialDelayInMs: 450,
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
