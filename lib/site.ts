// Configuração central do site. Edite aqui — o resto do site lê daqui.

export type Social = {
  label: string;
  href: string;
  handle: string;
};

export const site = {
  name: "gustavo martins",
  // handle curto usado no logo do header (~/handle)
  handle: "gusmartins",
  role: "full-stack developer",
  // Descrição bem breve (2–3 linhas). Aparece no hero.
  about: [
    "Construo interfaces rápidas e produtos web com foco em detalhe,",
    "acessibilidade e uma boa experiência de quem usa — e de quem mantém.",
  ],
  email: "gustavosm994@gmail.com",
  // URL de produção (usada em metadados/SEO). Ajuste quando publicar.
  url: "https://gusmartins994.dev",
  locale: "pt-BR",
} as const;

export const socials: Social[] = [
  { label: "GitHub", href: "https://github.com/", handle: "@gusmartins" },
  { label: "LinkedIn", href: "https://linkedin.com/in/", handle: "gustavo martins" },
  { label: "Email", href: `mailto:${site.email}`, handle: site.email },
];

// Skills & tech stack, agrupadas. Edite à vontade.
export const stack: { group: string; items: string[] }[] = [
  { group: "linguagens", items: ["TypeScript", "JavaScript", "SQL"] },
  { group: "frontend", items: ["React", "Next.js", "Tailwind", "daisyUI"] },
  { group: "backend", items: ["Node.js", "PostgreSQL", "REST"] },
  { group: "ferramentas", items: ["Git", "Docker", "Vercel", "Figma"] },
];
