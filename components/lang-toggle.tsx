"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { rememberLocale, withLocale } from "@/lib/locale";

export function LangToggle({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(target: Locale) {
    if (target === current) return;
    rememberLocale(target);
    router.push(withLocale(pathname, target));
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center rounded-field border border-base-300 text-xs"
    >
      {locales.map((loc, i) => {
        const active = loc === current;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-current={active ? "true" : undefined}
            className={[
              "cursor-pointer px-1.5 py-1 uppercase",
              i === 0 ? "rounded-l-field" : "rounded-r-field",
              active
                ? "bg-primary font-medium text-primary-content"
                : "text-muted hover:text-base-content",
            ].join(" ")}
          >
            {loc}
          </button>
        );
      })}
    </div>
  );
}
