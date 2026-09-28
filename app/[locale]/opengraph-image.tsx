import { ImageResponse } from "next/og";
import { site } from "@/lib/site";
import { isLocale } from "@/i18n/config";
import { OgFrame, og, ogSize, loadOgFonts } from "@/components/og";

export const alt = `${site.name} — ${site.role.pt}`;
export const size = ogSize;
export const contentType = "image/png";

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

  return new ImageResponse(
    (
      <OgFrame path={site.url.replace("https://", "")}>
        <div style={{ display: "flex", fontSize: 34, color: og.muted }}>
          <span style={{ color: og.secondary }}>~&nbsp;</span>
          <span>whoami</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 92,
            fontFamily: "monoBold",
            color: og.content,
          }}
        >
          <span style={{ color: og.primary }}>&gt;&nbsp;</span>
          <span>{site.name}</span>
          <span
            style={{
              width: 44,
              height: 12,
              background: og.secondary,
              marginLeft: 20,
              borderRadius: 4,
            }}
          />
        </div>
        <div style={{ display: "flex", fontSize: 40, color: og.content }}>
          <span style={{ color: og.muted }}>{"// "}</span>
          <span>{role}</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: og.muted, marginTop: 8 }}>
          {tagline}
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await loadOgFonts() },
  );
}
