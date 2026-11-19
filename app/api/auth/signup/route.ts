/**
 * POST /api/auth/signup — create an account, without the e-mail bottleneck.
 *
 * Why this exists. The browser calls `auth.signUp` through GoTrue, and GoTrue
 * sends a confirmation e-mail on every signup. On the free plan that mailer is
 * capped at two messages an hour for the whole project: the third person to
 * sign up gets a 429 and no account. Confirmation is already disabled here
 * (`mailer_autoconfirm`), so that e-mail was pure waste — it was only being
 * sent and rate-limiting real people.
 *
 * So the account is created with the admin API instead: same `auth.users`
 * table, same password hashing, same triggers, same RLS — except the mailer is
 * never involved. The password is hashed by GoTrue, not here: this route only
 * forwards it.
 *
 * The service key stays on the server. It is never sent to the browser and is
 * required: without it the route refuses, and the client falls back to the
 * regular signUp.
 */
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient, toAuthError } from "@/lib/supabase/admin";
import { tooMany } from "@/lib/rate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { email?: unknown; password?: unknown; name?: unknown };

export async function POST(request: NextRequest) {
  /*
   * An open signup endpoint is an invitation to fill the database. Ten
   * accounts per address per hour is far above what a person needs and far
   * below what a script wants.
   */
  if (tooMany(request, "signup", 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "no-admin-key", message: "Account creation is not configured on this deployment." },
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
  const name = typeof body.name === "string" ? body.name.trim() : "";

  /* same rules the form applies, checked again where it counts */
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "invalid-email" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "weak-password" }, { status: 400 });
  }
  if (password.length > 72) {
    /* bcrypt silently truncates past 72 bytes; refuse instead of half-using it */
    return NextResponse.json({ error: "long-password" }, { status: 400 });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    /* set directly: no confirmation mail, so the account works immediately */
    email_confirm: true,
    user_metadata: name ? { full_name: name } : undefined,
  });

  if (error) {
    const { status, code } = toAuthError(error.message);
    return NextResponse.json({ error: code, message: error.message }, { status });
  }

  return NextResponse.json({
    ok: true,
    user: { id: data.user?.id, email: data.user?.email },
  });
}
