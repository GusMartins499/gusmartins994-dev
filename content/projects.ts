// Projetos do portfólio. Para adicionar um novo, copie um objeto e edite.
// Todo card abre o repositório no GitHub em nova aba (target="_blank").

export type Project = {
  name: string;
  description: string;
  stack: string[];
  repo: string; // URL do GitHub — o card leva pra cá
  featured?: boolean; // aparece em destaque na home
};

export const projects: Project[] = [
  {
    name: "terminal-portfolio",
    description:
      "Este portfólio: estética de terminal, tema claro/escuro e conteúdo em MDX.",
    stack: ["next.js", "typescript", "tailwind", "daisyui"],
    repo: "https://github.com/gusmartins/terminal-portfolio",
    featured: true,
  },
  {
    name: "api-catalog",
    description:
      "API REST de catálogo com autenticação, paginação e testes de integração.",
    stack: ["node.js", "postgres", "docker"],
    repo: "https://github.com/gusmartins/api-catalog",
    featured: true,
  },
  {
    name: "cli-notes",
    description: "Pequena CLI para anotações rápidas direto do terminal.",
    stack: ["typescript", "node.js"],
    repo: "https://github.com/gusmartins/cli-notes",
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
