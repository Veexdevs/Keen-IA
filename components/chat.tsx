"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Composer, type Attachment } from "./composer";
import { IconMenu, IconTrash } from "./icons";
import { Logo, Wordmark } from "./logo";
import { Message } from "./message";
import { LoginModal, ProfileModal } from "./modals";
import { Sidebar } from "./sidebar";
import { Welcome } from "./welcome";
import { useApp } from "@/lib/store";

export function Chat() {
  const {
    ready,
    user,
    profile,
    chats,
    activeId,
    streaming,
    init,
    newChat,
    selectChat,
    deleteChat,
    renameChat,
    clearChat,
    send,
    stop,
    signOut,
    saveProfile,
  } = useApp();

  const [drawer, setDrawer] = useState(false);
  const [login, setLogin] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const stream = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void init();
  }, [init]);

  const chat = useMemo(() => chats.find((c) => c.id === activeId) ?? null, [chats, activeId]);
  const messages = chat?.messages ?? [];
  const showWelcome = messages.length === 0;

  /* rola para a última mensagem, com suavidade enquanto escreve */
  useEffect(() => {
    const el = stream.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 220;
    if (!near) return;
    el.scrollTo({ top: el.scrollHeight, behavior: streaming ? "auto" : "smooth" });
  }, [messages, streaming]);

  const submit = useCallback(
    (text: string, files: Attachment[] = []) => {
      // os anexos entram no texto, já que o motor lê texto
      const withFiles = files.length
        ? `${text}\n\n${files
            .map((f) => (f.text ? `--- ${f.name} ---\n${f.text.slice(0, 6000)}` : `[Attached: ${f.name}]`))
            .join("\n\n")}`
        : text;
      void send(withFiles);
    },
    [send],
  );

  const pick = (prompt: string) => {
    setDraft("");
    void send(prompt);
  };

  if (!ready) {
    return (
      <div className="grid h-dvh place-items-center bg-bg">
        <motion.div
          animate={{ opacity: [0.35, 1, 0.35], scale: [0.96, 1, 0.96] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Logo size={40} />
        </motion.div>
      </div>
    );
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || undefined;

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <Sidebar
        open={drawer}
        onClose={() => setDrawer(false)}
        chats={chats}
        activeId={activeId}
        onNew={() => void newChat()}
        onSelect={selectChat}
        onRename={renameChat}
        onDelete={deleteChat}
        onLogin={() => setLogin(true)}
        onProfile={() => setProfileOpen(true)}
        onSignOut={() => void signOut()}
        user={
          user
            ? {
                name: displayName ?? "You",
                email: user.email ?? "",
                avatar: profile?.avatar_url ?? "",
              }
            : null
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* cabeçalho */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setDrawer(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-fg md:hidden"
              aria-label="Open menu"
            >
              <IconMenu size={19} />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {showWelcome ? (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  className="md:hidden"
                >
                  <Wordmark size={20} />
                </motion.div>
              ) : (
                <motion.h1
                  key="title"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="truncate text-[14px] font-semibold text-fg"
                >
                  {chat?.title ?? "Keew IA"}
                </motion.h1>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {!showWelcome && (
              <motion.button
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => void clearChat()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
              >
                <IconTrash size={14} />
                <span className="hidden sm:inline">Clear chat</span>
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {/* fluxo de mensagens */}
        <div ref={stream} className="scroll-thin flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait" initial={false}>
            {showWelcome ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.16 } }}
                className="flex min-h-full flex-col justify-center"
              >
                <Welcome name={user ? displayName : undefined} onPick={pick} />
              </motion.div>
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mx-auto w-full max-w-3xl py-4"
              >
                {messages.map((m, i) => (
                  <Message
                    key={m.id}
                    msg={m}
                    avatar={profile?.avatar_url || undefined}
                    isLast={i === messages.length - 1}
                    onRegenerate={
                      m.role === "assistant" && i === messages.length - 1
                        ? () => {
                            const prev = messages[i - 1];
                            if (prev?.role === "user") void send(prev.content);
                          }
                        : undefined
                    }
                    onEdit={
                      m.role === "user"
                        ? () => {
                            setDraft(m.content);
                            void clearChat();
                          }
                        : undefined
                    }
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* compositor */}
        <Composer
          onSend={submit}
          streaming={streaming}
          onStop={stop}
          placeholder={showWelcome ? "Ask Keew anything" : "Reply to Keew"}
        />

        {/* rascunho de edição */}
        <AnimatePresence>
          {draft && !showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="pointer-events-none absolute bottom-24 left-1/2 w-full max-w-3xl -translate-x-1/2 px-4"
            >
              <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-accent/40 bg-panel px-3 py-2 shadow-xl">
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">
                  Editing: {draft.slice(0, 90)}
                </span>
                <button
                  onClick={() => setDraft("")}
                  className="rounded-md px-2 py-1 text-[12px] font-medium text-subtle hover:text-fg"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* modais */}
      <LoginModal open={login} onClose={() => setLogin(false)} />
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={{
          display_name: profile?.display_name ?? "",
          avatar_url: profile?.avatar_url ?? "",
          email: profile?.email ?? user?.email ?? "",
        }}
        onSave={(patch) => void saveProfile(patch)}
      />
    </div>
  );
}
