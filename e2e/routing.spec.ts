import { test, expect } from "@playwright/test";
import { getDictionary } from "@/i18n/dictionaries";
import { allPages, locales, pathOf } from "./support/content";

// Só requisições: o que está em jogo aqui é status e `location`, não UI.
// `maxRedirects: 0` para ver o redirect em si, e não a página de destino.

test.describe("proxy de locale", () => {
  const cases: { name: string; headers: Record<string, string>; to: string }[] = [
    { name: "Accept-Language em inglês", headers: { "accept-language": "en-US,en;q=0.9" }, to: "/en" },
    { name: "Accept-Language em português", headers: { "accept-language": "pt-BR,pt;q=0.9" }, to: "/pt" },
    { name: "idioma sem suporte cai no padrão", headers: { "accept-language": "fr-FR,fr;q=0.9" }, to: "/pt" },
    { name: "sem Accept-Language cai no padrão", headers: { "accept-language": "" }, to: "/pt" },
    {
      name: "cookie do toggle vence o Accept-Language",
      headers: { "accept-language": "pt-BR", cookie: "NEXT_LOCALE=en" },
      to: "/en",
    },
    {
      name: "cookie inválido é ignorado",
      headers: { "accept-language": "en-US", cookie: "NEXT_LOCALE=xx" },
      to: "/en",
    },
  ];

  for (const { name, headers, to } of cases) {
    test(name, async ({ request }) => {
      const response = await request.get("/", { headers, maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(pathOf(response.headers()["location"])).toBe(to);
    });
  }

  test("mantém o caminho e a query", async ({ request }) => {
    const response = await request.get("/chat?q=oi", {
      headers: { "accept-language": "en-US" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(307);
    expect(pathOf(response.headers()["location"])).toBe("/en/chat?q=oi");
  });

  test("não mexe em url que já tem locale", async ({ request }) => {
    const response = await request.get("/en/notes", {
      headers: { "accept-language": "pt-BR", cookie: "NEXT_LOCALE=pt" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
  });
});

test.describe("slugs antigos das notes", () => {
  // Lista fechada (ver RENAMED_NOTES no next.config.ts): nenhuma note nova
  // nasce com slug em português, então nada novo entra aqui.
  const renamed: Record<string, string> = {
    "19x-mais-dados-a-mesma-memoria-streams-nodejs": "19x-more-data-same-memory-streams-nodejs",
    "meu-primeiro-projeto-em-producao-com-async-jobs": "my-first-project-in-production-with-async-jobs",
    "n-mais-1-e-bigo-relatorio-20x-mais-rapido": "n-plus-1-and-big-o-report-20x-faster",
  };

  for (const locale of locales) {
    for (const [from, to] of Object.entries(renamed)) {
      test(`/${locale}/notes/${from} → 308`, async ({ request }) => {
        const response = await request.get(`/${locale}/notes/${from}`, { maxRedirects: 0 });
        expect(response.status()).toBe(308);
        expect(pathOf(response.headers()["location"])).toBe(`/${locale}/notes/${to}`);
      });
    }
  }
});

test.describe("páginas públicas", () => {
  for (const path of allPages()) {
    test(`${path} responde 200`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
    });
  }
});

test.describe("404", () => {
  for (const locale of locales) {
    for (const path of [`/${locale}/notes/nao-existe`, `/${locale}/rota-inexistente`]) {
      test(`${path} responde 404`, async ({ request }) => {
        const response = await request.get(path, { maxRedirects: 0 });
        expect(response.status()).toBe(404);
      });

      test(`${path} mostra o caminho que falhou`, async ({ page }) => {
        // BUG conhecido: url sem rota (e slug fora do generateStaticParams)
        // cai na 404 padrão do Next, não no app/[locale]/not-found.tsx.
        // Quando a correção entrar este teste passa e o test.fail() acusa.
        test.fail();
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
        await expect(
          page.getByText(`cd: ${path}: ${getDictionary(locale).notFound.reason}`),
        ).toBeVisible({ timeout: 2_000 });
      });
    }
  }
});
