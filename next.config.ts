import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Abrir o dev server pelo IP da máquina (para testar no celular) é uma
  // origem cross-origin, que o Next bloqueia por padrão em dev. Só vale em
  // `next dev`; em produção é ignorado.
  allowedDevOrigins: ["192.168.*.*", "100.*.*.*"],

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
