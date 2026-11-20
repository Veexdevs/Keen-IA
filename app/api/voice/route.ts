/**
 * POST /api/voice
 * ═══════════════════════════════════════════════════════════════════════════
 * Transcreve um ditado de voz.
 *
 *   multipart/form-data: audio=<wav>, locale=pt-BR
 *   → { text: "o que a pessoa falou" }
 *
 * O áudio vai para o mesmo motor que já responde o chat (`KEEW_MODEL_BASE_URL`
 * + `KEEW_MODEL_API_KEY`), no endpoint de transcrição no estilo OpenAI
 * (`/audio/transcriptions`, multipart com `file` e `model`). Isso evita uma
 * segunda chave e um segundo provedor só para voz.
 *
 * Erros são códigos, não frases: a interface traduz. `no-engine` é o caso que
 * importa — sem motor configurado, o botão precisa dizer que a transcrição
 * depende da chave, e não fingir que o microfone falhou.
 *
 * Privacidade: o áudio não é guardado em lugar nenhum, e a resposta não é
 * registrada. O ditado só vira texto dentro da caixa de mensagem.
 */
import { NextResponse, type NextRequest } from "next/server";

import { resolveConfig } from "@/lib/provider";
import { getStoredEngine } from "@/lib/supabase/admin";
import { tooMany } from "@/lib/rate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 3,2 MB ≈ 100 s de WAV 16 kHz mono, com folga sobre o minuto do cliente. */
const MAX_BYTES = 3_200_000;

/** Extensões que os provedores aceitam; o cliente manda wav, o resto é defesa. */
const OK_TYPE = /^(audio\/|application\/octet-stream$)/;

type Engine = { baseUrl: string; key: string; model: string };

/**
 * O motor de voz, na mesma ordem de prioridade do chat.
 *
 * A base e a chave vêm do `resolveConfig` — o mesmo que o chat usa, incluindo
 * o que o dono gravou pelo app em `private.app_config`. Assim conectar o motor
 * uma vez habilita conversa E ditado, sem uma segunda chave.
 *
 * O NOME do modelo é o único que não pode ser herdado: o do chat costuma ser
 * um raciocinador (`deepseek-reasoner`) e ele não transcreve áudio. Por isso
 * `KEEW_TRANSCRIBE_MODEL`, com `whisper-1` como padrão — é o nome que os
 * provedores compatíveis com OpenAI entendem.
 */
async function engine(): Promise<Engine | null> {
  let stored: { key?: string; baseUrl?: string; model?: string } | null = null;
  if (!(process.env.KEEW_MODEL_API_KEY || "").trim()) {
    try {
      stored = await getStoredEngine();
    } catch {
      stored = null;
    }
  }

  const cfg = resolveConfig(undefined, stored?.baseUrl, stored?.model);
  const baseUrl = (cfg.baseUrl || "").replace(/\/$/, "");
  const key = (cfg.apiKey || "").trim();
  if (!baseUrl || !key) return null;

  const model = (process.env.KEEW_TRANSCRIBE_MODEL || "").trim() || "whisper-1";
  return { baseUrl, key, model };
}

export async function POST(req: NextRequest) {
  if (tooMany(req, "voice", 40, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const cfg = await engine();
  if (!cfg) {
    /* Sem chave não há transcrição: dizer isso é melhor que um 500 opaco. */
    return NextResponse.json({ error: "no-engine" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid-form" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "no-audio" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too-long" }, { status: 413 });
  }
  if (file.type && !OK_TYPE.test(file.type)) {
    return NextResponse.json({ error: "bad-type" }, { status: 415 });
  }

  /* A dica de idioma ajuda o modelo a não "traduzir" o ditado para inglês.
     Vem do dicionário da interface, ex.: pt-BR → "pt". */
  const locale = (form.get("locale") || "").toString().slice(0, 12);
  const language = /^[a-z]{2}(-|$)/i.test(locale) ? locale.split(/[-_]/)[0].toLowerCase() : "";

  const model = cfg.model || "whisper-1";

  const out = new FormData();
  out.append("file", file, file.name || "ditado.wav");
  out.append("model", model);
  if (language) out.append("language", language);
  /* verbose_json dá a duração e o idioma detectado; json só o texto. O texto é
     tudo que a interface usa, então fica no formato mais aceito. */
  out.append("response_format", "json");

  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.key}` },
      body: out,
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }

  if (!res.ok) {
    /* 401/403 do provedor é chave errada; 404 é modelo que não existe lá. Os
       dois precisam chegar distintos para a interface dizer o que arrumar. */
    const status = res.status === 401 || res.status === 403 ? 401 : res.status === 404 ? 404 : 502;
    return NextResponse.json(
      { error: status === 401 ? "bad-key" : status === 404 ? "bad-model" : "unavailable" },
      { status },
    );
  }

  const data = (await res.json().catch(() => null)) as { text?: string } | null;
  const text = (data?.text || "").trim();
  if (!text) {
    /* Silêncio transcrito é texto vazio, não erro do microfone. */
    return NextResponse.json({ text: "", empty: true });
  }

  return NextResponse.json({ text });
}
