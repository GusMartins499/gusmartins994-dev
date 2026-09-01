import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
