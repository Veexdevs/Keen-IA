"use client";

/**
 * Translation at the component level.
 *
 * useT() returns a t() bound to the current language. Lookup order:
 *
 *   1. the bundled dictionary for that language, if it is one of the 20
 *   2. strings the model has already translated (client cache or server)
 *   3. English
 *
 * Step 3 is why a half-finished translation can never render an empty label:
 * the worst case is a label in English, never a blank button.
 */
import { useCallback, useEffect } from "react";

import { DICTS, en, type Key } from "./dict";
import { isBundled, useLocale } from "./store";

export type Vars = Record<string, string | number>;

export function useT() {
  const locale = useLocale((s) => s.locale);
  const tag = useLocale((s) => s.tag);
  const remote = useLocale((s) => s.remote[tag]);
  const dict = DICTS[locale] ?? en;

  return useCallback(
    (key: Key, vars?: Vars) => {
      /* for the 20 bundled languages the dictionary is authoritative — the
         remote cache only fills what a dictionary cannot, which is nothing */
      const raw: string =
        (dict === en ? remote?.[key] : undefined) ?? dict[key] ?? remote?.[key] ?? en[key] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (whole, name: string) =>
        name in vars ? String(vars[name]) : whole,
      );
    },
    [dict, remote],
  );
}

/**
 * Asks for the translations the caller is about to draw.
 *
 * Call it with the keys of one screen. On the bundled languages it does
 * nothing; on the other 161 it fetches whatever is missing, a batch at a time,
 * and the screen re-renders as the strings land. Passing an empty list is how a
 * screen says "I need nothing" and stops the request loop.
 *
 * The dependency is the joined key list, not the array: a new array with the
 * same strings every render would otherwise re-request forever.
 */
export function useStrings(keys: Key[]) {
  const tag = useLocale((s) => s.tag);
  const ensure = useLocale((s) => s.ensureStrings);
  const signature = keys.join(",");

  useEffect(() => {
    if (!signature) return;
    if (isBundled(tag)) return;
    const wanted: Record<string, string> = {};
    for (const key of signature.split(",") as Key[]) {
      wanted[key] = en[key] ?? key;
    }
    void ensure(wanted);
  }, [signature, tag, ensure]);
}
