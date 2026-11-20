"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { IconClose, IconEdit, IconLogout, IconPlus, IconSearch, IconSliders, IconTrash, IconUser } from "./icons";
import { Wordmark } from "./logo";
import { useStrings, useT } from "@/lib/i18n/use";
import { usePrefs } from "@/lib/settings";
import type { Chat } from "@/lib/store";

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
  user: { name: string; email: string; avatar: string } | null;
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
    <div className="flex h-full flex-col">
      {/* marca */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Wordmark size={22} />
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-hover hover:text-fg md:hidden"
          aria-label={t("common.close")}
        >
          <IconClose size={17} />
        </button>
      </div>

      {/* nova conversa */}
      <div className="px-3">
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => {
            onNew();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-fg transition-colors hover:bg-hover"
        >
          <IconPlus size={16} className="text-muted" />
          {t("chat.new")}
        </motion.button>
      </div>

      {/* search over the history */}
      <div className="px-3 pb-1 pt-2">
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-subtle transition-colors focus-within:bg-hover hover:bg-hover">
          <IconSearch size={13} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("chat.searchChats")}
            className="w-full bg-transparent text-fg outline-none placeholder:text-subtle"
          />
        </div>
      </div>

      {/* histórico */}
      <nav className="scroll-thin mt-2 flex-1 overflow-y-auto px-3 pb-3">
        {groups.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="px-3 pt-6 text-[12.5px] leading-relaxed text-subtle"
          >
            {query ? t("chat.noMatch") : t("chat.emptyHistory")}
          </motion.p>
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

      {/* footer */}
      <div className="shrink-0 border-t border-border p-2.5">
        {/* settings + quick theme */}
        <div className="mb-1 flex items-center gap-1">
          <button
            onClick={() => {
              onSettings();
              onClose();
            }}
            className="flex flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px] text-muted transition-colors hover:bg-hover hover:text-fg"
          >
            <IconSliders size={14} />
            {t("chat.settings")}
          </button>

          <div className="flex items-center gap-0.5 rounded-lg bg-hover p-0.5">
            {([
              { id: "light", label: "Light", swatch: "#fbfaf7" },
              { id: "dark", label: "Dark", swatch: "#0a0a0a" },
              { id: "gray", label: "Gray", swatch: "#1a1a1c" },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setPref("theme", t.id)}
                title={`${t.label} theme`}
                aria-label={`${t.label} theme`}
                className={`grid h-5 w-5 place-items-center rounded-md transition-transform hover:scale-110 ${
                  prefs.theme === t.id ? "ring-1 ring-accent" : ""
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full border border-border-strong"
                  style={{ background: t.swatch }}
                />
              </button>
            ))}
          </div>
        </div>

        {user ? (
          <div className="space-y-0.5">
            <button
              onClick={() => {
                onProfile();
                onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-hover"
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-light">
                  <IconUser size={15} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-fg">{user.name}</span>
                <span className="block truncate text-[11.5px] text-subtle">{user.email}</span>
              </span>
            </button>
            <button
              onClick={onSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px] text-subtle transition-colors hover:bg-hover hover:text-fg"
            >
              <IconLogout size={14} />
              {t("chat.signOut")}
            </button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              onLogin();
              onClose();
            }}
            className="w-full rounded-lg border border-border-strong py-2 text-[12.5px] font-semibold text-fg transition-colors hover:border-accent/50 hover:bg-accent/[0.07]"
          >
            {t("chat.signInSave")}
          </motion.button>
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
              initial={{ x: -284 }}
              animate={{ x: 0 }}
              exit={{ x: -284 }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              className="fixed left-0 top-0 z-50 h-full w-[264px] border-r border-border bg-[var(--sidebar)] md:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
