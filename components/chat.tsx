"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Composer } from "./composer";
import { Viewer } from "./attachments";
import { IconMenu, IconProfile, IconTrash } from "./icons";
import { Wordmark } from "./logo";
import { Message } from "./message";
import { LoginModal, ProfileModal, ShareModal } from "./modals";
import { SettingsSheet } from "./settings";
import { Sidebar } from "./sidebar";
import { Tabs } from "./tabs";
import { Welcome } from "./welcome";
import type { Attachment } from "@/lib/attach";
import { IconClose, IconEdit } from "./icons";
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
  const localeTag = useLocale((s) => s.tag);
  const t = useT();

  useStrings(["chat.clear", "chat.editing", "chat.menu", "chat.settings", "common.cancel", "common.close", "composer.placeholder", "composer.reply", "login.errCallback", "chat.emptyHistory", "chat.new", "chat.noMatch", "chat.searchChats", "chat.signInSave", "chat.signOut", "common.earlier", "common.remove", "common.today", "common.week", "msg.edit", "welcome.greeting", "welcome.guest", "welcome.subtitle", "composer.disclaimer", "tabs.label", "tabs.soon"]);

  const [drawer, setDrawer] = useState(false);
  const [login, setLogin] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewing, setViewing] = useState<Attachment | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  /* editar uma mensagem: o texto vai para o composer e o envio SUBSTITUI a
     mensagem original, em vez de criar outra. */
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [share, setShare] = useState<{ open: boolean; url: string; title: string } | null>(null);
  /* o compartilhar tem erro próprio: reaproveitar o aviso de login fazia a tela
     dizer "o login não foi concluído" para quem só queria um link */
  const [shareError, setShareError] = useState<string | null>(null);
  const stream = useRef<HTMLDivElement>(null);

  const deleteMessage = useApp((s) => s.deleteMessage);
  const editMessage = useApp((s) => s.editMessage);
  const regenerate = useApp((s) => s.regenerate);

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

  /**
   * Publica a resposta e abre o modal com o link.
   *
   * O texto vai sozinho: é a única coisa que a página pública mostra. O id da
   * mensagem não é enviado de propósito — sem ele, quem tem o link não tem
   * como chegar ao resto da conversa.
   */
  const openShare = useCallback(
    async (content: string) => {
      const title = chat?.title ?? "Keen IA";
      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: content, lang: localeTag, title }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          setShareError(
            data.error === "no-store"
              ? t("share.noStore")
              : data.error === "rate-limited"
                ? t("share.rateLimited")
                : t("share.failed"),
          );
          return;
        }
        setShare({ open: true, url: data.url, title });
      } catch {
        setShareError(t("share.failed"));
      }
    },
    [chat?.title, localeTag, t],
  );

  const remove = useCallback(
    async (id: string) => {
      setConfirmDelete(null);
      await deleteMessage(id);
    },
    [deleteMessage],
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

  /* O nome que a saudação mostra. Nunca o email: o perfil guarda o nome
     escolhido; sem perfil, o store já usa o prefixo do endereço como nome. */
  const displayName = profile?.display_name || undefined;

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
                avatar: profile?.avatar_url ?? "",
              }
            : null
        }
      />

      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {/* cabeçalho: menu, marca, perfil */}
        <header className="flex h-[51px] shrink-0 items-center justify-between gap-3 px-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => setDrawer(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-fg transition-colors hover:bg-hover md:hidden"
              aria-label={t("chat.menu")}
            >
              <IconMenu size={21} />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {showWelcome ? (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Wordmark size={21} fontSize={18.5} />
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
                  {chat?.title ?? "Keen IA"}
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

            {/* o perfil: leva ao painel, onde o email tem seu lugar */}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setSettingsOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-fg transition-colors hover:bg-hover"
              aria-label={t("chat.settings")}
              title={t("chat.settings")}
            >
              <IconProfile size={23} />
            </motion.button>
          </div>
        </header>

        {/* as quatro seções, logo abaixo do cabeçalho */}
        <Tabs active="chat" />


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
                <Welcome name={displayName ?? t("welcome.guest")} />
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
                        ? () => void regenerate()
                        : undefined
                    }
                    canRegenerate={i === messages.length - 1}
                    onEdit={
                      m.role === "user" ? (text) => setEditing({ id: m.id, text }) : undefined
                    }
                    onDelete={() => setConfirmDelete(m.id)}
                    onShare={
                      m.role === "assistant" && m.content
                        ? () => void openShare(m.content)
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
          {/* editando: uma faixa acima do campo diz o que o envio vai fazer */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="mx-auto flex w-full max-w-[760px] items-center gap-2 px-3 pb-1.5 sm:px-0"
              >
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[11.5px] text-accent-light">
                  <IconEdit size={12} />
                  <span className="truncate">{t("chat.editing", { text: editing.text.slice(0, 68) })}</span>
                </span>
                <button
                  onClick={() => setEditing(null)}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-subtle transition-colors hover:bg-hover hover:text-fg"
                  aria-label={t("common.cancel")}
                  title={t("common.cancel")}
                >
                  <IconClose size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <Composer
            onSend={(text, files) => {
              /* editando, o envio troca o texto no lugar: sem nova mensagem do
                 usuário e sem outra resposta — só o que estava errado corrigido */
              if (editing) {
                void editMessage(editing.id, text);
                setEditing(null);
                return;
              }
              submit(text, files);
            }}
            value={editing?.text}
            onValueChange={editing ? (next) => setEditing({ ...editing, text: next }) : undefined}
            streaming={streaming}
            onStop={stop}
            placeholder={editing ? t("chat.editingHint") : showWelcome ? t("composer.placeholder") : t("composer.reply")}
          />
        </div>

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

      {/* apagar pede um segundo toque: é o único botão da fileira que não
          desfaz, e o alvo é pequeno */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] grid place-items-center bg-black/75 p-5 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] rounded-2xl border border-border bg-panel p-5 shadow-2xl"
            >
              <span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-red-500/12 text-red-300">
                <IconTrash size={16} />
              </span>
              <p className="text-[14.5px] font-semibold text-fg">{t("msg.deleteTitle")}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{t("msg.deleteBody")}</p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-lg border border-border-strong px-3.5 py-2 text-[12.5px] font-medium text-muted transition-colors hover:bg-dark hover:text-fg"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => void remove(confirmDelete)}
                  className="rounded-lg bg-red-500/90 px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-red-500"
                >
                  {t("msg.delete")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* aviso do compartilhar, discreto e com prazo próprio */}
      <AnimatePresence>
        {shareError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            role="status"
            className="fixed bottom-24 left-1/2 z-[70] w-[min(92vw,420px)] -translate-x-1/2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-200 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-2">
              <span>{shareError}</span>
              <button
                onClick={() => setShareError(null)}
                className="shrink-0 text-amber-300/70 hover:text-amber-100"
                aria-label={t("common.close")}
              >
                <IconClose size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* some sozinho: é sobre uma tentativa, não sobre a tela */}
      <ShareErrorTimer value={shareError} onDone={() => setShareError(null)} />

      <ShareModal
        open={Boolean(share?.open)}
        onClose={() => setShare(null)}
        url={share?.url ?? ""}
        title={share?.title ?? ""}
      />
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

/** Um aviso de compartilhar que some sozinho depois de alguns segundos. */
function ShareErrorTimer({ value, onDone }: { value: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!value) return;
    const id = setTimeout(onDone, 6000);
    return () => clearTimeout(id);
  }, [value, onDone]);
  return null;
}
