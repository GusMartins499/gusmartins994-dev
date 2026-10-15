import { test, expect, type Page } from "@playwright/test";
import { bcp47, defaultLocale } from "@/i18n/config";
import { allPages, locales, notesFor, site, staticRoutes } from "./support/content";

/** Conteúdo de todas as ocorrências de uma tag simples no XML. */
function tagValues(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, "g"))].map((m) => m[1]);
}

/** As URLs de metadados saem absolutas (metadataBase); aqui viram locais. */
function local(url: string): string {
  return url.replace(site.url, "");
}

test.describe("arquivos de rastreamento", () => {
  test("sitemap.xml lista toda página pública, nos dois locales", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);

    const locs = tagValues(await response.text(), "loc").map(local);
    expect(locs.sort()).toEqual(allPages().sort());
  });

  test("robots.txt libera tudo e aponta o sitemap", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toContain("Allow: /");
    expect(body).toContain(`Sitemap: ${site.url}/sitemap.xml`);
  });

  test("manifest é um JSON com o nome do site", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBe(true);
    expect((await response.json()).short_name).toBe(site.name);
  });
});

test.describe("feed RSS", () => {
  for (const locale of locales) {
    const path = locale === defaultLocale ? "/feed.xml" : `/${locale}/feed.xml`;

    test(`${path} tem um item por note de ${locale}`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.headers()["content-type"]).toContain("application/rss+xml");

      const xml = await response.text();
      expect(tagValues(xml, "language")).toEqual([bcp47[locale]]);
      expect(tagValues(xml, "link").map(local)).toEqual([
        `/${locale}/notes`,
        ...notesFor(locale).map((note) => `/${locale}/notes/${note.slug}`),
      ]);
    });
  }

  test("o feed do locale padrão só existe na raiz", async ({ request }) => {
    const response = await request.get(`/${defaultLocale}/feed.xml`);
    expect(response.status()).toBe(404);
  });
});

type Head = {
  lang: string | null;
  canonical: string | null;
  alternates: Record<string, string>;
  ogImage: string | null;
  twitterImage: string | null;
  jsonLd: { "@type": string }[];
};

/**
 * Lê do documento o que os buscadores e as redes sociais leem. Num
 * `evaluate` só: meta ausente vira `null` na hora, em vez de o locator
 * esperar o timeout por um elemento que nunca vai aparecer.
 */
async function headOf(page: Page): Promise<Head> {
  return page.evaluate(() => {
    const attr = (selector: string, name: string) =>
      document.querySelector(selector)?.getAttribute(name) ?? null;
    const meta = (key: string) =>
      attr(`meta[property="${key}"], meta[name="${key}"]`, "content");

    return {
      lang: document.documentElement.getAttribute("lang"),
      canonical: attr('link[rel="canonical"]', "href"),
      alternates: Object.fromEntries(
        [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [
          l.getAttribute("hreflang"),
          l.getAttribute("href"),
        ]),
      ),
      ogImage: meta("og:image"),
      twitterImage: meta("twitter:image"),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
        (s) => JSON.parse(s.textContent ?? "{}"),
      ),
    };
  });
}

test.describe("metadados das páginas", () => {
  for (const locale of locales) {
    const notePaths = notesFor(locale).map((note) => `/notes/${note.slug}`);

    for (const route of [...staticRoutes, ...notePaths]) {
      const path = `/${locale}${route}`;

      test(`${path}: lang, título, canonical e hreflang`, async ({ page }) => {
        // BUG conhecido: o /chat não usa o alternatesFor (sai sem hreflang)
        // e põe o nome no título que o template do layout já acrescenta.
        // Quando a correção entrar este teste passa e o test.fail() acusa.
        test.fail(route === "/chat");
        await page.goto(path);
        const head = await headOf(page);

        expect(head.lang).toBe(bcp47[locale]);
        expect((await page.title()).split(site.name)).toHaveLength(2);
        expect(local(head.canonical ?? "")).toBe(path);
        expect(
          Object.fromEntries(Object.entries(head.alternates).map(([k, v]) => [k, local(v)])),
        ).toEqual({
          ...Object.fromEntries(locales.map((l) => [bcp47[l], `/${l}${route}`])),
          "x-default": `/${defaultLocale}${route}`,
        });
        expect(head.jsonLd.map((ld) => ld["@type"])).toContain("Person");
      });
    }

    for (const route of [...staticRoutes, ...notePaths]) {
      const path = `/${locale}${route}`;

      test(`${path}: imagens de compartilhamento`, async ({ page, request }) => {
        // BUG conhecido: o `openGraph` destas páginas substitui o do layout
        // inteiro e leva junto a imagem. Quando a correção entrar este teste
        // passa e o test.fail() acusa.
        test.fail(route === "/projects" || route === "/notes");
        await page.goto(path);
        const head = await headOf(page);

        for (const image of [head.ogImage, head.twitterImage]) {
          expect(image).toBeTruthy();
          const response = await request.get(local(image!));
          expect(response.status()).toBe(200);
          expect(response.headers()["content-type"]).toBe("image/png");
        }
      });
    }

    for (const route of notePaths) {
      test(`/${locale}${route}: JSON-LD do artigo`, async ({ page }) => {
        await page.goto(`/${locale}${route}`);
        const types = (await headOf(page)).jsonLd.map((ld) => ld["@type"]);
        expect(types).toEqual(expect.arrayContaining(["BlogPosting", "BreadcrumbList"]));
      });
    }
  }
});
