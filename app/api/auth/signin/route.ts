/**
 * POST /api/auth/signin — password login with a readable failure.
 *
 * GoTrue already does this, and the browser can call it directly. This route
 * exists for three reasons, all about the person in front of the screen:
 *
 * 1. The browser client reports transport failures (paused project, blocked
 *    request, wrong URL) with the same "Invalid login credentials" the real
 *    wrong-password case uses. This route keeps the two apart.
 * 2. The session must be written as cookies the server can read. Returning the
 *    token pair here means the browser hands it to `setSession`, and
 *    `@supabase/ssr` writes the cookies in one known place.
 * 3. A failure here can say *why* in the account's own language, because the
 *    interface gets an error code instead of an English sentence.
 */
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { tooMany } from "@/lib/rate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { email?: unknown; password?: unknown };

export async function POST(request: NextRequest) {
  /* password guessing: twenty tries an hour is already generous */
  if (tooMany(request, "signin", 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const sb = createAdminClient();
  if (!sb) {
    return NextResponse.json(
      { error: "no-database", message: "Sign-in is not configured on this deployment." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    const m = error.message.toLowerCase();

    /*
     * "Email not confirmed" is not a dead end: confirmation is switched off on
     * this project, so an unconfirmed address is either an account created
     * before that setting changed, or one made by the old flow. Confirming it
     * here is the difference between "sign in failed" and the person getting in.
     */
    if (m.includes("not confirmed")) {
      const { data: found } = await sb.auth.admin.listUsers();
      const user = found?.users.find((u) => u.email?.toLowerCase() === email);
      if (user) {
        const { error: confirmError } = await sb.auth.admin.updateUserById(user.id, {
          email_confirm: true,
        });
        if (!confirmError) {
          const retry = await sb.auth.signInWithPassword({ email, password });
          if (!retry.error && retry.data.session) {
            return NextResponse.json({ ok: true, session: retry.data.session });
          }
        }
      }
      return NextResponse.json({ error: "unconfirmed" }, { status: 401 });
    }

    if (m.includes("invalid") && m.includes("credentials")) {
      return NextResponse.json({ error: "wrong-credentials" }, { status: 401 });
    }
    if (m.includes("rate") || m.includes("too many")) {
      return NextResponse.json({ error: "rate-limited" }, { status: 429 });
    }
    if (m.includes("fetch") || m.includes("network") || m.includes("enotfound")) {
      return NextResponse.json({ error: "unavailable" }, { status: 502 });
    }

    return NextResponse.json({ error: "unknown", message: error.message }, { status: 500 });
  }

  if (!data.session) {
    return NextResponse.json({ error: "no-session" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, session: data.session });
}
