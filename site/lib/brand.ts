/**
 * The two letters after "Keen", in the visitor's language.
 *
 * The wordmark is "Keen IA" in Portuguese and Spanish, "Keen KI" in German and
 * Dutch, "Keen ИИ" in Russian. The app knows that from its dictionaries; this
 * page has no dictionaries, so it reads the language the app already stored.
 *
 * The cookie is written by the app (see lib/i18n/store.ts). When it is absent —
 * a first visit straight to this page — English "AI" is the fallback, which is
 * the right default for an international page.
 *
 * This list is the 20 translations of the same single key. It is duplicated
 * here on purpose: importing lib/i18n/dict.ts would pull 170 kB of prose into a
 * page whose whole job is to hand over a file.
 */

const W = "AI";

const BY_LOCALE: Record<string, string> = {
  en: "AI",
  "pt-BR": "IA",
  pt: "IA",
  es: "IA",
  fr: "IA",
  it: "IA",
  de: "KI",
  nl: "KI",
  pl: "SI",
  tr: "YZ",
  ru: "ИИ",
  uk: "ШІ",
  ar: "ذ.ا",
  hi: "एआई",
  id: "AI",
  ja: "AI",
  ko: "AI",
  zh: "AI",
  vi: "AI",
  th: "AI",
  he: "ב.מ",
};

/** Maps a cookie value such as "pt-BR" or "sr-Latn" to the two letters. */
export function suffixFor(locale: string | undefined): string {
  if (!locale) return W;
  if (BY_LOCALE[locale]) return BY_LOCALE[locale];
  const base = locale.split("-")[0].toLowerCase();
  return BY_LOCALE[base] ?? W;
}
