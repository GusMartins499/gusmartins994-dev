import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { bcp47, type Locale } from "@/i18n/config";

// Camada de leitura do mini-blog. Cada arquivo em content/notes/*.mdx
// é um post público. Sem flags: se o arquivo existe, o post está no ar.

const NOTES_DIR = path.join(process.cwd(), "content", "notes");

export type NoteMeta = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO: YYYY-MM-DD
  tags: string[];
};

export type Note = NoteMeta & { content: string };

function readFilenames(): string[] {
  if (!fs.existsSync(NOTES_DIR)) return [];
  return fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith(".mdx"));
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

export function getAllNotes(): NoteMeta[] {
  return readFilenames()
    .map((filename) => {
      const raw = fs.readFileSync(path.join(NOTES_DIR, filename), "utf8");
      const { data } = matter(raw);
      return {
        slug: slugFromFilename(filename),
        title: String(data.title ?? slugFromFilename(filename)),
        description: String(data.description ?? ""),
        date: toISODate(data.date),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      } satisfies NoteMeta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // mais recente primeiro
}

export function getNote(slug: string): Note | null {
  const filename = readFilenames().find((f) => slugFromFilename(f) === slug);
  if (!filename) return null;
  const raw = fs.readFileSync(path.join(NOTES_DIR, filename), "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: toISODate(data.date),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
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
