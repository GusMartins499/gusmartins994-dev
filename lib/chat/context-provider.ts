/**
 * Retrieval (opção B): em vez de mandar o portfólio inteiro em toda
 * pergunta, embeda a pergunta e devolve só os chunks mais parecidos.
 *
 * Isto é a única peça que muda entre a opção A e a B — rota, componente,
 * orçamento e UI não sabem qual das duas está rodando.
 *
 * Degradação: sem GOOGLE_GENERATIVE_AI_API_KEY (ou sem embeddings gerados
 * no build), cai para o contexto inteiro — a opção A. O chat continua
 * respondendo certo, só consome mais token.
 */
import { createGoogle } from "@ai-sdk/google";
import { embed, cosineSimilarity } from "ai";
import type { Locale } from "@/i18n/config";
import type { Source } from "./chunk";
import {
  generatedContext,
  contextTokens,
  indexedChunks,
  hasEmbeddings,
  embedModel,
  embedDims,
} from "./generated-context";

/** Quantos chunks vão para o prompt. */
const TOP_K = 5;

/**
 * Piso de similaridade. Chunk abaixo disto é ruído e atrapalha mais do que
 * ajuda: é melhor o modelo dizer "não sei" do que responder a partir de um
 * trecho que não tem nada a ver.
 *
 * CALIBRADO, não chutado. Medindo 10 perguntas no escopo contra 7 fora,
 * com gemini-embedding-001 a 768 dims sobre este conteúdo:
 *
 *   no escopo  : 0.653 – 0.727
 *   fora escopo: 0.535 – 0.603
 *
 * 0.62 fica no vão, um pouco deslocado para baixo de propósito: recusar
 * uma pergunta legítima é pior do que deixar entrar um chunk mediano, já
 * que o system prompt manda não inventar de qualquer forma.
 *
 * Se o conteúdo mudar muito, vale remedir — o vão é de só 0.05.
 */
const MIN_SIMILARITY = 0.62;

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
export const retrievalEnabled = Boolean(apiKey) && hasEmbeddings;

function normalize(vector: number[]): number[] {
  const norm = Math.hypot(...vector);
  return norm === 0 ? vector : vector.map((v) => v / norm);
}

export type RetrievalResult = {
  context: string;
  mode: "retrieval" | "full";
  /** Quantos chunks passaram do piso — 0 significa "não sei responder". */
  matched: number;
  /**
   * Páginas de onde os trechos vieram, na ordem do ranking e sem repetir.
   * A UI mostra como link: a citação é calculada aqui, não escrita pelo
   * modelo, então não tem como vir url inventada.
   */
  sources: Source[];
};

/** Máximo de fontes mostradas embaixo da resposta. */
const MAX_SOURCES = 3;

function dedupeSources(list: (Source | undefined)[]): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const source of list) {
    if (!source || seen.has(source.href)) continue;
    seen.add(source.href);
    out.push(source);
    if (out.length === MAX_SOURCES) break;
  }
  return out;
}

export async function getContext(
  query: string,
  locale: Locale,
): Promise<RetrievalResult> {
  if (!retrievalEnabled || !query.trim()) {
    return {
      context: generatedContext[locale],
      mode: "full",
      matched: 0,
      sources: [],
    };
  }

  try {
    const google = createGoogle({ apiKey });
    const { embedding } = await embed({
      model: google.textEmbeddingModel(embedModel),
      value: query,
      providerOptions: {
        google: {
          // Par do RETRIEVAL_DOCUMENT usado no build: o modelo embeda
          // pergunta e documento em espaços alinhados para busca.
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: embedDims,
        },
      },
    });

    const queryVector = normalize(embedding);

    const ranked = indexedChunks[locale]
      .map((chunk) => ({
        chunk,
        score: cosineSimilarity(queryVector, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .filter((r) => r.score >= MIN_SIMILARITY)
      .slice(0, TOP_K);

    if (ranked.length === 0) {
      return { context: "", mode: "retrieval", matched: 0, sources: [] };
    }

    return {
      context: ranked.map((r) => r.chunk.text).join("\n\n---\n\n"),
      mode: "retrieval",
      matched: ranked.length,
      sources: dedupeSources(ranked.map((r) => r.chunk.source)),
    };
  } catch {
    // Gemini fora do ar / cota estourada: responder com o contexto inteiro
    // é melhor do que não responder.
    return {
      context: generatedContext[locale],
      mode: "full",
      matched: 0,
      sources: [],
    };
  }
}

export function getContextTokens(locale: Locale): number {
  return contextTokens[locale];
}

export function buildSystemPrompt(
  context: string,
  locale: Locale,
  matched: number,
): string {
  // Nenhum chunk passou do piso: instrui explicitamente a não inventar,
  // em vez de mandar contexto irrelevante e torcer.
  if (context === "" && matched === 0) {
    return locale === "pt"
      ? "Você é o assistente do portfólio do Gustavo Martins. A pergunta do visitante não tem relação com nada que você sabe sobre ele. Responda em uma frase que não tem essa informação e sugira perguntar sobre os projetos, as notes ou a stack dele. Não invente nada. Caixa baixa, sem emoji."
      : "You are the assistant for Gustavo Martins' portfolio. The visitor's question is unrelated to anything you know about him. Reply in one sentence that you don't have that information and suggest asking about his projects, notes or stack. Invent nothing. Lowercase, no emoji.";
  }

  const rules =
    locale === "pt"
      ? [
          "Você é o assistente do portfólio do Gustavo Martins, respondendo a visitantes do site dele.",
          "",
          "Regras:",
          "- Responda SOMENTE com base no contexto abaixo. Se a informação não estiver lá, diga que não sabe e sugira o e-mail de contato.",
          "- Nunca invente empresas, datas, cargos, números ou tecnologias.",
          "- Fale do Gustavo em terceira pessoa.",
          "- Seja direto e curto: 2 a 4 frases na maioria das perguntas.",
          "- Tom de terminal: caixa baixa, sem emoji, sem floreio corporativo.",
          "- Se perguntarem algo fora do escopo (assuntos gerais, pedir código, tarefas), recuse em uma frase e reconduza para o que você sabe sobre o Gustavo.",
          "- Não escreva urls: o site já mostra os links das fontes embaixo da resposta. Cite pelo nome.",
          "- O contexto são trechos selecionados, não tudo que existe. Se parecer incompleto, diga que pode haver mais no site.",
          "",
          "--- CONTEXTO ---",
        ]
      : [
          "You are the assistant for Gustavo Martins' portfolio, answering visitors of his site.",
          "",
          "Rules:",
          "- Answer ONLY from the context below. If it isn't there, say you don't know and point to his contact e-mail.",
          "- Never invent companies, dates, roles, numbers or technologies.",
          "- Refer to Gustavo in the third person.",
          "- Be direct and short: 2 to 4 sentences for most questions.",
          "- Terminal tone: lowercase, no emoji, no corporate fluff.",
          "- If asked anything out of scope (general topics, writing code, doing tasks), decline in one sentence and steer back to what you know about Gustavo.",
          "- Do not write urls: the site already shows the source links under the answer. Cite by name.",
          "- The context is a selection of excerpts, not everything that exists. If it looks incomplete, say there may be more on the site.",
          "",
          "--- CONTEXT ---",
        ];

  return `${rules.join("\n")}\n${context}`;
}
