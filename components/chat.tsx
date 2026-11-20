"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Composer } from "./composer";
import { Viewer } from "./attachments";
import { IconMenu, IconSliders, IconTrash } from "./icons";
import { Wordmark } from "./logo";
import { Message } from "./message";
import { LoginModal, ProfileModal } from "./modals";
import { SettingsSheet } from "./settings";
import { Sidebar } from "./sidebar";
import { Welcome } from "./welcome";
import type { Attachment } from "@/lib/attach";
import { useLocale } from "@/lib/i18n/store";
import { useStrings, useT } from "@/lib/i18n/use";
import { usePrefs } from "@/lib/settings";
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

  const hydratePrefs = usePrefs((s) => s.hydrate);
  const hydrateLocale = useLocale((s) => s.hydrate);
  const t = useT();

  useStrings(["chat.clear", "chat.editing", "chat.menu", "chat.settings", "common.cancel", "common.close", "composer.placeholder", "composer.reply", "login.errCallback", "chat.emptyHistory", "chat.new", "chat.noMatch", "chat.searchChats", "chat.signInSave", "chat.signOut", "common.earlier", "common.remove", "common.today", "common.week", "msg.edit", "welcome.greeting", "welcome.subtitle", "composer.disclaimer"]);

  const [drawer, setDrawer] = useState(false);
  const [login, setLogin] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewing, setViewing] = useState<Attachment | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const stream = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydratePrefs();
    hydrateLocale();
    void init();
  }, [hydratePrefs, hydrateLocale, init]);

  /* a failed sign-in comes back in the URL; show it, then clean the address */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") !== "error") return;
    setAuthError(params.get("reason") || "unknown");
  }, []);

  const chat = useMemo(() => chats.find((c) => c.id === activeId) ?? null, [chats, activeId]);
  const messages = chat?.messages ?? [];
  const showWelcome = messages.length === 0;

  /* follow the answer while it streams, without fighting someone scrolling up */
  useEffect(() => {
    const el = stream.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 260;
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
    <div className="fixed inset-0 flex overflow-hidden bg-bg" style={{ height: "100dvh" }}>
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
        onSettings={() => setSettingsOpen(true)}
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

      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setDrawer(true)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-fg md:hidden"
              aria-label={t("chat.menu")}
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

          <div className="flex shrink-0 items-center gap-0.5">
            <AnimatePresence>
              {!showWelcome && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => void clearChat()}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-subtle transition-colors hover:bg-hover hover:text-fg"
                >
                  <IconTrash size={13} />
                  <span className="hidden sm:inline">{t("chat.clear")}</span>
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setSettingsOpen(true)}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-fg"
              aria-label={t("chat.settings")}
              title={t("chat.settings")}
            >
              <IconSliders size={16} />
            </motion.button>
          </div>
        </header>

        {/* the stream — ends where the composer begins */}
        <div ref={stream} className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                className="mx-auto w-full max-w-[760px] space-y-5 px-4 pb-2 pt-1 sm:px-0"
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

        {/* composer sits right under the last message, never overflows */}
        <div className="w-full shrink-0">
          <Composer
            onSend={submit}
            streaming={streaming}
            onStop={stop}
            placeholder={showWelcome ? t("composer.placeholder") : t("composer.reply")}
          />
        </div>

        {/* editing an earlier message */}
        <AnimatePresence>
          {draft && !showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-20 left-1/2 w-full max-w-[760px] -translate-x-1/2 px-4 sm:px-0"
            >
              <div className="flex items-center gap-2 rounded-xl border border-accent/35 bg-panel px-3 py-2 shadow-xl">
                <span className="min-w-0 flex-1 truncate text-[12px] text-muted">
                  {t("chat.editing", { text: draft.slice(0, 80) })}
                </span>
                <button
                  onClick={() => setDraft("")}
                  className="rounded-md px-2 py-0.5 text-[11.5px] font-medium text-subtle hover:text-fg"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* /auth/callback sends people back with ?auth=error&reason=… — without
          this the round-trip failed silently and the screen just looked
          logged out with no explanation */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed left-1/2 top-4 z-[60] w-[min(92vw,460px)] -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12.5px] leading-relaxed text-red-200 shadow-xl backdrop-blur-md"
            role="alert"
          >
            <div className="flex items-start justify-between gap-3">
              <span>{t("login.errCallback", { reason: authError })}</span>
              <button
                onClick={() => {
                  setAuthError(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete("auth");
                  url.searchParams.delete("reason");
                  window.history.replaceState({}, "", url);
                }}
                className="shrink-0 rounded-md px-1.5 text-red-300/70 hover:text-red-100"
                aria-label={t("common.close")}
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Viewer item={viewing} onClose={() => setViewing(null)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />

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
