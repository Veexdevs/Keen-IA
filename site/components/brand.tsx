"use client";

/**
 * "Keen IA" — with the two letters in the visitor's language.
 *
 * The page is static, so the server always emits the English default ("Keen
 * AI") and this swaps in the local initialism after hydration if the app has
 * left its language cookie. The swap is two characters wide, so it cannot
 * cause a visible layout shift.
 */
import { useEffect, useState } from "react";

import { suffixFor } from "@/lib/brand";

export function Brand({ className = "" }: { className?: string }) {
  const [suffix, setSuffix] = useState<string | null>(null);

  useEffect(() => {
    const hit = document.cookie.match(/(?:^|;\s*)keew_locale=([^;]+)/);
    if (hit) setSuffix(suffixFor(decodeURIComponent(hit[1])));
  }, []);

  return (
    <span className={className}>
      Keen <span suppressHydrationWarning>{suffix ?? "AI"}</span>
    </span>
  );
}
