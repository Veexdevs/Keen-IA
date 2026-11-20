/**
 * GET /api/share/[id] — a resposta pública, em JSON.
 *
 * A leitura vive em lib/share.ts, porque a página `/s/[id]` é um Server
 * Component e importa a mesma função — e o Next só aceita handlers exportados
 * de um arquivo de rota. O id é a única chave: não há lista, nem busca, nem
 * vizinhança.
 */
import { NextResponse } from "next/server";

import { readShared } from "@/lib/share";
import { tooMany } from "@/lib/rate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (tooMany(_req, "share-read", 240, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  const answer = await readShared(id);
  if (!answer) return NextResponse.json({ error: "not-found" }, { status: 404 });
  return NextResponse.json(answer, { headers: { "cache-control": "public, max-age=300" } });
}
