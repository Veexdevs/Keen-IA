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
