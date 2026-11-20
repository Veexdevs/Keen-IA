"use client";

/**
 * Keen IA — estado da aplicação.
 *
 * Um único store. Guarda quem está logado, as conversas e o estado do
 * streaming. Quando há conta, tudo vive no Supabase; sem conta, vive no
 * navegador do usuário — e a interface diz isso claramente.
 */
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

import { persistable, type Attachment } from "./attach";
import { answerWithConnector, loadConnectorStates, ownerFromEmail, readField, type ConnectorState } from "./connectors";
import { isSupabaseConfigured, supabaseBrowser } from "./supabase/client";

export type Role = "user" | "assistant";

export type Msg = {
  id: string;
  role: Role;
  content: string;
  pending?: boolean;
  error?: string;
  sources?: { title: string; url?: string }[];
  attachments?: Attachment[];
  /** answered with live data from a connector */
  live?: string;
};

export type Chat = {
  id: string;
  title: string;
  updated_at: string;
  messages: Msg[];
};

export type Profile = {
  display_name: string;
  avatar_url: string;
  email: string;
};

type State = {
  /* sessão */
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  dbEnabled: boolean;

  /* dados */
  chats: Chat[];
  activeId: string | null;
  streaming: boolean;

  /* ações */
  init: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (patch: Partial<Profile>) => Promise<void>;

  newChat: () => Promise<void>;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  clearChat: () => Promise<void>;
  clearChats: () => Promise<void>;
  loadConnectorKey: (id: "github" | "vercel", field: string) => Promise<string | null>;

  send: (text: string, files?: Attachment[]) => Promise<void>;
  stop: () => void;
};

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const LS = "keew-ia-guest-v1";

let controller: AbortController | null = null;

/* ── convidado: persistência no navegador ─────────────────────────────── */

function loadGuest(): Chat[] {
  try {
    const raw = localStorage.getItem(LS);
    return raw ? (JSON.parse(raw) as Chat[]) : [];
  } catch {
    return [];
  }
}

function saveGuest(chats: Chat[]) {
  try {
    localStorage.setItem(LS, JSON.stringify(chats));
  } catch {
    /* cota cheia: a sessão continua, só não persiste */
  }
}

const titleFrom = (text: string) => {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || "New chat";
};

export const useApp = create<State>()((set, get) => ({
  ready: false,
  user: null,
  profile: null,
  dbEnabled: isSupabaseConfigured(),
  chats: [],
  activeId: null,
  streaming: false,

  /* ── sessão ───────────────────────────────────────────────────────────── */

  init: async () => {
    const sb = supabaseBrowser();

    if (!sb) {
      const chats = loadGuest();
      set({
        ready: true,
        dbEnabled: false,
        chats,
        activeId: chats[0]?.id ?? null,
      });
      return;
    }

    const { data } = await sb.auth.getUser();
    const user = data.user ?? null;

    if (!user) {
      set({ ready: true, user: null, chats: [], activeId: null });
      return;
    }

    const [{ data: chats }, { data: profile }] = await Promise.all([
      sb.from("chats").select("id,title,updated_at").order("updated_at", { ascending: false }),
      sb.from("profiles").select("display_name,avatar_url,email").eq("id", user.id).maybeSingle(),
    ]);

    set({
      ready: true,
      user,
      profile: {
        display_name: profile?.display_name || user.email?.split("@")[0] || "You",
        avatar_url: profile?.avatar_url ?? "",
        email: profile?.email || user.email || "",
      },
      chats: (chats ?? []).map((c) => ({ ...c, messages: [] }) as Chat),
      activeId: chats?.[0]?.id ?? null,
    });

    // carrega as mensagens da conversa ativa
    if (chats?.length) await get().selectChat(chats[0].id);
  },

  signOut: async () => {
    const sb = supabaseBrowser();
    await sb?.auth.signOut();
    set({ user: null, profile: null, chats: [], activeId: null });
  },

  saveProfile: async (patch) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    const next = { ...profile, ...patch };
    set({ profile: next });
    await supabaseBrowser()
      ?.from("profiles")
      .update({ display_name: next.display_name, avatar_url: next.avatar_url })
      .eq("id", user.id);
  },

  /* ── conversas ────────────────────────────────────────────────────────── */

  newChat: async () => {
    const { user } = get();
    const sb = supabaseBrowser();

    if (sb && user) {
      const { data } = await sb.from("chats").insert({ user_id: user.id }).select("id,title,updated_at").single();
      if (data) {
        set((s) => ({
          chats: [{ ...data, messages: [] } as Chat, ...s.chats],
          activeId: data.id,
        }));
      }
      return;
    }

    const chat: Chat = { id: uid(), title: "New chat", updated_at: now(), messages: [] };
    set((s) => {
      const chats = [chat, ...s.chats];
      saveGuest(chats);
      return { chats, activeId: chat.id };
    });
  },

  selectChat: (id) => {
    set({ activeId: id });
    const { chats, user } = get();
    const chat = chats.find((c) => c.id === id);
    if (!chat || chat.messages.length) return;

    const sb = supabaseBrowser();
    if (!sb || !user) return;

    void sb
      .from("messages")
      .select("id,role,content,sources,attachments,created_at")
      .eq("chat_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messages: data.map((m) => ({
                    id: m.id,
                    role: m.role as Role,
                    content: m.content,
                    sources: (m.sources ?? []) as Msg["sources"],
                    attachments: (m.attachments ?? []) as Attachment[],
                  })),
                }
              : c,
          ),
        }));
      });
  },

  deleteChat: async (id) => {
    const sb = supabaseBrowser();
    if (sb && get().user) await sb.from("chats").delete().eq("id", id);

    set((s) => {
      const chats = s.chats.filter((c) => c.id !== id);
      if (s.dbEnabled === false) saveGuest(chats);
      return { chats, activeId: s.activeId === id ? (chats[0]?.id ?? null) : s.activeId };
    });
  },

  renameChat: async (id, title) => {
    const clean = title.trim() || "New chat";
    set((s) => {
      const chats = s.chats.map((c) => (c.id === id ? { ...c, title: clean } : c));
      if (s.dbEnabled === false) saveGuest(chats);
      return { chats };
    });
    const sb = supabaseBrowser();
    if (sb && get().user) await sb.from("chats").update({ title: clean }).eq("id", id);
  },

  clearChat: async () => {
    const { activeId, user } = get();
    if (!activeId) return;
    const sb = supabaseBrowser();
    if (sb && user) await sb.from("messages").delete().eq("chat_id", activeId);

    set((s) => {
      const chats = s.chats.map((c) => (c.id === activeId ? { ...c, messages: [] } : c));
      if (s.dbEnabled === false) saveGuest(chats);
      return { chats };
    });
  },

  loadConnectorKey: async (id, field) => {
    const owner = ownerFromEmail(get().user?.email);
    return readField(id, field, owner);
  },

  clearChats: async () => {
    const sb = supabaseBrowser();
    if (sb && get().user) {
      await sb.from("chats").delete().eq("user_id", get().user!.id);
    }
    set((s) => {
      if (s.dbEnabled === false) saveGuest([]);
      return { chats: [], activeId: null };
    });
  },

  /* ── enviar ───────────────────────────────────────────────────────────── */

  send: async (text, files = []) => {
    const clean = text.trim();
    const { activeId, streaming } = get();
    if ((!clean && !files.length) || streaming) return;

    // with no conversation open, create one on the spot
    if (!activeId) await get().newChat();
    const chatId = get().activeId;
    if (!chatId) return;

    const { user, chats } = get();
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    // what the engine reads: the text, then the files' contents
    const readable = files.filter((f) => f.text);
    const grounded = readable.length
      ? `${clean}\n\n${readable
          .map((f) => `--- ${f.name} ---\n${f.text!.slice(0, 8000)}`)
          .join("\n\n")}`.trim()
      : clean;

    const title = clean || files[0]?.name || "New chat";
    const userMsg: Msg = {
      id: uid(),
      role: "user",
      content: clean,
      attachments: files.length ? files.map(persistable) : undefined,
    };
    const botId = uid();
    const history = [...chat.messages, userMsg];
    const isFirst = chat.messages.length === 0;

    set((s) => {
      const next = s.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              title: isFirst ? titleFrom(title) : c.title,
              messages: [...history, { id: botId, role: "assistant" as Role, content: "", pending: true }],
            }
          : c,
      );
      if (s.dbEnabled === false) saveGuest(next);
      return { chats: next, streaming: true };
    });

    // write the question, its files and the title
    const sb = supabaseBrowser();
    if (sb && user) {
      if (isFirst) await sb.from("chats").update({ title: titleFrom(title) }).eq("id", chatId);
      await sb.from("messages").insert({
        chat_id: chatId,
        user_id: user.id,
        role: "user",
        content: clean,
        attachments: files.length ? files.map(persistable) : [],
      });
    }

    const patch = (fn: (m: Msg) => Msg) =>
      set((s) => ({
        chats: s.chats.map((c) =>
          c.id === chatId ? { ...c, messages: c.messages.map((m) => (m.id === botId ? fn(m) : m)) } : c,
        ),
      }));

    // pictures and videos are read from what is already on screen
    const visual = files
      .filter((f) => f.kind === "image" || f.kind === "video")
      .map((f) => `[Attached ${f.kind}: ${f.name}]`)
      .join("\n");

    controller = new AbortController();

    try {
      // ── 0 · a connector may answer this with live data ──────────────────
      const states: Record<string, ConnectorState> = loadConnectorStates();
      if (Object.values(states).some((c) => c.on)) {
        try {
          const live = await answerWithConnector(grounded, states);
          if (live) {
            // reveal it progressively, so it reads like an answer and not a paste
            const text = live.answer;
            for (let i = 0; i < text.length; i += 28) {
              const slice = text.slice(0, i + 28);
              patch((m) => ({ ...m, content: slice, live: live.source }));
              await new Promise((r) => setTimeout(r, 6));
            }
            patch((m) => ({ ...m, pending: false, content: text, live: live.source }));

            const sbLive = supabaseBrowser();
            if (sbLive && user) {
              await sbLive.from("messages").insert({
                chat_id: chatId,
                user_id: user.id,
                role: "assistant",
                content: text,
                sources: live.source ? [{ title: live.source, kind: "connector" }] : [],
                attachments: [],
              });
            }
            return;
          }
        } catch {
          // a broken connector must never block the normal path
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            content: m.id === userMsg.id ? [grounded, visual].filter(Boolean).join("\n\n") : m.content,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        patch((m) => ({ ...m, pending: false, error: "Could not reach the server." }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let out = "";
      let sources: Msg["sources"] = [];

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
            out += frame.v;
            patch((m) => ({ ...m, content: out }));
          } else if (frame.t === "sources" && Array.isArray(frame.v)) {
            sources = frame.v as Msg["sources"];
            patch((m) => ({ ...m, sources }));
          } else if (frame.t === "error" && typeof frame.v === "string") {
            patch((m) => ({ ...m, error: frame.v as string }));
          }
        }
      }

      const final = out || "I couldn't complete this answer.";
      patch((m) => ({ ...m, pending: false, content: final }));

      const sb2 = supabaseBrowser();
      if (sb2 && user) {
        await sb2.from("messages").insert({
          chat_id: chatId,
          user_id: user.id,
          role: "assistant",
          content: final,
          sources: sources ?? [],
          attachments: [],
        });
      }
    } catch (err) {
      const aborted = (err as Error).name === "AbortError";
      patch((m) => ({
        ...m,
        pending: false,
        error: aborted ? undefined : "The connection dropped mid-answer.",
      }));
    } finally {
      controller = null;
      set((s) => {
        if (s.dbEnabled === false) saveGuest(s.chats);
        return { streaming: false };
      });
    }
  },

  stop: () => {
    controller?.abort();
    controller = null;
    set((s) => ({
      streaming: false,
      chats: s.chats.map((c) => ({
        ...c,
        messages: c.messages.map((m) => (m.pending ? { ...m, pending: false } : m)),
      })),
    }));
  },
}));
