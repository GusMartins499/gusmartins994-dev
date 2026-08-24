"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";

export function FloatingNav({
  scrollTopLabel,
}: {
  locale: Locale;
  backHomeLabel: string;
  scrollTopLabel: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={scrollTopLabel}
      title={scrollTopLabel}
      aria-hidden={!scrolled}
      tabIndex={scrolled ? 0 : -1}
      className={[
        "cursor-pointer fixed bottom-5 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-box border border-base-300 bg-base-200 text-primary shadow-lg transition-all duration-200 hover:border-primary hover:bg-base-300",
        scrolled
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
      ].join(" ")}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
