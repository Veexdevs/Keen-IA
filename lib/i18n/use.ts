"use client";

/**
 * Translation at the component level.
 *
 * useT() returns a t() bound to the current language. Strings are looked up in
 * the active dictionary and fall back to English, so a half-finished
 * translation can never render an empty label.
 */
import { useCallback } from "react";

import { DICTS, en, type Key } from "./dict";
import { useLocale } from "./store";

export type Vars = Record<string, string | number>;

export function useT() {
  const locale = useLocale((s) => s.locale);
  const dict = DICTS[locale] ?? en;

  return useCallback(
    (key: Key, vars?: Vars) => {
      const raw: string = dict[key] ?? en[key] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (whole, name: string) =>
        name in vars ? String(vars[name]) : whole,
      );
    },
    [dict],
  );
}
