import type { Locale } from "@/i18n/config";

export type Social = {
  label: string;
  href: string;
  handle: string;
};

type Localized = Record<Locale, string>;

export const site = {
  name: "gustavo martins",
  handle: "gusmartins",
  role: {
    pt: "software engineer",
    en: "software engineer",
  } satisfies Localized,
  about: {
    pt: [
      "Desenvolvedor full-stack com foco no ecossistema Javascript/Typescript,",
      "minha motivação é contrubuir com soluções que tenham impacto positivo na vida das pessoas, afinal, nunca é apenas código.",
    ],
    en: [
      "Full-stack developer focused on the Javascript/Typescript ecosystem,",
      "my motivation is to contribute solutions that have positive impact on people's lives, because it's never just code.",
    ],
  } satisfies Record<Locale, string[]>,
  email: "gustavosm994@gmail.com",
  url: "https://gusmartins994.dev",
} as const;

export const socials: Social[] = [
  {
    label: "GitHub",
    href: "https://github.com/GusMartins499",
    handle: "@gusmartins",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/gustavo-martins994",
    handle: "gustavo martins",
  },
  { label: "Email", href: `mailto:${site.email}`, handle: site.email },
];

export const stack: { group: Localized; items: string[] }[] = [
  {
    group: { pt: "linguagens", en: "languages" },
    items: ["TypeScript", "JavaScript"],
  },
  {
    group: { pt: "frontend", en: "frontend" },
    items: ["React", "Next.js", "Tailwind"],
  },
  {
    group: { pt: "backend", en: "backend" },
    items: ["Node.js", "Nest.js", "Postgresql", "Mongodb"],
  },
  {
    group: { pt: "ferramentas", en: "tools" },
    items: ["Git", "Docker", "Vercel", "Figma"],
  },
];
