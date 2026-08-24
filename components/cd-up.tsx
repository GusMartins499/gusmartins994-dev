"use client";

import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";

export function CdUp() {
  const { locale } = useParams<{ locale: Locale; slug: string }>();
  if (!isLocale(locale)) notFound();
  const l: Locale = locale;
  const dict = getDictionary(l);
  const router = useRouter();

  return (
    <div className="w-full flex justify-between items-center">
      <button
        onClick={() => router.back()}
        aria-label={dict.a11y.upDir}
        title={dict.a11y.upDir}
        className="cursor-pointer inline-block text-sm text-muted hover:text-primary focus-visible:text-primary"
      >
        cd ..
      </button>
      <Link
        href={`/${locale}`}
        aria-label={dict.a11y.backHome}
        title={dict.a11y.backHome}
        className="inline-block text-sm text-muted hover:text-primary focus-visible:text-primary"
      >
        cd ~
      </Link>
    </div>
  );
}
