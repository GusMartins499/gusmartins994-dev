// Configuração central do site. Edite aqui — o resto do site lê daqui.
// Textos corridos são bilíngues ({ pt, en }); dados neutros ficam únicos.

import type { Locale } from "@/i18n/config";

export type Social = {
  label: string;
  href: string;
  handle: string;
};

type Localized = Record<Locale, string>;

export const site = {
  name: "gustavo martins",
  // handle curto usado no logo do header (~/handle)
  handle: "gusmartins",
  role: {
    pt: "full-stack developer",
    en: "full-stack developer",
  } satisfies Localized,
  // Descrição bem breve (2–3 linhas). Aparece no hero.
  about: {
    pt: [
      "Construo interfaces rápidas e produtos web com foco em detalhe,",
      "acessibilidade e uma boa experiência de quem usa — e de quem mantém.",
    ],
    en: [
      "I build fast interfaces and web products with an eye for detail,",
      "accessibility and a good experience for users — and maintainers.",
    ],
  } satisfies Record<Locale, string[]>,
  email: "gustavosm994@gmail.com",
  // URL de produção (usada em metadados/SEO). Ajuste quando publicar.
  url: "https://gusmartins994.dev",
} as const;

export const socials: Social[] = [
  { label: "GitHub", href: "https://github.com/", handle: "@gusmartins" },
  { label: "LinkedIn", href: "https://linkedin.com/in/", handle: "gustavo martins" },
  { label: "Email", href: `mailto:${site.email}`, handle: site.email },
];

// Skills & tech stack, agrupadas. O rótulo do grupo é bilíngue; os itens, neutros.
export const stack: { group: Localized; items: string[] }[] = [
  { group: { pt: "linguagens", en: "languages" }, items: ["TypeScript", "JavaScript", "SQL"] },
  { group: { pt: "frontend", en: "frontend" }, items: ["React", "Next.js", "Tailwind", "daisyUI"] },
  { group: { pt: "backend", en: "backend" }, items: ["Node.js", "PostgreSQL", "REST"] },
  { group: { pt: "ferramentas", en: "tools" }, items: ["Git", "Docker", "Vercel", "Figma"] },
];
