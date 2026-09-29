import { buildFeed, FEED_HEADERS } from "@/lib/feed";
import { defaultLocale } from "@/i18n/config";

// Feed do locale padrão, na raiz — é a URL que já está no ar e em leitores
// de RSS. Os outros locales ficam em /<locale>/feed.xml.

export const dynamic = "force-static";

export async function GET() {
  return new Response(buildFeed(defaultLocale), { headers: FEED_HEADERS });
}
