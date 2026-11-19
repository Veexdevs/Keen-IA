/**
 * POST /api/connectors/github
 *
 * A thin pass-through for GitHub reads, used only when a call cannot be made
 * from the browser (for example behind a restrictive CSP). The token arrives
 * with the request, is used for that one call, and is never stored.
 */
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = [
  /^\/user$/,
  /^\/user\/repos\?/,
  /^\/repos\/[^/]+\/[^/]+$/,
  /^\/repos\/[^/]+\/[^/]+\/issues\?/,
  /^\/repos\/[^/]+\/[^/]+\/contents\//,
  /^\/search\/repositories\?/,
];

export async function POST(req: NextRequest) {
  let body: { token?: string; path?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = (body.token || "").trim();
  const path = body.path || "";

  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });
  if (!ALLOWED.some((re) => re.test(path))) {
    return Response.json({ error: "That GitHub path is not allowed." }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "user-agent": "keew-ia",
      },
      cache: "no-store",
    });

    if (res.status === 401) {
      return Response.json({ error: "GitHub rejected that token." }, { status: 401 });
    }
    if (!res.ok) {
      return Response.json({ error: `GitHub answered ${res.status}.` }, { status: 502 });
    }

    return Response.json({ data: await res.json() });
  } catch {
    return Response.json({ error: "Could not reach GitHub." }, { status: 502 });
  }
}
