/**
 * POST /api/i18n/setup
 * ═══════════════════════════════════════════════════════════════════════════
 * Connects the translation engine.
 *
 * The 161 languages that are not hand-written need a model to translate them,
 * and the model needs a key. Until this runs, choosing Wolof shows English with
 * a "no-engine" note — honest, but not what the language list promises.
 *
 *   { key: "…" }                         → stores it, returns the languages it can now translate
 *   { key: "…", baseUrl: "…", model: "…" } → same, for an OpenAI-compatible endpoint
 *
 * Who may call it: the first caller, or anyone presenting KEEW_SETUP_TOKEN.
 * The first-caller rule is what makes this usable on a fresh deployment without
 * anyone pasting secrets into a terminal; the token is what closes the door
 * afterwards. Both paths are written down here rather than implied.
 *
 * The key is written with the service role into `private.app_config`, a table
 * with row level security and no policy: unreadable from the browser with the
 * anon key, which is what makes storing it in the database acceptable.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getStoredEngine, setStoredEngine } from "@/lib/supabase/admin";
import { isConfigured, resolveConfig } from "@/lib/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  key?: string;
  baseUrl?: string;
  model?: string;
};

/** True once a key has been stored: the one-time window is closed. */
async function isClaimed(): Promise<boolean> {
  const stored = await getStoredEngine();
  return Boolean(stored?.key);
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const key = (body.key ?? "").trim();
  if (key.length < 12) {
    return NextResponse.json({ error: "missing-key" }, { status: 400 });
  }

  /* a token in the environment means the owner wants a door on this */
  const required = (process.env.KEEW_SETUP_TOKEN ?? "").trim();
  if (required) {
    const sent = (req.headers.get("x-keew-setup-token") ?? "").trim();
    if (sent !== required) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } else if (await isClaimed()) {
    /* already configured and no token set: refuse rather than let anyone
       replace the key of a working deployment */
    return NextResponse.json({ error: "already-configured" }, { status: 409 });
  }

  const value = {
    key,
    baseUrl: (body.baseUrl ?? "").trim() || null,
    model: (body.model ?? "").trim() || null,
    setAt: new Date().toISOString(),
  };

  const failure = await setStoredEngine(value);
  if (failure === "no-database") {
    return NextResponse.json({ error: "no-database" }, { status: 503 });
  }
  if (failure === "unreachable") {
    return NextResponse.json({ error: "database-unreachable" }, { status: 503 });
  }
  if (failure) {
    return NextResponse.json({ error: "write-failed", message: failure }, { status: 500 });
  }

  /* prove it works before saying it does: the same config the chat would use */
  const configured = isConfigured(resolveConfig(key));
  return NextResponse.json({ ok: true, engine: configured });
}
