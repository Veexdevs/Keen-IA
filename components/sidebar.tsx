"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  IconChatsEmpty,
  IconChevronRight,
  IconClose,
  IconEdit,
  IconLogout,
  IconMoon,
  IconPlus,
  IconSearch,
  IconSliders,
  IconSlidersLines,
  IconSun,
  IconTrash,
  IconUser,
} from "./icons";
import { Wordmark } from "./logo";
import { useStrings, useT } from "@/lib/i18n/use";
import { usePrefs } from "@/lib/settings";
import type { Chat } from "@/lib/store";

/* ── o seletor de tema do rodapé ───────────────────────────────────────── */

/**
 * Sol e lua numa pílula; o que está valendo ganha um anel azul.
 *
 * É o mesmo controle que a aba Aparência oferece com três cartões, reduzido a
 * dois estados porque no celular cabe isso. O tema "cinza" continua acessível
 * em Aparência.
 */
function ThemeSwitch() {
  const theme = usePrefs((s) => s.prefs.theme);
  const set = usePrefs((s) => s.set);
  const escuro = theme !== "light";

  return (
    <div
      role="group"
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-[var(--drawer-border)] bg-[var(--drawer-track)] p-[2.5px]"
    >
      <button
        onClick={() => set("theme", "light")}
        aria-label="Claro"
        aria-pressed={!escuro}
        className={`grid h-[24px] w-[24px] place-items-center rounded-full transition-colors ${
          !escuro ? "bg-accent text-white" : "text-[#9a9a9e]"
        }`}
      >
        <IconSun size={15} />
      </button>
      <button
        onClick={() => set("theme", "dark")}
        aria-label="Escuro"
        aria-pressed={escuro}
        className={`grid h-[24px] w-[24px] place-items-center rounded-full border-[1.5px] transition-colors ${
          escuro ? "border-accent bg-[var(--drawer-track)] text-accent" : "border-transparent text-[#9a9a9e]"
        }`}
      >
        <IconMoon size={14} />
      </button>
    </div>
  );
}

/* ── uma conversa na lista ─────────────────────────────────────────────── */

function ChatRow({
  chat,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  chat: Chat;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chat.title);
  const t = useT();

  useStrings(["chat.emptyHistory", "chat.new", "chat.noMatch", "chat.searchChats", "chat.settings", "chat.signInSave", "chat.signOut", "common.close", "common.earlier", "common.remove", "common.today", "common.week", "msg.edit"]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(chat.title);
      requestAnimationFrame(() => input.current?.select());
    }
  }, [editing, chat.title]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== chat.title) onRename(draft.trim());
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className="group relative"
    >
      {active && (
        <motion.span
          layoutId="chat-active-bar"
          className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-accent"
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
        />
      )}

      {editing ? (
        <input
          ref={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full rounded-lg border border-accent/60 bg-dark px-2.5 py-2 pl-3 text-[13px] text-fg outline-none"
        />
      ) : (
        <button
          onClick={onSelect}
          className={`flex w-full items-center gap-2 rounded-lg py-[7px] pl-2.5 pr-1 text-left text-[12.5px] transition-colors ${
            active ? "bg-hover-strong text-fg" : "text-muted hover:bg-hover hover:text-fg"
          }`}
        >
          <span className="truncate">{chat.title}</span>
        </button>
      )}

      {!editing && (
        <div className="pointer-events-none absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="grid h-6 w-6 place-items-center rounded text-subtle transition-colors hover:bg-hover-strong hover:text-fg"
            aria-label={t("msg.edit")}
          >
            <IconEdit size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="grid h-6 w-6 place-items-center rounded text-subtle transition-colors hover:bg-red-500/15 hover:text-red-300"
            aria-label={t("common.remove")}
          >
            <IconTrash size={13} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ── a barra lateral ───────────────────────────────────────────────────── */

export function Sidebar({
  open,
  onClose,
  chats,
  activeId,
  onNew,
  onSelect,
  onRename,
  onDelete,
  onLogin,
  onProfile,
  onSettings,
  onSignOut,
  user,
}: {
  open: boolean;
  onClose: () => void;
  chats: Chat[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onLogin: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onSignOut: () => void;
  user: { name: string; avatar: string } | null;
}) {
  const [query, setQuery] = useState("");
  const prefs = usePrefs((s) => s.prefs);
  const t = useT();
  const setPref = usePrefs((s) => s.set);
  const visible = query.trim()
    ? chats.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))
    : chats;

  /* group by day, like a real conversation list */
  const groups = (() => {
    const today: Chat[] = [];
    const week: Chat[] = [];
    const older: Chat[] = [];
    const day = 86_400_000;
    const now = Date.now();
    for (const c of visible) {
      const age = now - new Date(c.updated_at).getTime();
      if (age < day) today.push(c);
      else if (age < 7 * day) week.push(c);
      else older.push(c);
    }
    return [
      { label: t("common.today"), items: today },
      { label: t("common.week"), items: week },
      { label: t("common.earlier"), items: older },
    ].filter((g) => g.items.length);
  })();

  const content = (
    <div className="flex h-full flex-col bg-[var(--drawer)]">
      {/* cabeçalho: a marca e o X */}
      <div className="flex h-[85px] shrink-0 items-center justify-between pl-[17px] pr-6">
        <Wordmark size={26} fontSize={19} />
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center text-fg transition-opacity hover:opacity-70 md:hidden"
          aria-label={t("common.close")}
        >
          <IconClose size={22} />
        </button>
      </div>

      {/* Adicionar chat: um cartão com a barra azul colada na borda esquerda */}
      <div className="px-[9px]">
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            onNew();
            onClose();
          }}
          className="relative flex h-[57px] w-full items-center gap-4 overflow-hidden rounded-[22px] border border-[var(--drawer-border)] bg-[var(--drawer-card)] pl-6 pr-5 text-left transition-colors hover:border-[var(--drawer-border-strong)]"
        >
          {/* a barra é a própria borda do cartão, não um enfeite por dentro */}
          <span aria-hidden className="absolute left-0 top-0 h-full w-[5px] bg-accent" />
          <IconPlus size={21} className="shrink-0 text-fg" />
          <span className="truncate text-[13px] font-semibold text-fg">{t("chat.new")}</span>
        </motion.button>
      </div>

      {/* Buscar chats */}
      <div className="px-[9px] pt-2">
        <label className="flex h-[57px] items-center gap-4 rounded-[22px] px-6 transition-colors focus-within:bg-[var(--drawer-card)] hover:bg-[var(--drawer-card)]">
          <IconSearch size={21} className="shrink-0 text-fg" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("chat.searchChats")}
            className="w-full bg-transparent text-[13px] text-fg outline-none placeholder:font-medium placeholder:text-fg"
          />
        </label>
      </div>

      {/* a linha que separa a busca do histórico */}
      <div className="mx-6 mt-1 h-px bg-[var(--drawer-border)]" />

      {/* histórico */}
      <nav className="scroll-thin mt-1 flex-1 overflow-y-auto px-3 pb-3">
        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
            className="flex flex-col items-center px-4 pt-[34px] text-center"
          >
            <IconChatsEmpty size={44} className="text-[var(--drawer-muted)]" />
            <p className="mt-4 text-[13px] leading-snug text-[var(--drawer-muted)]">
              {query ? t("chat.noMatch") : t("chat.emptyHistory")}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {groups.map((g) => (
              <motion.div
                layout
                key={g.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <p className="px-2.5 pb-1 pt-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-subtle/70">
                  {g.label}
                </p>
                <div className="space-y-0.5">
                  <AnimatePresence initial={false}>
                    {g.items.map((c) => (
                      <ChatRow
                        key={c.id}
                        chat={c}
                        active={c.id === activeId}
                        onSelect={() => {
                          onSelect(c.id);
                          onClose();
                        }}
                        onRename={(t) => onRename(c.id, t)}
                        onDelete={() => onDelete(c.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </nav>

      {/* rodapé: dois cartões redondos */}
      <div className="shrink-0 space-y-2 px-[9px] pb-3">
        {/* Configurações, com o seletor de tema à direita */}
        <div className="flex h-[57px] items-center gap-1 rounded-[22px] border border-[var(--drawer-border)] bg-[var(--drawer-card)] pl-[15px] pr-[6px]">
          <button
            onClick={() => {
              onSettings();
              onClose();
            }}
            className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
          >
            <IconSlidersLines size={21} className="shrink-0 text-fg" />
            <span className="min-w-0 whitespace-nowrap text-[13px] font-semibold tracking-[-0.02em] text-fg">{t("chat.settings")}</span>
          </button>

          <ThemeSwitch />
        </div>

        {/* conta: retrato, nome e a seta */}
        <button
          onClick={() => {
            if (user) onProfile();
            else onLogin();
            onClose();
          }}
          className="flex h-[57px] w-full items-center gap-3.5 rounded-[22px] border border-[var(--drawer-border)] bg-[var(--drawer-card)] pl-4 pr-4 text-left transition-colors hover:border-[var(--drawer-border-strong)]"
        >
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--drawer-avatar)] text-[#8a8a8c]">
              <IconUser size={19} />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg">
            {user ? user.name : t("drawer.noAccount")}
          </span>
          <IconChevronRight size={20} className="shrink-0 text-fg" />
        </button>

        {user && (
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-2 px-5 py-1 text-[13px] text-[var(--drawer-muted)] transition-colors hover:text-fg"
          >
            <IconLogout size={14} />
            {t("chat.signOut")}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* desktop: fixa */}
      <aside className="hidden w-[264px] shrink-0 border-r border-border bg-[var(--sidebar)] md:block">{content}</aside>

      {/* mobile: gaveta */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -244 }}
              animate={{ x: 0 }}
              exit={{ x: -244 }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              className="fixed left-0 top-0 z-50 h-full w-[232px] border-r border-[var(--drawer-border)] bg-[var(--drawer)] md:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
