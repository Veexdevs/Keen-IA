"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Composer } from "./composer";
import { Viewer } from "./attachments";
import { IconMenu, IconTrash } from "./icons";
import { Wordmark } from "./logo";
import { Message } from "./message";
import { LoginModal, ProfileModal } from "./modals";
import { Sidebar } from "./sidebar";
import { Welcome } from "./welcome";
import type { Attachment } from "@/lib/attach";
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
  const [viewing, setViewing] = useState<Attachment | null>(null);
  const [draft, setDraft] = useState("");
  const stream = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void init();
  }, [init]);

  const chat = useMemo(() => chats.find((c) => c.id === activeId) ?? null, [chats, activeId]);
  const messages = chat?.messages ?? [];
  const showWelcome = messages.length === 0;

  /* follow the answer while it streams, but never fight the reader */
  useEffect(() => {
    const el = stream.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
    if (!near) return;
    el.scrollTo({ top: el.scrollHeight, behavior: streaming ? "auto" : "smooth" });
  }, [messages, streaming]);

  const submit = useCallback(
    (text: string, files: Attachment[] = []) => {
      void send(text, files);
    },
    [send],
  );

  if (!ready) {
    return (
      <div className="grid h-dvh place-items-center bg-bg">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.96, 1, 0.96] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Wordmark size={22} />
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

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* header — almost invisible, like a reading surface */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setDrawer(true)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-fg md:hidden"
              aria-label="Open menu"
            >
              <IconMenu size={18} />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {showWelcome ? (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="md:hidden"
                >
                  <Wordmark size={19} />
                </motion.div>
              ) : (
                <motion.h1
                  key="title"
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.16 }}
                  className="truncate text-[13px] font-medium text-muted"
                >
                  {chat?.title ?? "Keew IA"}
                </motion.h1>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {!showWelcome && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => void clearChat()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-subtle transition-colors hover:bg-white/[0.05] hover:text-fg"
              >
                <IconTrash size={13} />
                <span className="hidden sm:inline">Clear</span>
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {/* the stream */}
        <div ref={stream} className="scroll-thin flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait" initial={false}>
            {showWelcome ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
                className="flex min-h-full flex-col justify-center"
              >
                <Welcome name={user ? displayName : undefined} />
              </motion.div>
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
                className="mx-auto w-full max-w-[760px] space-y-6 px-4 pb-4 pt-2 sm:px-0"
              >
                {messages.map((m, i) => (
                  <Message
                    key={m.id}
                    msg={m}
                    avatar={profile?.avatar_url || undefined}
                    isLast={i === messages.length - 1}
                    onOpenAttachment={setViewing}
                    onRegenerate={
                      m.role === "assistant" && i === messages.length - 1
                        ? () => {
                            const prev = messages[i - 1];
                            if (prev?.role === "user") void send(prev.content, prev.attachments ?? []);
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

        <Composer
          onSend={submit}
          streaming={streaming}
          onStop={stop}
          placeholder={showWelcome ? "How can I help today?" : "Reply to Keew"}
        />

        {/* editing an earlier message */}
        <AnimatePresence>
          {draft && !showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-24 left-1/2 w-full max-w-[760px] -translate-x-1/2 px-4 sm:px-0"
            >
              <div className="flex items-center gap-2 rounded-xl border border-accent/35 bg-panel px-3 py-2 shadow-xl">
                <span className="min-w-0 flex-1 truncate text-[12px] text-muted">
                  Editing: {draft.slice(0, 80)}
                </span>
                <button
                  onClick={() => setDraft("")}
                  className="rounded-md px-2 py-0.5 text-[11.5px] font-medium text-subtle hover:text-fg"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Viewer item={viewing} onClose={() => setViewing(null)} />

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
