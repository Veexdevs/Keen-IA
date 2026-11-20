/**
 * POST /api/i18n
 * ═══════════════════════════════════════════════════════════════════════════
 * Translates interface strings on demand.
 *
 *   { lang: "fa", locale: "fa", keys: ["chat.new", "chat.send", …] }
 *   → { strings: { "chat.new": "گفتگوی تازه", … }, remaining: 270 }
 *
 * The client sends only what it is about to draw, so a corner of the app can
 * become usable in a language without waiting for all 310 strings. `remaining`
 * tells it how much is still untranslated, which is what decides whether the
 * "translating…" hint stays on screen.
 *
 * Translation is public and idempotent, but it costs a model call, so the rate
 * limit is per address and generous enough for a person switching languages
 * twice.
 */
import { NextResponse, type NextRequest } from "next/server";

import { canonicalTag, LANGUAGE_BY_TAG, primaryTag } from "@/lib/i18n/languages";
import { readCache, translateMissing, type Source } from "@/lib/i18n/remote";
import { tooMany } from "@/lib/rate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Longest run allowed before the client has to come back for more. */
const MAX_KEYS = 60;

type Body = {
  lang?: string;
  locale?: string;
  keys?: Source;
};

export async function POST(req: NextRequest) {
  if (tooMany(req, "i18n", 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const tag = canonicalTag(body.lang);
  const language = tag ? LANGUAGE_BY_TAG.get(tag) : undefined;
  if (!tag || !language) {
    return NextResponse.json({ error: "unknown-language" }, { status: 400 });
  }

  const wanted: Source = {};
  for (const [key, value] of Object.entries(body.keys ?? {})) {
    /* keys come from the browser: keep them shaped like ours, refuse the rest */
    if (typeof value === "string" && value && key.length < 80 && Object.keys(wanted).length < MAX_KEYS) {
      wanted[key] = value;
    }
  }

  if (!Object.keys(wanted).length) {
    return NextResponse.json({ strings: {}, cached: 0, translated: 0, remaining: 0 });
  }

  const cacheKey = primaryTag(tag);
  const cached = await readCache(tag, cacheKey);

  const missing: Source = {};
  for (const [key, value] of Object.entries(wanted)) {
    if (!cached[key]) missing[key] = value;
  }

  if (!Object.keys(missing).length) {
    const strings: Record<string, string> = {};
    for (const key of Object.keys(wanted)) strings[key] = cached[key];
    return NextResponse.json({ strings, cached: Object.keys(strings).length, translated: 0, remaining: 0 });
  }

  const result = await translateMissing(tag, language.name, language.native, cacheKey, missing);

  if (!result.ok) {
    /* Everything we do have still goes to the client: partial beats nothing. */
    const partial: Record<string, string> = {};
    for (const key of Object.keys(wanted)) if (cached[key]) partial[key] = cached[key];
    return NextResponse.json(
      { strings: partial, error: result.reason, remaining: Object.keys(missing).length },
      { status: result.reason === "no-engine" ? 503 : 502 },
    );
  }

  const strings: Record<string, string> = {};
  for (const key of Object.keys(wanted)) {
    const value = cached[key] ?? result.strings[key];
    if (value) strings[key] = value;
  }

  return NextResponse.json(
    {
      strings,
      cached: Object.keys(cached).length,
      translated: result.translated,
      remaining: Math.max(0, Object.keys(missing).length - result.translated),
    },
    { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } },
  );
}
