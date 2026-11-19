/**
 * Refreshes the Supabase session on every request.
 *
 * Without this the access token expires mid-session and the person is thrown
 * back to the login screen. It also hands the refreshed cookies to whatever
 * page is rendering, so a Server Component sees the same session.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // no database configured: the app runs in guest mode, nothing to refresh
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value } of list) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // touching getUser is what triggers the refresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // a signed-in person landing on the app after OAuth with ?code= in the URL
  const code = request.nextUrl.searchParams.get("code");
  if (code && !request.nextUrl.pathname.startsWith("/auth/callback")) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth/callback";
    redirect.searchParams.set("next", "/");
    return NextResponse.redirect(redirect);
  }

  void user;
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|mark.*svg|og.png|.*\\.(?:png|jpg|svg|ico|webp)$).*)",
  ],
};
