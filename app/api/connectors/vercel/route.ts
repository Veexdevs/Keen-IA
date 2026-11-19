/**
 * POST /api/connectors/vercel
 *
 * Vercel's API sends no CORS headers, so a browser cannot call it directly.
 * This route forwards one read-only request with the user's own token.
 *
 * The token is used for that single call and never stored, never logged.
 */
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = (body.token || "").trim();
  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });

  try {
    const res = await fetch("https://api.vercel.com/v9/projects?limit=100", {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      return Response.json({ error: "Vercel rejected that token." }, { status: 401 });
    }
    if (!res.ok) {
      return Response.json({ error: `Vercel answered ${res.status}.` }, { status: 502 });
    }

    const data = await res.json();
    const projects = (data.projects ?? []).map(
      (p: { name?: string; framework?: string | null; updatedAt?: number }) => ({
        name: p.name ?? "",
        framework: p.framework ?? null,
        updatedAt: p.updatedAt ?? null,
      }),
    );

    return Response.json({ projects: projects.length, list: projects.slice(0, 50) });
  } catch {
    return Response.json({ error: "Could not reach Vercel." }, { status: 502 });
  }
}
