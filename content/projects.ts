import type { Locale } from "@/i18n/config";

export type Project = {
  name: string;
  description: Record<Locale, string>;
  stack: string[];
  repo: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    name: "woovi-challenge",
    description: {
      pt: "API para gerar relatórios com grande volume de dados",
      en: "API to generate reports that can handle many data",
    },
    stack: ["node.js", "typescript", "streams", "mongodb", "docker"],
    repo: "https://github.com/GusMartins499/woovi-challenge",
    featured: true,
  },
  {
    name: "delivery-tracking",
    description: {
      pt: 'Utilizando SSE para simular um "iFood"',
      en: 'Using SSE to simulate the "iFood" app',
    },
    stack: ["javascript", "node.js", "redis", "react", "docker"],
    repo: "https://github.com/GusMartins499/delivery-tracking",
  },
  {
    name: "tech-calendar-brazil",
    description: {
      pt: "Calendário de eventos tech do Brasil na sua agenda Google",
      en: "Brazilian tech events calendar for your Google Calendar",
    },
    stack: ["typescript", "next.js", "docker", "k8s", "Google APIs"],
    repo: "https://github.com/GusMartins499/tech-calendar-brazil",
  },
  {
    name: "rotina",
    description: {
      pt: "Organizador de rotina semanal onde remanejar custa um arrasto",
      en: "Weekly routine planner where rescheduling costs a single drag",
    },
    stack: ["typescript", "next.js", "react", "drizzle", "sqlite"],
    repo: "https://github.com/GusMartins499/rotina",
    featured: true,
  },
  {
    name: "doca",
    description: {
      pt: "Dock nativo para Linux com perfis por ambiente e widgets ao vivo",
      en: "Native Linux dock with per-environment profiles and live widgets",
    },
    stack: ["rust", "gtk3", "x11", "d-bus", "shell"],
    repo: "https://github.com/GusMartins499/doca",
    featured: true,
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
