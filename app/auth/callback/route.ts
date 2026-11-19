/**
 * GET /auth/callback
 *
 * Where OAuth providers send people back. Exchanges the one-time code for a
 * session, writes the session cookies, then returns the person to the chat.
 *
 * A failure here returns to the app with ?auth=error so the interface can say
 * what went wrong instead of silently landing on a logged-out screen.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");

  const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  if (error) {
    return NextResponse.redirect(`${origin}/?auth=error&reason=${encodeURIComponent(error)}`);
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supaUrl || !supaKey) {
    return NextResponse.redirect(`${origin}/?auth=error&reason=no-database`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=error&reason=missing-code`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerClient<Database>(supaUrl, supaKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/?auth=error&reason=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  return response;
}
