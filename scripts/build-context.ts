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
 */
import fs from "node:fs";
import path from "node:path";
import { getAllNotes, getNote } from "../lib/notes";
import { site, stack } from "../lib/site";
import { projects } from "../content/projects";
import { locales, type Locale } from "../i18n/config";

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

function buildFor(locale: Locale): string {
  const notes = getAllNotes()
    .map((meta) => {
      const note = getNote(meta.slug);
      if (!note) return "";
      return [
        `### ${meta.title}`,
        `data: ${meta.date} · tags: ${meta.tags.join(", ")}`,
        `url: /${locale}/notes/${meta.slug}`,
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

const entries = locales.map((locale) => {
  const text = buildFor(locale);
  return { locale, text, tokens: estimateTokens(text) };
});

const file = [
  "// GERADO POR scripts/build-context.ts — NÃO EDITE À MÃO.",
  "// Rode `npm run build:context` para regenerar.",
  'import type { Locale } from "@/i18n/config";',
  "",
  "export const generatedContext: Record<Locale, string> = {",
  ...entries.map((e) => `  ${e.locale}: ${JSON.stringify(e.text)},`),
  "};",
  "",
  "export const contextTokens: Record<Locale, number> = {",
  ...entries.map((e) => `  ${e.locale}: ${e.tokens},`),
  "};",
  "",
].join("\n");

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, file, "utf8");

console.log("\n  contexto do chat gerado:");
for (const e of entries) {
  const perAsk = e.tokens + 200 + 400; // + instruções + resposta
  const asksPerDay = Math.floor(200_000 / perAsk);
  console.log(
    `    ${e.locale}: ${e.tokens} tokens  →  ~${perAsk}/pergunta  →  ~${asksPerDay} perguntas/dia no free tier`,
  );
}
console.log("");
