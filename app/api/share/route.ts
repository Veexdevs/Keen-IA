/**
 * POST /api/share
 * ═══════════════════════════════════════════════════════════════════════════
 * Publica uma resposta da IA numa página só dela e devolve o link.
 *
 *   { text, lang?, title? } → { id, url }
 *
 * Por que uma tabela própria e não `messages`: uma resposta compartilhada tem
 * de abrir sem login, e a tabela de mensagens é fechada por RLS a quem é dono
 * da conversa. Publicar é um ato explícito, então ela vira uma cópia numa
 * tabela de leitura pública — com id aleatório, sem vínculo que permita achar
 * o resto da conversa.
 *
 * O que NUNCA vai junto: o resto da conversa, o email de quem compartilhou e
 * o id original da mensagem. Quem abre o link vê o texto e mais nada.
 */
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient, getStoredEngine } from "@/lib/supabase/admin";
import { tooMany } from "@/lib/rate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 20 kB é uma resposta longa; acima disso o link fica ruim de ler mesmo. */
const MAX_TEXT = 20_000;

type Shared = {
  id: string;
  text: string;
  lang: string;
  title: string;
  created_at: string;
};

/**
 * O armazenamento dos compartilhamentos.
 *
 * Duas camadas, de propósito:
 *
 *   1. a tabela `shared_answers` no Supabase, quando há banco — é o que faz o
 *      link funcionar em qualquer aparelho e sobreviver a um deploy;
 *   2. `private.app_config`, chave `share:<id>`, como reserva quando o banco
 *      não está configurado. Serve ao dono que roda a Keen sem Supabase: o
 *      link só abre enquanto aquela instância existir.
 *
 * Sem nenhuma das duas, a rota diz `no-store` em vez de entregar um link que
 * não abre — um link morto é pior que um botão que explica.
 */
async function save(entry: Shared): Promise<"ok" | "no-store" | "failed"> {
  const sb = createAdminClient();
  if (!sb) return "no-store";

  try {
    const { error } = await (sb as unknown as {
      from: (t: string) => { insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
    })
      .from("shared_answers")
      .insert({
        id: entry.id,
        text: entry.text,
        lang: entry.lang,
        title: entry.title,
        created_at: entry.created_at,
      });
    if (!error) return "ok";
  } catch {
    /* cai para a reserva abaixo */
  }

  /* reserva: a mesma tabela privada que guarda o motor */
  try {
    const { error } = await (sb as unknown as {
      from: (t: string) => {
        upsert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      };
    })
      .from("app_config")
      .upsert({ id: `share:${entry.id}`, value: entry, updated_at: entry.created_at });
    return error ? "failed" : "ok";
  } catch {
    return "failed";
  }
}

/** Um id curto e aleatório: 10 caracteres base32 dão ~50 bits. Chutar não paga. */
function newId(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function POST(req: NextRequest) {
  if (tooMany(req, "share", 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  let body: { text?: string; lang?: string; title?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const text = (body.text ?? "").trim().slice(0, MAX_TEXT);
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const entry: Shared = {
    id: newId(),
    text,
    lang: typeof body.lang === "string" ? body.lang.slice(0, 12) : "en",
    title: (body.title ?? "").toString().trim().slice(0, 120),
    created_at: new Date().toISOString(),
  };

  const saved = await save(entry);
  if (saved === "no-store") {
    return NextResponse.json({ error: "no-store" }, { status: 503 });
  }
  if (saved === "failed") {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }

  /* a origem vem do pedido: funciona no domínio de produção, no preview da
     Vercel e em localhost sem precisar de mais uma variável de ambiente */
  const origin = req.headers.get("origin") || new URL(req.url).origin;
  return NextResponse.json({ id: entry.id, url: `${origin}/s/${entry.id}` });
}

/* Confirma que o motor está de pé, para o botão explicar o que falta. */
export async function GET() {
  const envKey = (process.env.KEEW_MODEL_API_KEY || "").trim();
  let stored = null;
  if (!envKey) {
    try {
      stored = await getStoredEngine();
    } catch {
      stored = null;
    }
  }
  return NextResponse.json({ ready: Boolean(envKey || stored) });
}
