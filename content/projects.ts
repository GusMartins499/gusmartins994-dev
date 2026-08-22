// Projetos do portfólio. Para adicionar um novo, copie um objeto e edite.
// Todo card abre o repositório no GitHub em nova aba (target="_blank").
// Só a `description` é bilíngue; nome, stack e repo são neutros.

import type { Locale } from "@/i18n/config";

export type Project = {
  name: string;
  description: Record<Locale, string>;
  stack: string[];
  repo: string; // URL do GitHub — o card leva pra cá
  featured?: boolean; // aparece em destaque na home
};

export const projects: Project[] = [
  {
    name: "terminal-portfolio",
    description: {
      pt: "Este portfólio: estética de terminal, tema claro/escuro e conteúdo em MDX.",
      en: "This portfolio: terminal aesthetic, light/dark theme and MDX content.",
    },
    stack: ["next.js", "typescript", "tailwind", "daisyui"],
    repo: "https://github.com/gusmartins/terminal-portfolio",
    featured: true,
  },
  {
    name: "api-catalog",
    description: {
      pt: "API REST de catálogo com autenticação, paginação e testes de integração.",
      en: "Catalog REST API with authentication, pagination and integration tests.",
    },
    stack: ["node.js", "postgres", "docker"],
    repo: "https://github.com/gusmartins/api-catalog",
    featured: true,
  },
  {
    name: "cli-notes",
    description: {
      pt: "Pequena CLI para anotações rápidas direto do terminal.",
      en: "Tiny CLI for quick notes straight from the terminal.",
    },
    stack: ["typescript", "node.js"],
    repo: "https://github.com/gusmartins/cli-notes",
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
