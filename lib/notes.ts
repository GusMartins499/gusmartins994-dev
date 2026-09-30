import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { bcp47, defaultLocale, type Locale } from "@/i18n/config";

// Camada de leitura do mini-blog. Cada arquivo em content/notes/<locale>/*.mdx
// é um post público. Sem flags: se o arquivo existe, o post está no ar.
//
// O mesmo post existe com o MESMO nome de arquivo em cada locale — é isso que
// mantém o slug (e portanto a URL e o hreflang) igual entre /pt e /en. Post
// ainda não traduzido cai no locale padrão em vez de sumir da listagem.
//
// O nome do arquivo é escrito em INGLÊS nas duas pastas, de propósito. Slug
// por idioma daria url melhor em /pt, mas custa duas identidades por post
// (o slug também indexa o href das fontes do chat) e obriga o slug do outro
// idioma a subir até o LangToggle, que mora no layout e só conhece o locale
// — nunca o slug da rota. Uma identidade, em inglês, é o lado barato do
// tradeoff: os termos técnicos já eram ingleses antes.

// Os dois readFileSync daqui levam `turbopackIgnore: true`. O caminho é
// montado em runtime (locale + filename), então o file tracing não consegue
// provar o que é lido e, por garantia, arrastaria o projeto inteiro para o
// bundle do servidor. Ignorar é seguro porque nada disto roda em runtime:
// toda rota que chama estas funções é pré-renderizada no build (as notes
// têm `dynamicParams = false`) e o /api/chat lê um JSON pré-gerado, não o
// content/.
const NOTES_ROOT = path.join(process.cwd(), "content", "notes");

function dirFor(locale: Locale): string {
  return path.join(NOTES_ROOT, locale);
}

export type NoteMeta = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO: YYYY-MM-DD
  tags: string[];
  /** Estimativa de leitura em minutos (mínimo 1). */
  readingMinutes: number;
};

export type Heading = { id: string; text: string; level: 2 | 3 };

/** ~200 palavras por minuto, o padrão para texto técnico em tela. */
function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "Por que streams?" → "por-que-streams". Mesmo cálculo no MDX e no sumário. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Headings de nível 2 e 3 do markdown, para o sumário. Lê o texto cru em vez
 * do MDX renderizado — o sumário precisa existir no servidor, antes de
 * qualquer JS. Ignora o que estiver dentro de bloco de código.
 */
export function extractHeadings(content: string): Heading[] {
  const withoutCode = content.replace(/```[\s\S]*?```/g, "");
  const found: Heading[] = [];
  for (const line of withoutCode.split("\n")) {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const text = match[2].replace(/[*`_]/g, "");
    found.push({ id: slugify(text), text, level: match[1].length as 2 | 3 });
  }
  return found;
}

export type Note = NoteMeta & { content: string };

function readFilenames(locale: Locale): string[] {
  const dir = dirFor(locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
}

/**
 * Nomes de arquivo do locale pedido, completados com os que só existem no
 * locale padrão. O conjunto de posts é o mesmo em toda língua; o que muda é
 * de qual pasta o conteúdo vem.
 */
function filenamesWithFallback(locale: Locale): string[] {
  const own = readFilenames(locale);
  if (locale === defaultLocale) return own;
  const seen = new Set(own);
  return [...own, ...readFilenames(defaultLocale).filter((f) => !seen.has(f))];
}

/** Caminho do arquivo no locale pedido, ou no locale padrão se não traduzido. */
function resolveFile(filename: string, locale: Locale): string | null {
  const wanted = path.join(dirFor(locale), filename);
  if (fs.existsSync(wanted)) return wanted;
  const fallback = path.join(dirFor(defaultLocale), filename);
  return fs.existsSync(fallback) ? fallback : null;
}

function toISODate(value: unknown): string {
  // O YAML pode entregar a data como objeto Date (não string). Normaliza p/ YYYY-MM-DD.
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value ?? "");
}

function slugFromFilename(filename: string): string {
  // remove a extensão e um prefixo de data opcional (2026-08-21-)
  return filename
    .replace(/\.mdx$/, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

export function getAllNotes(locale: Locale = defaultLocale): NoteMeta[] {
  return filenamesWithFallback(locale)
    .map((filename) => {
      const file = resolveFile(filename, locale)!;
      const raw = fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8");
      const { data, content } = matter(raw);
      return {
        slug: slugFromFilename(filename),
        title: String(data.title ?? slugFromFilename(filename)),
        description: String(data.description ?? ""),
        date: toISODate(data.date),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        readingMinutes: readingMinutes(content),
      } satisfies NoteMeta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // mais recente primeiro
}

export function getNote(slug: string, locale: Locale = defaultLocale): Note | null {
  const filename = filenamesWithFallback(locale).find(
    (f) => slugFromFilename(f) === slug,
  );
  if (!filename) return null;
  const file = resolveFile(filename, locale);
  if (!file) return null;
  const raw = fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: toISODate(data.date),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingMinutes: readingMinutes(content),
    content,
  };
}

export function formatDate(iso: string, locale: Locale = "pt"): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(bcp47[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
