// Mascote em ASCII art derivado de app/icon.svg: chevron de prompt (primary)
// + bloco de cursor (secondary). Cada char da grade vira um <span> colorido,
// então o desenho é um só e os dois temas o pintam sozinhos.
//
//   '#' → chevron  (primary)
//   '=' → cursor   (secondary)
//   ' ' → vazio
export const MASCOT: readonly string[] = [
  "  ##          ",
  "   ###        ",
  "    ###       ",
  "     ###  ====",
  "    ###   ====",
  "   ###        ",
  "  ##          ",
] as const;

export const MASCOT_WIDTH = 14;
export const MASCOT_HEIGHT = MASCOT.length;

export type CellKind = "chevron" | "cursor" | "empty";

export function cellKind(char: string): CellKind {
  if (char === "#") return "chevron";
  if (char === "=") return "cursor";
  return "empty";
}

/** Versão de uma linha só, para o launcher e o favicon textual. */
export const MASCOT_INLINE = "▶▌";
