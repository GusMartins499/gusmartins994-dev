import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";

// Peças compartilhadas entre os `opengraph-image` do app: paleta, fontes e a
// moldura de "janela de terminal". Só roda dentro do ImageResponse (satori).

// Paleta rubro-negra (ver DESIGN.md)
export const og = {
  bg: "#0f0c0c",
  surface: "#191313",
  border: "#322323",
  content: "#ece7df",
  muted: "#a4988e",
  primary: "#ef4136",
  secondary: "#ffb000",
} as const;

export const ogSize = { width: 1200, height: 630 };

/** Carrega a DejaVu Sans Mono (regular + bold) no formato que o ImageResponse espera. */
export async function loadOgFonts() {
  const [mono, monoBold] = await Promise.all([
    readFile(join(process.cwd(), "assets/DejaVuSansMono.ttf")),
    readFile(join(process.cwd(), "assets/DejaVuSansMono-Bold.ttf")),
  ]);
  return [
    { name: "mono", data: mono, style: "normal" as const, weight: 400 as const },
    {
      name: "monoBold",
      data: monoBold,
      style: "normal" as const,
      weight: 700 as const,
    },
  ];
}

/** Moldura de janela de terminal; `path` aparece na barra de título. */
export function OgFrame({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: og.bg,
        fontFamily: "mono",
        padding: 64,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          background: og.surface,
          border: `2px solid ${og.border}`,
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {/* barra da janela */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "20px 28px",
            borderBottom: `2px solid ${og.border}`,
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: 8, background: og.primary }} />
          <div style={{ width: 16, height: 16, borderRadius: 8, background: og.secondary }} />
          <div style={{ width: 16, height: 16, borderRadius: 8, background: og.border }} />
          <div style={{ marginLeft: 16, fontSize: 24, color: og.muted }}>
            {path}
          </div>
        </div>

        {/* corpo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "0 64px",
            gap: 16,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
