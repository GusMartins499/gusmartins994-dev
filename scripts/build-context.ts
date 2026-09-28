/**
 * Gera lib/chat/generated-context.ts a partir do conteúdo do repositório.
 *
 * Roda no prebuild/predev. Motivos de existir (em vez de ler `content/` na
 * rota, em runtime):
 *
 *  1. O output file tracing da Vercel não enxerga o readdirSync de
 *     lib/notes.ts — funcionaria em dev e quebraria em produção.
 *  2. Zero I/O de disco por requisição.
 *  3. O contexto fica auditável: dá para ver no diff o que a IA sabe.
 *  4. Imprime a contagem de tokens, que é a cota que realmente limita o
 *     free tier do Groq (200k tokens/dia).
 *
 * Gera TAMBÉM os embeddings dos chunks (opção B). Os embeddings dos
 * documentos são caros de calcular e imutáveis entre deploys, então nascem
 * aqui, no build, e não em runtime. Em runtime só a pergunta é embedada.
 */
import fs from "node:fs";
import path from "node:path";
import { getAllNotes, getNote } from "../lib/notes";
import { site, stack } from "../lib/site";
import { projects } from "../content/projects";
import { locales, type Locale } from "../i18n/config";
import { chunkSection, type Chunk } from "../lib/chat/chunk";
import { createGoogle } from "@ai-sdk/google";
import { embedMany } from "ai";

const OUT = path.join(process.cwd(), "lib", "chat", "generated-context.ts");

/** Tira do markdown o que não ajuda a responder e só queima token. */
function cleanMarkdown(md: string): string {
  return md
    .replace(/^import\s+.*$/gm, "") // imports de MDX
    .replace(/<Fig[\s\S]*?\/>/g, "") // componentes de figura
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // imagens
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Section = { heading: string; body: string };

function sectionsFor(locale: Locale): Section[] {
  const out: Section[] = [];

  out.push({
    heading: `sobre ${site.name}`,
    body: [
      `${site.name} — ${site.role[locale]}`,
      site.about[locale].join(" "),
      `contato: ${site.email}`,
      `site: ${site.url}`,
      `currículo: ${site.url}/cv/${locale}`,
    ].join("\n"),
  });

  out.push({
    heading: "stack e tecnologias",
    body: stack
      .map((g) => `${g.group[locale]}: ${g.items.join(", ")}`)
      .join("\n"),
  });

  for (const project of projects) {
    out.push({
      heading: `projeto: ${project.name}`,
      body: [
        `${project.name}: ${project.description[locale]}`,
        `stack: ${project.stack.join(", ")}`,
        `repositório: ${project.repo}`,
      ].join("\n"),
    });
  }

  for (const meta of getAllNotes()) {
    const note = getNote(meta.slug);
    if (!note) continue;
    out.push({
      heading: `note: ${meta.title}`,
      body: [
        `${meta.title} (${meta.date}) — tags: ${meta.tags.join(", ")}`,
        `url: ${site.url}/${locale}/notes/${meta.slug}`,
        "",
        cleanMarkdown(note.content),
      ].join("\n"),
    });
  }

  return out;
}

function buildFor(locale: Locale): string {
  const notes = getAllNotes()
    .map((meta) => {
      const note = getNote(meta.slug);
      if (!note) return "";
      return [
        `### ${meta.title}`,
        `data: ${meta.date} · tags: ${meta.tags.join(", ")}`,
        `url: ${site.url}/${locale}/notes/${meta.slug}`,
        "",
        cleanMarkdown(note.content),
      ].join("\n");
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  const projectList = projects
    .map(
      (p) =>
        `- ${p.name}: ${p.description[locale]} (stack: ${p.stack.join(", ")}) — ${p.repo}`,
    )
    .join("\n");

  return [
    `# ${site.name} — ${site.role[locale]}`,
    "",
    site.about[locale].join(" "),
    "",
    `contato: ${site.email}`,
    `site: ${site.url}`,
    `currículo: ${site.url}/cv/${locale}`,
    "",
    "## stack",
    stack.map((g) => `${g.group[locale]}: ${g.items.join(", ")}`).join("\n"),
    "",
    "## projetos",
    projectList,
    "",
    "## notes (artigos escritos por ele)",
    notes,
  ].join("\n");
}

/** Aproximação suficiente para orçamento: ~4 chars por token. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 768;
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

/** Normaliza para norma 1: com vetores unitários, cosseno vira produto escalar. */
function normalize(vector: number[]): number[] {
  const norm = Math.hypot(...vector);
  return norm === 0 ? vector : vector.map((v) => v / norm);
}

async function embedChunks(chunks: Chunk[]): Promise<number[][] | null> {
  if (!apiKey) return null;
  const google = createGoogle({ apiKey });
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel(EMBED_MODEL),
    values: chunks.map((c) => c.text),
    providerOptions: {
      google: {
        // equivalente ao prefixo `passage:` do e5: diz ao modelo que isto é
        // documento indexado, não pergunta. A query usa RETRIEVAL_QUERY.
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: EMBED_DIMS,
      },
    },
  });
  return embeddings.map(normalize);
}

async function main() {
  const entries = [];

  for (const locale of locales) {
    const text = buildFor(locale);
    const chunks = sectionsFor(locale).flatMap((s) =>
      chunkSection(s.heading, s.body),
    );
    const embeddings = await embedChunks(chunks);
    entries.push({
      locale,
      text,
      tokens: estimateTokens(text),
      chunks,
      embeddings,
    });
  }

  const embedded = entries.every((e) => e.embeddings !== null);

  const file = [
    "// GERADO POR scripts/build-context.ts — NÃO EDITE À MÃO.",
    "// Rode `npm run build:context` para regenerar.",
    'import type { Locale } from "@/i18n/config";',
    "",
    "/** Contexto completo — usado como fallback quando não há embeddings. */",
    "export const generatedContext: Record<Locale, string> = {",
    ...entries.map((e) => `  ${e.locale}: ${JSON.stringify(e.text)},`),
    "};",
    "",
    "export const contextTokens: Record<Locale, number> = {",
    ...entries.map((e) => `  ${e.locale}: ${e.tokens},`),
    "};",
    "",
    "export type IndexedChunk = { text: string; heading: string; embedding: number[] };",
    "",
    "/** Chunks com embedding, para a busca semântica (opção B). */",
    "export const indexedChunks: Record<Locale, IndexedChunk[]> = {",
    ...entries.map(
      (e) =>
        `  ${e.locale}: ${JSON.stringify(
          e.chunks.map((c, i) => ({
            text: c.text,
            heading: c.heading,
            embedding: e.embeddings ? e.embeddings[i].map((v) => Number(v.toFixed(6))) : [],
          })),
        )},`,
    ),
    "};",
    "",
    `export const hasEmbeddings = ${embedded};`,
    `export const embedModel = ${JSON.stringify(EMBED_MODEL)};`,
    `export const embedDims = ${EMBED_DIMS};`,
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, file, "utf8");

  console.log("\n  contexto do chat gerado:");
  for (const e of entries) {
    const full = e.tokens + 200 + 400;
    console.log(
      `    ${e.locale}: ${e.tokens} tokens · ${e.chunks.length} chunks` +
        (e.embeddings ? " · embeddings ok" : " · SEM embeddings (fallback p/ contexto inteiro)"),
    );
    if (e.embeddings) {
      const avg = Math.ceil(
        e.chunks.reduce((sum, c) => sum + c.text.length, 0) / e.chunks.length / 4,
      );
      const retrieved = avg * 5 + 200 + 400;
      console.log(
        `         opção A: ~${full}/pergunta · opção B: ~${retrieved}/pergunta` +
          `  →  ${Math.floor(6000 / retrieved)} perguntas/min (era ${Math.floor(6000 / full)})`,
      );
    }
  }
  console.log("");
}

main().catch((error) => {
  console.error("\n  falha ao gerar o contexto:", error);
  process.exit(1);
});
