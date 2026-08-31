import type { Dictionary } from "./pt";

export const en: Dictionary = {
  nav: { projects: "projects", notes: "notes", resume: "resume" },
  sections: { stack: "skills & stack", projects: "projects", notes: "notes" },
  common: { seeAll: "see all" },
  a11y: {
    skip: "Skip to content",
    themeToLight: "Switch to light theme",
    themeToDark: "Switch to dark theme",
    language: "Change language",
    openRepo: "open repository on GitHub (new tab)",
    backHome: "back to home",
    scrollTop: "back to top",
    upDir: "up one level",
  },
  projects: {
    title: "projects",
    subtitle: "Each card opens the repository on GitHub in a new tab.",
  },
  notes: {
    title: "notes",
    subtitle:
      "A corner to write about what I'm learning and some real problems solved",
    empty: "Nothing here yet.",
  },
  footer: {
    contact: "contact",
  },
  meta: { portfolioOf: "Portfolio of" },
};
