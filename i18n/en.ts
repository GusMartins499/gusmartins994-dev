import type { Dictionary } from "./pt";

// O tipo Dictionary (derivado de pt) garante paridade de chaves entre os idiomas.
export const en: Dictionary = {
  nav: { projects: "projects", notes: "notes" },
  sections: { stack: "skills & stack", projects: "projects", notes: "notes" },
  common: { seeAll: "see all", backToNotes: "notes" },
  a11y: {
    skip: "Skip to content",
    themeToLight: "Switch to light theme",
    themeToDark: "Switch to dark theme",
    language: "Change language",
    openRepo: "open repository on GitHub (new tab)",
  },
  projects: {
    title: "projects",
    subtitle: "Each card opens the repository on GitHub in a new tab.",
  },
  notes: {
    title: "notes",
    subtitle: "A corner to write about what I'm learning.",
    empty: "Nothing here yet.",
    ptBadge: "in portuguese",
  },
  footer: {
    contact: "contact",
    builtWith: "built with next.js, tailwind and daisyui.",
  },
  meta: { portfolioOf: "Portfolio of" },
};
