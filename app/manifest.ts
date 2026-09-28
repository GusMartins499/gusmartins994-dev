import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.role.pt}`,
    short_name: site.name,
    description: `Portfólio de ${site.name}, ${site.role.pt}.`,
    id: "/",
    start_url: "/",
    scope: "/",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["portfolio", "development", "technology"],
    display: "standalone",
    background_color: "#0f0c0c",
    theme_color: "#0f0c0c",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
