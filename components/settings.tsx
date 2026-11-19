"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Spinner } from "./modals";
import {
  IconCheck,
  IconClose,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconLogout,
  IconTrash,
  IconUser,
} from "./icons";
import {
  CONNECTORS,
  checkConnector,
  forgetConnector,
  loadConnectorStates,
  readField,
  saveField,
  saveStates,
  type Connector,
  type ConnectorId,
  type ConnectorState,
} from "@/lib/connectors";
import { usePrefs, type Density, type Theme } from "@/lib/settings";
import { useApp } from "@/lib/store";

type Tab = "connectors" | "appearance" | "account" | "about";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "connectors", label: "Connectors", icon: <PlugIcon /> },
  { id: "appearance", label: "Appearance", icon: <ThemeIcon /> },
  { id: "account", label: "Account", icon: <IconUser size={15} /> },
  { id: "about", label: "About", icon: <HeartIcon /> },
];

/* ── the panel ─────────────────────────────────────────────────────────── */

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("connectors");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-[2px]"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
        >
          <motion.aside
            initial={{ x: 34, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 34, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-[560px] flex-col border-l border-border bg-bg shadow-2xl"
          >
            {/* head */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-[15px] font-semibold text-fg">Settings</h2>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-hover hover:text-fg"
                aria-label="Close settings"
              >
                <IconClose size={17} />
              </motion.button>
            </div>

            {/* tabs */}
            <div className="flex shrink-0 gap-1 border-b border-border px-3 py-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                    tab === t.id ? "text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {tab === t.id && (
                    <motion.span
                      layoutId="settings-tab"
                      className="absolute inset-0 rounded-lg bg-hover-strong"
                      transition={{ type: "spring", stiffness: 480, damping: 36 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {t.icon}
                    {t.label}
                  </span>
                </button>
              ))}
            </div>

            {/* body */}
            <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                >
                  {tab === "connectors" && <ConnectorsTab />}
                  {tab === "appearance" && <AppearanceTab />}
                  {tab === "account" && <AccountTab onDone={onClose} />}
                  {tab === "about" && <AboutTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── connectors ────────────────────────────────────────────────────────── */

function ConnectorsTab() {
  const user = useApp((s) => s.user);
  const owner = user?.email || "guest";

  const [states, setStates] = useState<Record<string, ConnectorState>>({});
  const [openId, setOpenId] = useState<ConnectorId | null>(null);

  useEffect(() => {
    setStates(loadConnectorStates());
  }, []);

  const update = (id: ConnectorId, next: ConnectorState) => {
    setStates((prev) => {
      const merged = { ...prev, [id]: next };
      saveStates(merged);
      return merged;
    });
  };

  const online = Object.values(states).filter((s) => s.on).length;

  const groups = useMemo(() => {
    const map = new Map<string, Connector[]>();
    for (const c of CONNECTORS) {
      const list = map.get(c.category) ?? [];
      list.push(c);
      map.set(c.category, list);
    }
    return [...map.entries()];
  }, []);

  return (
    <div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-muted">
        Everything below works with something you already have. The ones marked{" "}
        <span className="rounded bg-accent/15 px-1 py-0.5 text-[11px] font-semibold text-accent-light">
          no key
        </span>{" "}
        start working the moment you switch them on.
      </p>

      <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2.5">
        <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-subtle"}`} />
        <p className="text-[12px] text-muted">
          {online ? `${online} connector${online === 1 ? "" : "s"} online` : "Nothing connected yet"}
        </p>
      </div>

      {groups.map(([category, list]) => (
        <div key={category} className="mb-5">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
            {category}
          </p>
          <div className="space-y-2">
            {list.map((c) => (
              <ConnectorCard
                key={c.id}
                connector={c}
                state={states[c.id] ?? { on: false, filled: {} }}
                owner={owner}
                open={openId === c.id}
                onOpen={() => setOpenId(openId === c.id ? null : c.id)}
                onState={(s) => update(c.id, s)}
              />
            ))}
          </div>
        </div>
      ))}

      <p className="mt-6 text-[11.5px] leading-relaxed text-subtle">
        Keys are encrypted and kept in this browser only — they never reach Keew&apos;s database or
        server, except the Vercel call, which has to pass through a route because Vercel blocks
        direct browser requests.
      </p>
    </div>
  );
}

function ConnectorCard({
  connector: c,
  state,
  owner,
  open,
  onOpen,
  onState,
}: {
  connector: Connector;
  state: ConnectorState;
  owner: string;
  open: boolean;
  onOpen: () => void;
  onState: (s: ConnectorState) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // when reopening, load what is already in the vault so the user sees it is set
  useEffect(() => {
    if (!open) return;
    void (async () => {
      const next: Record<string, string> = {};
      for (const f of c.fields) {
        const v = await readField(c.id, f.key, owner);
        if (v) next[f.key] = v;
      }
      setValues(next);
    })();
  }, [open, c, owner]);

  const connect = async () => {
    setBusy(true);
    setResult(null);

    // store whatever was typed first, so a failed check does not lose the key
    for (const f of c.fields) {
      const v = values[f.key]?.trim();
      if (v) await saveField(c.id, f.key, v, owner);
    }

    const check = await checkConnector(c.id, values);
    setBusy(false);
    setResult(check);

    if (check.ok) {
      onState({
        on: true,
        filled: Object.fromEntries(c.fields.map((f) => [f.key, Boolean(values[f.key]?.trim())])),
        checkedAt: Date.now(),
        label: check.message,
      });
    }
  };

  const disconnect = async () => {
    await forgetConnector(c.id, c.fields.map((f) => f.key));
    setValues({});
    setResult(null);
    onState({ on: false, filled: {} });
  };

  const toggleKeyless = async () => {
    if (state.on) {
      onState({ on: false, filled: {} });
      return;
    }
    setBusy(true);
    const check = await checkConnector(c.id, {});
    setBusy(false);
    setResult(check);
    if (check.ok) onState({ on: true, filled: {}, checkedAt: Date.now(), label: check.message });
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors ${
        state.on ? "border-accent/35 bg-accent/[0.04]" : "border-border bg-panel/60"
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-raised text-[12px] font-bold text-muted">
          {c.name.slice(0, 2).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-fg">{c.name}</p>
            {c.keyless && (
              <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-accent-light">
                no key
              </span>
            )}
            {state.on && (
              <span className="flex items-center gap-1 text-[10.5px] font-medium text-emerald-400">
                <IconCheck size={10} /> on
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{c.blurb}</p>
        </div>

        {/* switch, or expand for keyed connectors */}
        {c.keyless ? (
          <button
            onClick={() => void toggleKeyless()}
            disabled={busy}
            className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
              state.on ? "bg-accent" : "bg-border-strong"
            }`}
            aria-label={`${state.on ? "Disconnect" : "Connect"} ${c.name}`}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 520, damping: 32 }}
              className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow ${
                state.on ? "left-[19px]" : "left-[3px]"
              }`}
            />
          </button>
        ) : (
          <button
            onClick={onOpen}
            className="shrink-0 rounded-lg border border-border-strong px-2 py-1 text-[11.5px] font-medium text-muted transition-colors hover:bg-hover hover:text-fg"
          >
            {open ? "Close" : state.on ? "Manage" : "Connect"}
          </button>
        )}
      </div>

      {/* expanded */}
      <AnimatePresence initial={false}>
        {open && !c.keyless && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-3 py-3">
              <ul className="mb-3 space-y-1">
                {c.does.map((d) => (
                  <li key={d} className="flex gap-1.5 text-[11.5px] leading-relaxed text-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                    {d}
                  </li>
                ))}
              </ul>

              {c.fields.map((f) => (
                <div key={f.key} className="mb-3">
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[11.5px] font-medium text-fg">{f.label}</label>
                    {f.link && (
                      <a
                        href={f.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10.5px] text-accent-light hover:underline"
                      >
                        {f.link.label} ↗
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={f.secret && !reveal[f.key] ? "password" : "text"}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full rounded-lg border border-border-strong bg-bg px-2.5 py-2 pr-9 font-mono text-[12px] text-fg outline-none transition-colors placeholder:text-subtle focus:border-accent/60"
                    />
                    {f.secret && (
                      <button
                        onClick={() => setReveal((r) => ({ ...r, [f.key]: !r[f.key] }))}
                        className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded text-subtle hover:text-fg"
                        aria-label={reveal[f.key] ? "Hide" : "Show"}
                      >
                        {reveal[f.key] ? <IconEyeOff size={13} /> : <IconEye size={13} />}
                      </button>
                    )}
                  </div>
                  {f.hint && <p className="mt-1 text-[10.5px] leading-relaxed text-subtle">{f.hint}</p>}
                </div>
              ))}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => void connect()}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-60"
                >
                  {busy && <Spinner size={12} />}
                  {state.on ? "Check again" : "Connect"}
                </button>

                {state.on && (
                  <button
                    onClick={() => void disconnect()}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11.5px] text-muted transition-colors hover:bg-hover hover:text-fg"
                  >
                    <IconTrash size={12} />
                    Disconnect
                  </button>
                )}
              </div>

              <AnimatePresence>
                {result && (
                  <motion.p
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-2 rounded-lg px-2.5 py-1.5 text-[11.5px] leading-relaxed ${
                      result.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {result.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* keyless check result */}
      <AnimatePresence>
        {result && c.keyless && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`overflow-hidden border-t border-border px-3 text-[11px] leading-relaxed ${
              result.ok ? "py-2 text-emerald-400" : "py-2 text-red-400"
            }`}
          >
            {result.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── appearance ────────────────────────────────────────────────────────── */

function AppearanceTab() {
  const { prefs, set } = usePrefs();

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[12px] font-semibold text-fg">Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "dark", label: "Dark", bg: "#0a0a0a", panel: "#1b1b1a", fg: "#f0efed" },
              { id: "light", label: "Light", bg: "#fbfaf7", panel: "#ffffff", fg: "#1e1d1a" },
              { id: "gray", label: "Gray", bg: "#1a1a1c", panel: "#26262a", fg: "#ececef" },
            ] as { id: Theme; label: string; bg: string; panel: string; fg: string }[]
          ).map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => set("theme", t.id)}
              className={`overflow-hidden rounded-xl border p-2 text-left transition-colors ${
                prefs.theme === t.id ? "border-accent ring-1 ring-accent/40" : "border-border hover:border-border-strong"
              }`}
            >
              <span
                className="mb-2 flex h-12 flex-col justify-end gap-1 rounded-lg p-1.5"
                style={{ background: t.bg }}
              >
                <span className="h-1.5 w-2/3 rounded-full" style={{ background: t.panel }} />
                <span className="h-1.5 w-1/2 rounded-full" style={{ background: t.fg, opacity: 0.5 }} />
                <span className="h-1 w-8 rounded-full bg-[#0048f8]" />
              </span>
              <span className="flex items-center justify-between px-0.5">
                <span className="text-[11.5px] font-medium text-fg">{t.label}</span>
                {prefs.theme === t.id && <IconCheck size={12} className="text-accent-light" />}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <Row label="Text size" hint="Applies to the whole interface.">
        <div className="flex items-center gap-1">
          {[
            { v: 0.9, l: "A", size: "text-[12px]" },
            { v: 1, l: "A", size: "text-[14px]" },
            { v: 1.1, l: "A", size: "text-[16px]" },
            { v: 1.2, l: "A", size: "text-[18px]" },
          ].map((s) => (
            <button
              key={s.v}
              onClick={() => set("textScale", s.v)}
              className={`grid h-8 w-8 place-items-center rounded-lg font-medium transition-colors ${s.size} ${
                prefs.textScale === s.v ? "bg-accent text-white" : "text-muted hover:bg-hover hover:text-fg"
              }`}
              aria-label={`Text size ${s.v}`}
            >
              {s.l}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Density" hint="Compact fits more on a short screen.">
        <Segmented
          value={prefs.density}
          onChange={(v) => set("density", v as Density)}
          options={[
            { value: "comfortable", label: "Comfortable" },
            { value: "compact", label: "Compact" },
          ]}
        />
      </Row>

      <Row label="Motion" hint="Reduced turns off the animations.">
        <Segmented
          value={prefs.motion}
          onChange={(v) => set("motion", v as "full" | "reduced")}
          options={[
            { value: "full", label: "Full" },
            { value: "reduced", label: "Reduced" },
          ]}
        />
      </Row>

      <div className="space-y-1">
        <Toggle
          label="Show message times"
          hint="A small timestamp under each message."
          value={prefs.showTimes}
          onChange={(v) => set("showTimes", v)}
        />
        <Toggle
          label="Enter sends the message"
          hint="Off means Enter adds a line and ⌘↵ sends."
          value={prefs.enterToSend}
          onChange={(v) => set("enterToSend", v)}
        />
      </div>
    </div>
  );
}

/* ── account ───────────────────────────────────────────────────────────── */

function AccountTab({ onDone }: { onDone: () => void }) {
  const { user, profile, chats, clearChats, signOut } = useApp();
  const dbEnabled = useApp((s) => s.dbEnabled);
  const [confirm, setConfirm] = useState(false);

  const exportHistory = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      account: user?.email ?? null,
      chats: chats.map((c) => ({
        title: c.title,
        updatedAt: c.updated_at,
        messages: c.messages.map((m) => ({ role: m.role, content: m.content })),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `keew-chats-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      {user ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-panel p-3">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent-light">
              <IconUser size={17} />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-fg">
              {profile?.display_name || "You"}
            </p>
            <p className="truncate text-[11.5px] text-subtle">{user.email}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-panel p-3">
          <p className="text-[12.5px] font-medium text-fg">You are not signed in</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
            Chats stay in this browser. Sign in from the bottom of the sidebar to save them to your
            account and open them on any device.
          </p>
          {!dbEnabled && (
            <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-400">
              This deployment has no database configured yet, so accounts are off.
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <ActionRow
          label="Export my chats"
          hint="Downloads a JSON file with everything in this account."
          onClick={exportHistory}
          icon={<IconDownload size={14} />}
        />
        <ActionRow
          label={confirm ? "Click again to delete everything" : "Delete all my chats"}
          hint={confirm ? "This cannot be undone." : "Removes every conversation from this account."}
          danger
          onClick={() => {
            if (!confirm) return setConfirm(true);
            void clearChats();
            setConfirm(false);
            onDone();
          }}
          icon={<IconTrash size={14} />}
        />
        {user && (
          <ActionRow
            label="Sign out"
            hint="You can sign back in any time."
            onClick={() => {
              void signOut();
              onDone();
            }}
            icon={<IconLogout size={14} />}
          />
        )}
      </div>
    </div>
  );
}

/* ── about ─────────────────────────────────────────────────────────────── */

function AboutTab() {
  return (
    <div className="space-y-4 text-[12.5px] leading-relaxed text-muted">
      <div className="rounded-xl border border-border bg-panel p-4">
        <p className="text-[13px] font-semibold text-fg">Keew IA</p>
        <p className="mt-1.5">
          An artificial intelligence built and owned by Veexdevs. The interface runs on Next.js; the
          deterministic core does arithmetic, dates, units, summaries and text work without calling
          anything external.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
          What is honest to say
        </p>
        <ul className="space-y-1.5">
          {[
            "Chats and messages are saved to your account, in a database only your account can read.",
            "Connectors with a key keep that key encrypted in this browser, never on the server.",
            "Open-ended conversation needs a language engine connected — without one, Keew says so instead of guessing.",
            "Images and videos are shown, not understood, until a vision engine is connected.",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-subtle">
        Version 3 · interface in English · theme and preferences stored on this device.
      </p>
    </div>
  );
}

/* ── small pieces ──────────────────────────────────────────────────────── */

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-fg">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] leading-relaxed text-subtle">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-0.5 rounded-lg border border-border bg-panel p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="relative rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors"
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${options.map((x) => x.value).join("-")}`}
              className="absolute inset-0 rounded-md bg-hover-strong"
              transition={{ type: "spring", stiffness: 480, damping: 36 }}
            />
          )}
          <span className={`relative ${value === o.value ? "text-fg" : "text-muted"}`}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-1 py-2.5">
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-fg">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] leading-relaxed text-subtle">{hint}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
          value ? "bg-accent" : "bg-border-strong"
        }`}
        role="switch"
        aria-checked={value}
        aria-label={label}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 520, damping: 32 }}
          className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow ${
            value ? "left-[19px]" : "left-[3px]"
          }`}
        />
      </button>
    </div>
  );
}

function ActionRow({
  label,
  hint,
  onClick,
  icon,
  danger,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-hover ${
        danger ? "text-red-400" : "text-fg"
      }`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] leading-relaxed text-subtle">{hint}</span>}
      </span>
    </button>
  );
}

/* ── tab icons ─────────────────────────────────────────────────────────── */

function PlugIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 3v5M15 3v5M6.5 8h11v1.5a5.5 5.5 0 0 1-11 0Z" />
      <path d="M12 15v6" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20s-7.5-4.7-7.5-9.7A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 3.1c0 5-7.5 9.7-7.5 9.7Z" />
    </svg>
  );
}
