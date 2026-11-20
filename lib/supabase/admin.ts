/**
 * The server-only Supabase client.
 *
 * `SUPABASE_SERVICE_ROLE_KEY` bypasses row level security, so it must never
 * reach the browser. Next.js only inlines variables prefixed with NEXT_PUBLIC_,
 * and this module is imported exclusively from route handlers — but the name
 * deliberately has no prefix as a second guard: even if someone imported it
 * from a component by mistake, the value would be `undefined` in the bundle
 * rather than a working master key.
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient<Database>(url, key, {
    auth: {
      /* no session to keep: this client acts on behalf of the server */
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/** The little of the query builder these helpers need, typed loosely on purpose. */
type SupaLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { value: unknown } | null; error: unknown }>;
      };
    };
    upsert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

/**
 * The model engine the server was given, if any.
 *
 * It lives in `private.app_config` — a schema PostgREST does not expose, so the
 * anon key cannot reach it even if someone finds the table name. That is what
 * makes it acceptable to keep a model key in the database instead of asking the
 * owner to edit environment variables.
 */
export async function getStoredEngine(): Promise<{
  key?: string;
  baseUrl?: string;
  model?: string;
} | null> {
  const sb = createAdminClient();
  if (!sb) return null;
  const { data, error } = await (sb as unknown as SupaLike)
    .from("app_config")
    .select("value")
    .eq("id", "model")
    .maybeSingle();
  if (error || !data) return null;
  const value = data.value;
  return value && typeof value === "object" ? (value as { key?: string }) : null;
}

/** Writes the engine settings. Server-only, by the same argument as above. */
export async function setStoredEngine(value: {
  key: string;
  baseUrl: string | null;
  model: string | null;
  setAt: string;
}): Promise<string | null> {
  const sb = createAdminClient();
  if (!sb) return "no-database";
  const { error } = await (sb as unknown as SupaLike)
    .from("app_config")
    .upsert({ id: "model", value, updated_at: value.setAt });
  if (!error) return null;
  /* "fetch failed" is what an unreachable database looks like: the network
     dropped, not the write refused. Saying so is the difference between a
     person checking their key and a person checking their connection. */
  return /fetch failed|network|enotfound/i.test(error.message) ? "unreachable" : error.message;
}

/**
 * Turns a GoTrue message into an error code the interface can translate.
 *
 * GoTrue's wording changes between versions ("User already registered",
 * "already been registered", …), so match on meaning instead of one string.
 */
export function toAuthError(message: string): {
  status: number;
  code: "exists" | "weak-password" | "invalid-email" | "unavailable" | "unknown";
} {
  const m = message.toLowerCase();

  if (m.includes("already") && (m.includes("registered") || m.includes("exists"))) {
    return { status: 409, code: "exists" };
  }
  if (m.includes("password")) {
    return { status: 400, code: "weak-password" };
  }
  if (m.includes("email") && (m.includes("invalid") || m.includes("valid"))) {
    return { status: 400, code: "invalid-email" };
  }
  /* the project is paused, the key expired, or Supabase is down */
  if (m.includes("fetch") || m.includes("network") || m.includes("enotfound")) {
    return { status: 502, code: "unavailable" };
  }
  return { status: 500, code: "unknown" };
}
