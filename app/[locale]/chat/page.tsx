import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SectionHeading } from "@/components/section";
import { Terminal } from "@/components/chat/terminal";
import { site } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: `${dict.chat.title} — ${site.name}`,
    description: dict.chat.subtitle,
    alternates: { canonical: `${site.url}/${locale}/chat` },
  };
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l: Locale = locale;
  const dict = getDictionary(l);

  // Lido no servidor: o cliente nunca vê a chave, só se ela existe.
  const mock = !process.env.GROQ_API_KEY;

  return (
    <div className="space-y-6 py-10 sm:py-14">
      <header>
        <SectionHeading as="h1" id="chat">
          {dict.chat.title}
        </SectionHeading>
        <p className="max-w-xl text-muted">{dict.chat.subtitle}</p>
      </header>

      {/* O Terminal lê ?q= (pergunta vinda do ⌘K) com useSearchParams, que
          exige Suspense para a página seguir prerenderizada como estática. */}
      <Suspense
        fallback={
          <div className="rounded-box border border-base-300 bg-base-200/60 p-4 text-sm text-faint">
            {dict.chat.title}…
          </div>
        }
      >
        <Terminal locale={l} dict={dict} mock={mock} />
      </Suspense>
    </div>
  );
}
