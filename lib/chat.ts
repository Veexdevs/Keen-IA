/**
 * Keen IA — estado da conversa.
 *
 * Um único chat, guardado no navegador. Nada de múltiplas conversas, pastas,
 * agentes ou configurações: a interface é uma tela de conversa e o resto é
 * decidido conversando.
 */
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "user" | "assistant";

export type Msg = {
  id: string;
  role: Role;
  content: string;
  /** ainda chegando do servidor */
  pending?: boolean;
  /** erro visível para o usuário */
  error?: string;
  /** fontes consultadas (links ou documentos) */
  sources?: { title: string; url?: string }[];
};

type State = {
  messages: Msg[];
  /** a resposta atual está sendo transmitida */
  streaming: boolean;

  send: (text: string) => Promise<void>;
  stop: () => void;
  regenerate: () => Promise<void>;
  clear: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

let controller: AbortController | null = null;

export const useChat = create<State>()(
  persist(
    (set, get) => ({
      messages: [],
      streaming: false,

      send: async (text: string) => {
        const clean = text.trim();
        if (!clean || get().streaming) return;
        await run([...get().messages, { id: uid(), role: "user", content: clean }], set);
      },

      regenerate: async () => {
        const all = get().messages;
        // remove a última resposta e refaz a partir da última pergunta
        const lastUser = [...all].reverse().find((m) => m.role === "user");
        if (!lastUser) return;
        const cut = all.findIndex((m) => m.id === lastUser.id);
        await run(all.slice(0, cut + 1), set);
      },

      stop: () => {
        controller?.abort();
        controller = null;
        set((s) => ({
          streaming: false,
          messages: s.messages.map((m) => (m.pending ? { ...m, pending: false } : m)),
        }));
      },

      clear: () => {
        controller?.abort();
        controller = null;
        set({ messages: [], streaming: false });
      },
    }),
    {
      name: "keew-ia-chat",
      partialize: (s) => ({ messages: s.messages.filter((m) => !m.pending) }),
    },
  ),
);

/** Executa um turno completo: envia o histórico e transmite a resposta. */
async function run(history: Msg[], set: (fn: (s: State) => Partial<State>) => void) {
  const assistantId = uid();
  const withPlaceholder: Msg[] = [
    ...history,
    { id: assistantId, role: "assistant", content: "", pending: true },
  ];
  set(() => ({ messages: withPlaceholder, streaming: true }));

  controller = new AbortController();

  const patch = (fn: (m: Msg) => Msg) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === assistantId ? fn(m) : m)) }));

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok || !res.body) {
      patch((m) => ({ ...m, pending: false, error: "Não consegui falar com o servidor." }));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    const sources: { title: string; url?: string }[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        let frame: { t: string; v?: unknown };
        try {
          frame = JSON.parse(line.slice(5).trim());
        } catch {
          continue;
        }

        if (frame.t === "text" && typeof frame.v === "string") {
          text += frame.v;
          patch((m) => ({ ...m, content: text }));
        } else if (frame.t === "sources" && Array.isArray(frame.v)) {
          sources.push(...(frame.v as { title: string; url?: string }[]));
          patch((m) => ({ ...m, sources: [...sources] }));
        } else if (frame.t === "error" && typeof frame.v === "string") {
          patch((m) => ({ ...m, error: frame.v as string }));
        }
      }
    }

    patch((m) => ({
      ...m,
      pending: false,
      content: text || m.content,
      error: text ? undefined : m.error || "A Keen não concluiu esta resposta.",
    }));
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      patch((m) => ({ ...m, pending: false }));
    } else {
      patch((m) => ({ ...m, pending: false, error: "A conexão caiu no meio da resposta." }));
    }
  } finally {
    controller = null;
    set(() => ({ streaming: false }));
  }
}
