"use client";

/**
 * The chosen language.
 *
 * Auto mode follows the device — browser languages first, time zone second.
 * An explicit choice is remembered and wins over auto forever after, until the
 * person switches back to Automatic.
 *
 * Two kinds of language live here:
 *
 *   bundled — the 20 hand-written dictionaries in dict.ts. Instant, offline,
 *             and complete down to the last label.
 *   remote  — the rest of the catalogue. Their strings are translated by
 *             app/api/i18n on first use and cached in Supabase, arriving a few
 *             dozen at a time. Until a string arrives, English shows, which is
 *             why a freshly picked language looks half-translated for a moment
 *             and then settles.
 *
 * `locale` is what the interface renders in; `tag` is the catalogue entry the
 * person picked. They differ for the remote languages, and that difference is
 * the whole point: any of 181 languages can be chosen, and 20 of them are
 * instant.
 */
import { create } from "zustand";

import { canonicalTag, LANGUAGE_BY_TAG, primaryTag, type Language } from "./languages";
import { detectLocale, type Locale } from "./index";
import { supabaseBrowser } from "../supabase/client";

/** Interface translations that arrived from the server, per language tag. */
type Strings = Record<string, Record<string, string>>;

type State = {
  /** bundled dictionary in use, for fallback and for the 20 complete ones */
  locale: Locale;
  /** catalogue entry chosen — a canonical tag such as "fa" or "pt-BR|pt-PT|pt" */
  tag: string;
  /** the language the person sees in the list */
  language: Language;
  /** true when following the device */
  auto: boolean;
  ready: boolean;
  /** strings that arrived from the model, keyed by tag then key */
  remote: Strings;
  hydrate: () => void;
  choose: (value: string | "auto") => void;
  /** asks the server for the keys this screen is about to draw */
  ensureStrings: (keys: Record<string, string>) => Promise<void>;
  /** true while a translation request is in flight */
  translating: boolean;
};

/**
 * Which bundled dictionary backs a language. Remote languages start from
 * English — the fallback — and are replaced key by key as translations land.
 */
function bundledFor(tag: string): Locale {
  const primary = primaryTag(tag).replace(/_/g, "-");
  const lower = primary.toLowerCase();
  if (lower === "pt-br" || lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("fr")) return "fr";
  if (lower.startsWith("de")) return "de";
  if (lower.startsWith("it")) return "it";
  if (lower.startsWith("nl")) return "nl";
  if (lower.startsWith("pl")) return "pl";
  if (lower.startsWith("tr")) return "tr";
  if (lower.startsWith("ru")) return "ru";
  if (lower.startsWith("uk")) return "uk";
  if (lower.startsWith("ar")) return "ar";
  if (lower.startsWith("hi")) return "hi";
  if (lower.startsWith("id")) return "id";
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("ko")) return "ko";
  if (lower.startsWith("zh")) return "zh";
  if (lower.startsWith("vi")) return "vi";
  if (lower.startsWith("th")) return "th";
  if (lower.startsWith("he") || lower.startsWith("iw")) return "he";
  return "en";
}

/** The 20 languages with hand-written dictionaries never need the server. */
const BUNDLED = new Set([
  "pt-BR", "en", "es", "fr", "de", "it", "nl", "pl",
  "tr", "ru", "uk", "ar", "hi", "id", "ja", "ko", "zh", "vi", "th", "he",
]);

export const isBundled = (tag: string) => BUNDLED.has(bundledFor(tag)) && primaryTag(tag) === bundledFor(tag);

function languageOf(tag: string): Language {
  return (
    LANGUAGE_BY_TAG.get(tag) ?? {
      tag,
      native: tag,
      name: tag,
    }
  );
}

/**
 * Mirrors the choice into a cookie.
 *
 * localStorage is per-origin, so the download page (its own project, its own
 * host) cannot read it. A first-party cookie on the parent domain would be
 * better, but vercel.app is a public suffix: browsers refuse a cookie for
 * "vercel.app". The page therefore falls back to English for the two letters,
 * which is what an international page should default to anyway.
 */
function rememberCookie(tag: string) {
  if (typeof document === "undefined") return;
  document.cookie = `keew_locale=${encodeURIComponent(primaryTag(tag))}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Applies the language to <html>, for hyphenation and screen readers.
 *
 * The direction is always LTR, on purpose. Ten of the 183 languages are
 * right-to-left (Arabic, Hebrew, Persian, Urdu…), and flipping the document
 * was making the whole interface mirror: the mark jumped to the right of the
 * wordmark, turning "Keen IA" into "IA Keen", and the language list reversed
 * row by row. A page can only be properly mirrored if every margin, icon,
 * shadow and animation has an RTL counterpart, and this one has none — so the
 * flip was half a mirror, which reads as broken.
 *
 * Right-to-left *text* still renders correctly: the bidi algorithm mirrors the
 * glyphs inside a left-aligned line. What no longer happens is the layout
 * turning inside out.
 */
function applyDocument(language: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = primaryTag(language.tag);
  document.documentElement.dir = "ltr";
}

export const useLocale = create<State>()((set, get) => ({
  locale: "en",
  tag: "en",
  language: languageOf("en"),
  auto: true,
  ready: false,
  remote: {},
  translating: false,

  hydrate: () => {
    if (get().ready) return;
    let auto = true;
    let saved: string | null = null;
    try {
      auto = localStorage.getItem("keew-ia-locale-auto") !== "0";
      saved = localStorage.getItem("keew-ia-locale");
    } catch {
      /* storage blocked */
    }

    /* an explicit choice that still resolves in the catalogue wins */
    const explicit = !auto ? canonicalTag(saved) : null;
    const tag = explicit ?? detectLocaleTag();
    const language = languageOf(tag);
    const locale = bundledFor(tag);

    set({ locale, tag, language, auto, ready: true });
    applyDocument(language);
    rememberCookie(tag);

    /* cached translations for this language, if the browser has them */
    try {
      const raw = localStorage.getItem(`keew-ia-strings:${tag}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        set({ remote: { ...get().remote, [tag]: parsed } });
      }
    } catch {
      /* storage blocked or corrupt */
    }
  },

  choose: (value) => {
    const auto = value === "auto";
    const tag = auto ? detectLocaleTag() : canonicalTag(value) ?? "en";
    const language = languageOf(tag);
    const locale = bundledFor(tag);

    set({ locale, tag, language, auto });
    applyDocument(language);
    rememberCookie(tag);

    try {
      localStorage.setItem("keew-ia-locale", auto ? "" : tag);
      localStorage.setItem("keew-ia-locale-auto", auto ? "1" : "0");
    } catch {
      /* storage blocked */
    }

    const sb = supabaseBrowser();
    if (!sb) return;
    void sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        /* the profile stores the primary subtag, which fits any language */
        void sb.from("profiles").update({ locale: primaryTag(tag) }).eq("id", data.user.id);
      }
    });
  },

  ensureStrings: async (keys) => {
    const { tag, remote, translating } = get();
    /* the 20 bundled languages are complete; asking would be waste */
    if (isBundled(tag)) return;
    if (translating) return;

    const have = remote[tag] ?? {};
    const wanted: Record<string, string> = {};
    for (const [key, english] of Object.entries(keys)) {
      if (!have[key]) wanted[key] = english;
    }
    if (!Object.keys(wanted).length) return;

    set({ translating: true });
    try {
      const res = await fetch("/api/i18n", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lang: tag, locale: primaryTag(tag), keys: wanted }),
      });
      if (!res.ok && res.status !== 429) return;
      const data = (await res.json()) as { strings?: Record<string, string> };
      const strings = data.strings ?? {};
      if (!Object.keys(strings).length) return;

      const merged = { ...(get().remote[tag] ?? {}), ...strings };
      set({ remote: { ...get().remote, [tag]: merged } });

      /* remembered so a reload does not pay for the same strings twice */
      try {
        localStorage.setItem(`keew-ia-strings:${tag}`, JSON.stringify(merged));
      } catch {
        /* the quota is small; losing the cache only costs another request */
      }
    } catch {
      /* offline: English stays, which is the documented fallback */
    } finally {
      set({ translating: false });
    }
  },
}));

/**
 * The device's language, resolved against the catalogue. detectLocale() knows
 * the 20 bundled ones by subtag; this extends the same ideas to the rest.
 */
function detectLocaleTag(): string {
  if (typeof navigator !== "undefined") {
    const list = navigator.languages?.length
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : [];
    for (const raw of list) {
      /* exact tag first: pt-BR, zh-TW, sr-Latn */
      const exact = canonicalTag(raw);
      if (exact) return exact;
      /* then the base language: "fr-CA" → "fr" */
      const base = canonicalTag(raw.split(/[-_]/)[0]);
      if (base) return base;
    }
  }
  return detectLocale();
}
