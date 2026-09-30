import type { NextConfig } from "next";
import { locales } from "./i18n/config";

/**
 * Slugs de note que mudaram quando o slug passou a ser único e em inglês
 * (antes: o nome do arquivo em português servia as duas línguas, e a SERP
 * em inglês mostrava título em inglês sobre url em português).
 *
 * Esta lista é FECHADA: toda note nova já nasce com nome de arquivo em
 * inglês, então não há slug antigo novo para acumular aqui.
 */
const RENAMED_NOTES: Record<string, string> = {
  "19x-mais-dados-a-mesma-memoria-streams-nodejs":
    "19x-more-data-same-memory-streams-nodejs",
  "meu-primeiro-projeto-em-producao-com-async-jobs":
    "my-first-project-in-production-with-async-jobs",
  "n-mais-1-e-bigo-relatorio-20x-mais-rapido":
    "n-plus-1-and-big-o-report-20x-faster",
};

const nextConfig: NextConfig = {
  async redirects() {
    // Com o prefixo de locale explícito: estas entradas não disputam path
    // com o proxy.ts, que só age em url sem locale.
    return locales.flatMap((locale) =>
      Object.entries(RENAMED_NOTES).map(([from, to]) => ({
        source: `/${locale}/notes/${from}`,
        destination: `/${locale}/notes/${to}`,
        permanent: true,
      })),
    );
  },

  async rewrites() {
    return [
      // CV gerado no repo resume-template (LaTeX → PDF via GitHub Pages).
      // Servido sob o domínio próprio; sempre reflete o último push do CV.
      {
        source: "/cv/pt",
        destination:
          "https://gusmartins499.github.io/resume-template/pt-br/curriculo.pdf",
      },
      {
        source: "/cv/en",
        destination:
          "https://gusmartins499.github.io/resume-template/en/resume.pdf",
      },
    ];
  },
};

export default nextConfig;
