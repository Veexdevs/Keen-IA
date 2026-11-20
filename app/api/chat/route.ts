/**
 * POST /api/chat
 * ═════════════════════════════════════════════════════════════════════════════
 * O único endpoint da interface. Ordem:
 *
 *   1. núcleo local — conta, data, unidade, texto e conhecimento, instantâneo
 *   2. motor — quando há um modelo conectado, a resposta é transmitida
 *   3. honestidade — sem motor, a Keen diz o que não consegue fazer, em vez de
 *      inventar. Foi a lição mais importante do projeto.
 *
 * Resposta: SSE com frames { t: "text" | "sources" | "error" | "done" }.
 */
import type { NextRequest } from "next/server";

import { KEEW_CORPUS, buildIndex, search, toContext } from "@/lib/knowledge";
import { reason } from "@/lib/local-engine";
import { extractCitations } from "@/lib/citations";
import { isConfigured, resolveConfig, streamChat, type StreamFrame } from "@/lib/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  messages: { role: "user" | "assistant"; content: string }[];
  mode?: "auto" | "local";
};

const enc = (o: StreamFrame) => `data: ${JSON.stringify(o)}\n\n`;

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const messages = (body.messages || []).filter(
    (m) => m && typeof m.content === "string" && m.content.trim(),
  );
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) {
    return new Response(JSON.stringify({ error: "Missing message" }), { status: 400 });
  }

  // chave do motor: vem do navegador a cada pedido, o servidor não guarda nada
  const callerKey = (req.headers.get("x-keew-engine-key") || "").trim();
  const config = resolveConfig(callerKey);
  const ready = isConfigured(config);
  const local = reason(last.content, KEEW_CORPUS);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (f: StreamFrame) => controller.enqueue(new TextEncoder().encode(enc(f)));

      // ── 1 · o núcleo resolve com confiança: resposta imediata ────────────
      if (local.terminal && local.confidence >= 0.8) {
        for (const chunk of split(local.answer, 40)) {
          emit({ t: "text", v: chunk });
          await pause(8);
        }
        if (local.skill === "knowledge") {
          const hits = search(buildIndex(KEEW_CORPUS), last.content, 3).map((d) => ({
            title: d.title,
            kind: "knowledge" as const,
          }));
          if (hits.length) emit({ t: "sources", v: hits });
        }
        emit({ t: "done" });
        controller.close();
        return;
      }

      // ── 2 · sem motor: dizer a verdade, não inventar ─────────────────────
      if (body.mode === "local" || !ready) {
        for (const chunk of split(local.answer, 40)) {
          emit({ t: "text", v: chunk });
          await pause(8);
        }
        emit({ t: "done" });
        controller.close();
        return;
      }

      // ── 3 · motor conectado: transmitir o raciocínio ─────────────────────
      const hits = search(buildIndex(KEEW_CORPUS), last.content, 4);
      const system = buildSystem(toContext(hits), local);

      let produced = "";
      let failed = false;

      try {
        const upstream = streamChat({
          messages: messages.slice(-20),
          system,
          temperature: 0.7,
          config,
        });
        const reader = upstream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            let frame: StreamFrame;
            try {
              frame = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }
            if (frame.t === "error") {
              failed = true;
              emit({ t: "text", v: `\n\n> ${frame.v}\n` });
              continue;
            }
            if (frame.t === "text") produced += frame.v;
            emit(frame);
          }
        }
      } catch {
        failed = true;
      }

      // ── 4 · resiliência: nunca deixar o usuário sem resposta ─────────────
      if (failed && !produced.trim()) {
        for (const chunk of split(reason(last.content, KEEW_CORPUS).answer, 40)) {
          emit({ t: "text", v: chunk });
          await pause(6);
        }
      }

      const sources = extractCitations(
        produced,
        hits.map((d) => ({ title: d.title, content: d.excerpt || d.content })),
      );
      if (sources.length) {
        emit({ t: "sources", v: sources.map((s) => ({ ...s, kind: s.kind ?? "web" })) });
      }

      emit({ t: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function buildSystem(context: string, local: ReturnType<typeof reason>) {
  const parts = [
    "You are Keen IA, the artificial intelligence built and owned by Veexdevs.",
    "Answer in English, directly, without filler and without introducing yourself in every message.",
    "Markdown format. Short headings, lists and tables when they help. Code in fenced blocks with a language.",
    "Never invent facts, numbers or sources. If you do not know, say exactly what is missing.",
  ];
  if (context) parts.push(`Documents from the Keen knowledge base:\n\n${context}`);
  if (local.answer && !local.terminal) parts.push(`Context from the local core:\n${local.answer}`);
  return parts.join("\n\n");
}

function split(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
