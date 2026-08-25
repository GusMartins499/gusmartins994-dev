import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/site";
import { isLocale } from "@/i18n/config";

export const alt = `${site.name} — ${site.role.pt}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Paleta rubro-negra (ver DESIGN.md)
const bg = "#0f0c0c";
const surface = "#191313";
const border = "#322323";
const content = "#ece7df";
const muted = "#a4988e";
const primary = "#ef4136";
const secondary = "#ffb000";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "pt";
  const role = site.role[l];
  const tagline =
    l === "pt"
      ? "desenvolvedor full-stack · javascript / typescript"
      : "full-stack developer · javascript / typescript";

  const [mono, monoBold] = await Promise.all([
    readFile(join(process.cwd(), "assets/DejaVuSansMono.ttf")),
    readFile(join(process.cwd(), "assets/DejaVuSansMono-Bold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: bg,
          fontFamily: "mono",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            background: surface,
            border: `2px solid ${border}`,
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
              borderBottom: `2px solid ${border}`,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 8, background: primary }} />
            <div style={{ width: 16, height: 16, borderRadius: 8, background: secondary }} />
            <div style={{ width: 16, height: 16, borderRadius: 8, background: border }} />
            <div style={{ marginLeft: 16, fontSize: 24, color: muted }}>
              {site.url.replace("https://", "")}
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
            <div style={{ display: "flex", fontSize: 34, color: muted }}>
              <span style={{ color: secondary }}>~&nbsp;</span>
              <span>whoami</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 92,
                fontFamily: "monoBold",
                color: content,
              }}
            >
              <span style={{ color: primary }}>&gt;&nbsp;</span>
              <span>{site.name}</span>
              <span
                style={{
                  width: 44,
                  height: 12,
                  background: secondary,
                  marginLeft: 20,
                  borderRadius: 4,
                }}
              />
            </div>
            <div style={{ display: "flex", fontSize: 40, color: content }}>
              <span style={{ color: muted }}>{"// "}</span>
              <span>{role}</span>
            </div>
            <div style={{ display: "flex", fontSize: 28, color: muted, marginTop: 8 }}>
              {tagline}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "mono", data: mono, style: "normal", weight: 400 },
        { name: "monoBold", data: monoBold, style: "normal", weight: 700 },
      ],
    },
  );
}
