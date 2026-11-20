/**
 * Keen IA — on-demand interface translation.
 *
 * 181 languages cannot be hand-written. They are translated by the same model
 * engine the chat uses, one batch at a time, and cached in Supabase so the cost
 * is paid once per language instead of once per visitor.
 *
 * The contract with the client is deliberately simple: give me a language and
 * the keys you are about to render, get back the ones that exist. A key that is
 * missing or empty is not an error — the client already falls back to English,
 * and the next batch will pick it up. A half-translated interface is a normal
 * state here, not a failure.
 *
 * Why batches are small: a serverless function has a time budget and a model
 * call has a latency curve. Returning 40 finished strings beats returning 310
 * half-written ones.
 */
import { createAdminClient, getStoredEngine } from "@/lib/supabase/admin";
import { isConfigured, resolveConfig, streamChat, type StreamFrame } from "@/lib/provider";

/** How many strings go into one model call. */
const BATCH = 40;

/** Cache table, created by supabase/schema-i18n.sql. */
const TABLE = "i18n_strings";

/** Nothing here is user-specific: an hour of cache is plenty and cheap. */
export const CACHE_SECONDS = 3600;

export type Translated = Record<string, string>;

/** What the model is translating: key → English text. */
export type Source = Record<string, string>;

/**
 * The prompt is written once and reused for every batch. It is short because it
 * is paid for on every call, and strict because a model that adds a sentence of
 * commentary would corrupt the JSON contract.
 */
function systemPrompt(languageName: string, native: string) {
  return [
    `You translate user-interface strings into ${languageName} (${native}).`,
    "The input is a JSON object of key → English text.",
    "Reply with ONLY a JSON object with the same keys and translated values.",
    "Rules: keep placeholders like {name} {n} {reason} {text} {count} exactly as they are;",
    "keep the tone short and plain, the way buttons and labels read;",
    "never translate the product name Keen;",
    "if a string is a language or country name, use the standard name in that language.",
    "No markdown fences, no explanation, nothing before or after the JSON.",
  ].join(" ");
}

/** Pulls the first JSON object out of whatever the model wrapped it in. */
function parseObject(raw: string): Translated | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const out: Translated = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && v.trim()) out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}

/** Reads the cached strings for a language, for the keys that were asked for. */
export async function readCache(tag: string, locale: string): Promise<Translated> {
  const sb = createAdminClient();
  if (!sb) return {};
  const { data, error } = await sb
    .from(TABLE)
    .select("key,value")
    .eq("locale", locale)
    .eq("lang", tag);
  if (error || !data) return {};
  const out: Translated = {};
  for (const row of data as { key: string; value: string }[]) {
    if (row.value) out[row.key] = row.value;
  }
  return out;
}

async function writeCache(tag: string, locale: string, strings: Translated) {
  const sb = createAdminClient();
  if (!sb) return;
  const rows = Object.entries(strings).map(([key, value]) => ({
    lang: tag,
    locale,
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  // A failed cache write is not a failed request: the caller already has the
  // strings, and the next visitor simply pays for the translation again.
  await sb.from(TABLE).upsert(rows, { onConflict: "lang,locale,key" }).then(
    () => undefined,
    () => undefined,
  );
}

/** Collects a model stream into one string. */
async function collect(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const frame = JSON.parse(payload) as StreamFrame;
        if (frame.t === "text") text += frame.v;
        if (frame.t === "error") throw new Error(frame.v);
      } catch {
        /* a frame we cannot read is skipped, not fatal */
      }
    }
  }
  return text;
}

export type TranslateResult =
  | { ok: true; strings: Translated; translated: number }
  | { ok: false; reason: "no-engine" | "model-failed" | "bad-output" };

/**
 * Translates the requested keys that are not cached yet.
 *
 * `known` is what the client already has — sending it avoids paying twice for
 * strings that were translated on an earlier screen.
 */
export async function translateMissing(
  tag: string,
  languageName: string,
  native: string,
  locale: string,
  wanted: Source,
): Promise<TranslateResult> {
  /*
   * The key can live in three places, in this order: the server environment (a
   * deployment that wants no setup step), the database (connected through
   * /api/i18n/setup), and the caller's own key (the browser never sends one
   * here — translation is the product's cost, not the visitor's).
   */
  const stored = await getStoredEngine();
  const config = stored?.key
    ? resolveConfig(stored.key, stored.baseUrl ?? undefined, stored.model ?? undefined)
    : resolveConfig();
  if (!isConfigured(config)) return { ok: false, reason: "no-engine" };

  const strings: Translated = {};
  const pending = Object.keys(wanted).slice(0, BATCH);
  if (!pending.length) return { ok: true, strings, translated: 0 };

  const subset: Source = {};
  for (const k of pending) subset[k] = wanted[k];

  let raw: string;
  try {
    raw = await collect(
      streamChat({
        config,
        system: systemPrompt(languageName, native),
        messages: [{ role: "user", content: JSON.stringify(subset) }],
        // translation wants consistency, not creativity
        temperature: 0.2,
        maxTokens: 2048,
      }),
    );
  } catch {
    return { ok: false, reason: "model-failed" };
  }

  const parsed = parseObject(raw);
  if (!parsed) return { ok: false, reason: "bad-output" };

  // Only keep keys we actually asked for: a model that invents keys or renames
  // them must not be able to put text on screen that no component asked for.
  for (const k of pending) {
    if (parsed[k]) strings[k] = parsed[k];
  }

  if (Object.keys(strings).length) await writeCache(tag, locale, strings);
  return { ok: true, strings, translated: Object.keys(strings).length };
}
