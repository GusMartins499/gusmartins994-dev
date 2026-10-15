import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const isCI = Boolean(process.env.CI);

/**
 * E2E contra o build de produção (`next start`), não contra o `next dev`: o
 * proxy de locale, os redirects 308 e as rotas pré-renderizadas só se
 * comportam como na Vercel depois do build.
 *
 * As chaves de IA vão VAZIAS de propósito. String vazia já definida no
 * ambiente não é sobrescrita pelo `.env.local` (nem pelo @next/env, nem pelo
 * `--env-file` do build:context), então o chat roda sempre em modo mock:
 * determinístico e sem gastar cota, inclusive na máquina de quem tem as
 * chaves no `.env.local`.
 */
const serverEnv = {
  GROQ_API_KEY: "",
  GOOGLE_GENERATIVE_AI_API_KEY: "",
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: "",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // No CI o build roda num passo próprio do workflow, antes daqui.
    command: isCI
      ? `npm run start -- -p ${PORT}`
      : `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/pt`,
    env: serverEnv,
    reuseExistingServer: !isCI,
    timeout: 240_000,
  },
});
