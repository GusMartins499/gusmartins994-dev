/**
 * Picotador de texto para retrieval (opção B).
 *
 * Duas decisões que afetam muito a qualidade da busca:
 *
 *  1. Corta preferencialmente em fronteira de parágrafo, depois de frase, e
 *     só quebra no meio como último recurso. Chunk que começa no meio de uma
 *     frase vira ruído no embedding.
 *  2. Cada chunk carrega o cabeçalho da seção de onde veio. Sem isso, um
 *     trecho solto ("reduziu de 40s para 2s") perde o assunto e nunca casa
 *     com a pergunta.
 */
export type Chunk = {
  /** Texto que vai para o prompt (já com o cabeçalho). */
  text: string;
  /** De onde veio, para citar a fonte. */
  heading: string;
};

const TARGET = 800;
const OVERLAP = 50;

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function splitLongParagraph(paragraph: string): string[] {
  if (paragraph.length <= TARGET) return [paragraph];
  const sentences = paragraph.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    if (buffer && buffer.length + sentence.length + 1 > TARGET) {
      out.push(buffer.trim());
      // sobreposição: reaproveita a cauda para não perder o fio
      buffer = buffer.slice(-OVERLAP) + " " + sentence;
    } else {
      buffer = buffer ? `${buffer} ${sentence}` : sentence;
    }
  }
  if (buffer.trim()) out.push(buffer.trim());

  // frase única gigante: aí sim corta no braço
  return out.flatMap((piece) => {
    if (piece.length <= TARGET * 1.5) return [piece];
    const hard: string[] = [];
    for (let i = 0; i < piece.length; i += TARGET - OVERLAP) {
      hard.push(piece.slice(i, i + TARGET));
    }
    return hard;
  });
}

/** Divide uma seção em chunks, prefixando cada um com o cabeçalho. */
export function chunkSection(heading: string, body: string): Chunk[] {
  const paragraphs = splitParagraphs(body);
  const pieces: string[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > TARGET) {
      if (buffer) {
        pieces.push(buffer);
        buffer = "";
      }
      pieces.push(...splitLongParagraph(paragraph));
      continue;
    }
    if (buffer && buffer.length + paragraph.length + 2 > TARGET) {
      pieces.push(buffer);
      buffer = paragraph;
    } else {
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    }
  }
  if (buffer) pieces.push(buffer);

  return pieces.map((text) => ({
    heading,
    text: `[${heading}]\n${text}`,
  }));
}
