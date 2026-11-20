"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  CurrencyMark,
  GitHubMark,
  HackerNewsMark,
  SupabaseMark,
  VercelMark,
  WeatherMark,
  WikipediaMark,
} from "./brand-icons";
import { Flag } from "./flags";
import { Wordmark } from "./logo";
import { Spinner } from "./modals";
import {
  IconCheck,
  IconClose,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconLogout,
  IconSearch,
  IconTrash,
  IconUser,
  IconChevronLeft,
  IconGlobe,
  IconGear,
  IconPlug,
  IconSunRays,
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
import { LANGUAGE_BY_TAG, detectLocale } from "@/lib/i18n";
import { languageRows } from "@/lib/i18n/languages";
import { useLocale } from "@/lib/i18n/store";
import { useT } from "@/lib/i18n/use";
import { usePrefs, type Density, type Theme } from "@/lib/settings";
import { useApp } from "@/lib/store";

type Tab = "connectors" | "appearance" | "language" | "account" | "about";

const TABS: { id: Tab; icon: React.ReactNode }[] = [
  { id: "connectors", icon: <IconPlug size={13} /> },
  { id: "appearance", icon: <IconSunRays size={13} /> },
  { id: "language", icon: <IconGlobe size={13} /> },
  { id: "account", icon: <IconUser size={13} /> },
  { id: "about", icon: <IconGear size={16} /> },
];

/* ── the panel ─────────────────────────────────────────────────────────── */

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("connectors");
  const [dir, setDir] = useState(0);
  const tt = useT();
  const locale = useLocale((s) => s.locale);

  /* the strip scrolls itself to the active tab; the pane scrolls to the top */
  const stripRef = useRef<HTMLDivElement | null>(null);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const touch = useRef<{ x: number; y: number; at: number } | null>(null);

  const order = TABS.map((t) => t.id);
  const index = Math.max(0, order.indexOf(tab));

  /* In Arabic and Hebrew the pager runs the other way: the first section sits
     on the right, and a swipe to the left goes back, not forward. */

  /* swiping left goes forward, right goes back — and never past the ends */
  const go = (delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= order.length) return;
    setDir(delta);
    setTab(order[next]);
    requestAnimationFrame(() => paneRef.current?.scrollTo({ top: 0 }));
  };

  /* tapping a tab name: same move, and the new pane starts at its top */
  const jump = (id: Tab) => {
    const next = order.indexOf(id);
    if (next === index) return;
    setDir(next > index ? 1 : -1);
    setTab(id);
    requestAnimationFrame(() => paneRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  };

  /* keep the active tab visible in the strip, which is wider than the panel */
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>(`[data-tab="${tab}"]`);
    if (!active) return;
    const hidden = strip.scrollWidth > strip.clientWidth;
    if (!hidden) return;
    const left = active.offsetLeft - strip.clientWidth / 2 + active.offsetWidth / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [tab]);

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
          aria-label={tt("settings.title")}
        >
          <motion.aside
            initial={{ x: 34, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 34, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full flex-col bg-bg"
          >
            {/* topo: a marca, como na referência */}
            <div className="flex shrink-0 items-center justify-between pl-[17px] pr-6 pb-0 pt-[calc(env(safe-area-inset-top)+21px)]">
              <Wordmark size={23} fontSize={17} />
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full text-fg transition-colors hover:bg-hover"
                aria-label={tt("common.close")}
              >
                <IconClose size={22} strokeWidth={2.2} />
              </motion.button>
            </div>

            <div className="shrink-0 pl-[17px] pr-6 pt-[24px]">
              <h2 className="text-[16.5px] font-bold leading-none tracking-[-0.005em] text-fg">
                {tt("settings.title")}
              </h2>
            </div>

            {/* pager: pílula com as setas nas pontas */}
            <div className="mx-[17px] mt-[13px] flex h-[31px] shrink-0 items-center justify-between rounded-full border border-[var(--drawer-border)] bg-[var(--drawer-card)] px-3">
              <button
                onClick={() => go(-1)}
                disabled={index === 0}
                className="grid h-7 w-7 place-items-center text-fg transition-opacity disabled:opacity-30"
                aria-label={tt("settings.prev")}
              >
                <IconChevronLeft size={17} strokeWidth={2} />
              </button>
              <span className="text-[13.5px] font-medium tracking-[0.01em] text-fg">
                {index + 1} / {order.length}
              </span>
              <button
                onClick={() => go(1)}
                disabled={index === order.length - 1}
                className="grid h-7 w-7 place-items-center text-fg transition-opacity disabled:opacity-30"
                aria-label={tt("settings.next")}
              >
                <IconChevronLeft size={17} strokeWidth={2} className="rotate-180" />
              </button>
            </div>

            {/* abas: pílula única com a seção ativa realçada e o fio azul embaixo */}
            <div
              ref={stripRef}
              role="tablist"
              className="mt-[12px] shrink-0 overflow-x-auto px-[15.5px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex h-[38px] w-max min-w-full items-stretch rounded-full border border-[var(--drawer-border)] px-[2px]">
                {TABS.map((item) => {
                  const on = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      data-tab={item.id}
                      role="tab"
                      aria-selected={on}
                      onClick={() => jump(item.id)}
                      className={`relative flex shrink-0 items-center justify-center gap-[3px] px-[3.5px] text-[11.5px] transition-colors ${
                        on ? "font-semibold text-fg" : "font-medium text-muted hover:text-fg"
                      }`}
                    >
                      {on && (
                        <motion.span
                          layoutId="settings-tab"
                          className="absolute inset-x-0 inset-y-0 rounded-full bg-[var(--drawer-card)] shadow-[inset_0_0_0_1px_var(--drawer-border-strong)]"
                          transition={{ type: "spring", stiffness: 480, damping: 36 }}
                        />
                      )}
                      <span
                        className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap ${
                          on ? "" : ""
                        }`}
                      >
                        <span className={on ? "text-accent" : ""}>{item.icon}</span>
                        {tt(`settings.tab.${item.id}`)}
                      </span>
                      {on && (
                        <motion.span
                          layoutId="settings-tab-line"
                          className="absolute inset-x-1 -bottom-[1px] h-[2px] rounded-full bg-accent"
                          transition={{ type: "spring", stiffness: 480, damping: 36 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* body — the only place that votes on a swipe. A short move with
                real speed (a flick) counts too, which is how a phone scrolls. */}
            <div
              ref={paneRef}
              className="scroll-thin relative flex-1 overflow-y-auto overscroll-contain px-[17px] pb-8 pt-[27px]"
              onTouchStart={(e) => {
                const t = e.touches[0];
                touch.current = { x: t.clientX, y: t.clientY, at: Date.now() };
              }}
              onTouchEnd={(e) => {
                const from = touch.current;
                if (!from) return;
                touch.current = null;
                const t = e.changedTouches[0];
                const dx = t.clientX - from.x;
                const dy = t.clientY - from.y;
                const ms = Math.max(1, Date.now() - from.at);
                /* horizontal intent only: a vertical scroll must never page */
                const speed = Math.abs(dx) / ms;
                const sideways = Math.abs(dx) >= 60 && Math.abs(dx) >= Math.abs(dy) * 1.6;
                const flick = Math.abs(dx) >= 24 && speed >= 0.5 && Math.abs(dx) >= Math.abs(dy);
                if (!sideways && !flick) return;
                /* finger moved left → next section; moved right → previous */
                go(dx < 0 ? 1 : -1);
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, x: dir * 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -10 }}
                  transition={{ duration: 0.16 }}
                >
                  {tab === "connectors" && <ConnectorsTab />}
                  {tab === "appearance" && <AppearanceTab />}
                  {tab === "language" && <LanguageTab />}
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

const MARKS: Record<ConnectorId, React.ReactNode> = {
  github: <GitHubMark size={19} />,
  vercel: <VercelMark size={18} />,
  supabase: <SupabaseMark size={19} />,
  wikipedia: <WikipediaMark size={19} />,
  hn: <HackerNewsMark size={19} />,
  weather: <WeatherMark size={19} />,
  currency: <CurrencyMark size={19} />,
};

function ConnectorsTab() {
  const tt = useT();
  const user = useApp((s) => s.user);
  const owner = user?.email || "guest";

  const [states, setStates] = useState<Record<string, ConnectorState>>({});
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Connector | null>(null);
  const [busyId, setBusyId] = useState<ConnectorId | null>(null);
  const [note, setNote] = useState<{ id: ConnectorId; ok: boolean; text: string } | null>(null);

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

  const list = query.trim()
    ? CONNECTORS.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : CONNECTORS;

  const online = Object.values(states).filter((s) => s.on).length;

  /* a keyless connector connects with one real call */
  const toggleKeyless = async (c: Connector) => {
    if (states[c.id]?.on) {
      update(c.id, { on: false, filled: {} });
      return;
    }
    setBusyId(c.id);
    const check = await checkConnector(c.id, {});
    setBusyId(null);
    setNote({ id: c.id, ok: check.ok, text: check.message });
    if (check.ok) update(c.id, { on: true, filled: {}, checkedAt: Date.now(), label: check.message });
  };

  return (
    <div>
      {/* search */}
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-panel px-2.5 py-2">
        <IconSearch size={14} className="shrink-0 text-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tt("settings.searchConnectors")}
          className="w-full bg-transparent text-[12.5px] text-fg outline-none placeholder:text-subtle"
        />
        {query && (
          <button onClick={() => setQuery("")} className="shrink-0 text-subtle hover:text-fg" aria-label={tt("common.search")}>
            <IconClose size={13} />
          </button>
        )}
      </div>

      <p className="mb-2 px-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
        {online ? tt("settings.onCount", { n: online }) : tt("settings.off")}
      </p>

      <div className="space-y-1.5">
        {list.map((c) => {
          const on = Boolean(states[c.id]?.on);
          const busy = busyId === c.id;
          return (
            <div
              key={c.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                on ? "border-accent/35 bg-accent/[0.05]" : "border-border bg-panel/50"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  on ? "bg-raised text-fg" : "bg-raised text-muted"
                }`}
              >
                {MARKS[c.id]}
              </span>

              <button
                onClick={() => (c.keyless ? void toggleKeyless(c) : setActive(c))}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-[13px] font-medium text-fg">{c.name}</p>
                {note?.id === c.id && (
                  <p className={`truncate text-[10.5px] ${note.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {note.text}
                  </p>
                )}
              </button>

              {busy ? (
                <Spinner size={14} />
              ) : (
                <button
                  onClick={() => (c.keyless ? void toggleKeyless(c) : setActive(c))}
                  role="switch"
                  aria-checked={on}
                  aria-label={on ? tt("common.disconnect") : tt("common.connect")}
                  className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
                    on ? "bg-accent" : "bg-border-strong"
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 520, damping: 32 }}
                    className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow ${
                      on ? "left-[19px]" : "left-[3px]"
                    }`}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {query && !list.length && (
        <p className="py-6 text-center text-[12px] text-subtle">{tt("settings.noConnector")}</p>
      )}

      <p className="mt-5 px-1 text-[11px] leading-relaxed text-subtle">
        {tt("settings.connectorsNote")}
      </p>

      {/* key sheet */}
      <ConnectorSheet
        connector={active}
        owner={owner}
        onClose={() => setActive(null)}
        onState={(id, st) => update(id, st)}
      />
    </div>
  );
}

/** The small sheet for connectors that need a key, opened from the toggle. */
function ConnectorSheet({
  connector: c,
  owner,
  onClose,
  onState,
}: {
  connector: Connector | null;
  owner: string;
  onClose: () => void;
  onState: (id: ConnectorId, s: ConnectorState) => void;
}) {
  const tt = useT();
  const [values, setValues] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!c) return;
    setResult(null);
    void (async () => {
      const next: Record<string, string> = {};
      for (const f of c.fields) {
        const v = await readField(c.id, f.key, owner);
        if (v) next[f.key] = v;
      }
      setValues(next);
    })();
  }, [c, owner]);

  const connect = async () => {
    if (!c) return;
    setBusy(true);
    setResult(null);

    for (const f of c.fields) {
      const v = values[f.key]?.trim();
      if (v) await saveField(c.id, f.key, v, owner);
    }

    const check = await checkConnector(c.id, values);
    setBusy(false);
    setResult(check);

    if (check.ok) {
      onState(c.id, {
        on: true,
        filled: Object.fromEntries(c.fields.map((f) => [f.key, Boolean(values[f.key]?.trim())])),
        checkedAt: Date.now(),
        label: check.message,
      });
      setTimeout(onClose, 900);
    }
  };

  const disconnect = async () => {
    if (!c) return;
    await forgetConnector(c.id, c.fields.map((f) => f.key));
    setValues({});
    onState(c.id, { on: false, filled: {} });
    onClose();
  };

  return (
    <AnimatePresence>
      {c && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ y: 24, opacity: 0.7 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-t-2xl border border-border bg-panel p-4 shadow-2xl sm:rounded-2xl"
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-raised text-fg">
                {MARKS[c.id]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-fg">{c.name}</p>
                <p className="truncate text-[11px] text-subtle">{c.blurb}</p>
              </div>
              <button
                onClick={onClose}
                className="grid h-7 w-7 place-items-center rounded-lg text-subtle hover:bg-hover hover:text-fg"
                aria-label={tt("common.close")}
              >
                <IconClose size={15} />
              </button>
            </div>

            {c.fields.map((f) => (
              <div key={f.key} className="mb-2.5">
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
                      aria-label={reveal[f.key] ? tt("login.hidePw") : tt("login.showPw")}
                    >
                      {reveal[f.key] ? <IconEyeOff size={13} /> : <IconEye size={13} />}
                    </button>
                  )}
                </div>
                {f.hint && <p className="mt-1 text-[10.5px] leading-relaxed text-subtle">{f.hint}</p>}
              </div>
            ))}

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => void connect()}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-60"
              >
                {busy && <Spinner size={12} />}
                Connect
              </button>
              <button
                onClick={() => void disconnect()}
                className="rounded-lg px-2.5 py-2 text-[11.5px] text-muted transition-colors hover:bg-hover hover:text-fg"
              >
                {tt("common.disconnect")}
              </button>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── appearance ────────────────────────────────────────────────────────── */

function AppearanceTab() {
  const tt = useT();
  const { prefs, set } = usePrefs();

  return (
    <div className="space-y-[17px]">
      <div>
        <p className="mb-3 text-[15px] font-semibold leading-[1.15] text-fg">{tt("appearance.theme")}</p>
        <div className="grid grid-cols-3 gap-[8px]">
          {(
            [
              {
                id: "dark",
                label: tt("appearance.dark"),
                bg: "#0c0c0d",
                line1: "#7e7f88",
                line2: "#6f707a",
                accent: "#0054ff",
              },
              {
                id: "light",
                label: tt("appearance.light"),
                bg: "#ecedf2",
                line1: "#d3d4db",
                line2: "#c3c4cc",
                accent: "#0070ff",
              },
              {
                id: "gray",
                label: tt("appearance.gray"),
                bg: "#1a1d24",
                line1: "#3a4152",
                line2: "#59637a",
                accent: "#0062ff",
              },
            ] as { id: Theme; label: string; bg: string; line1: string; line2: string; accent: string }[]
          ).map((t) => {
            const on = prefs.theme === t.id;
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.985 }}
                onClick={() => set("theme", t.id)}
                className={`text-left transition-colors ${
                  on
                    ? "rounded-[19px] border-[1.5px] border-[#0054ff] p-[6px]"
                    : "rounded-[19px] border border-[rgba(255,255,255,0.085)] p-[6.5px]"
                }`}
              >
                <span
                  className="flex h-[42px] flex-col justify-center gap-[6px] overflow-hidden rounded-[6px] px-[9px]"
                  style={{ background: t.bg }}
                >
                  <span className="h-[4.5px] w-[27px] rounded-full" style={{ background: t.line1 }} />
                  <span className="h-[4.5px] w-[17px] rounded-full" style={{ background: t.line2 }} />
                  <span className="h-[4.5px] w-[27px] rounded-full" style={{ background: t.accent }} />
                </span>
                <span className="mt-[4px] flex items-center justify-between px-[3px] leading-none">
                  <span className="text-[13px] font-medium leading-none text-fg">{t.label}</span>
                  {on && <IconCheck size={16} strokeWidth={2.6} className="text-accent" />}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <Row label={tt("appearance.textSize")} hint={tt("appearance.textSizeHint")}>
        <div className="flex items-center gap-[3.1px]">
          {[
            { v: 0.9, size: "text-[12.5px]" },
            { v: 1, size: "text-[14.5px]" },
            { v: 1.1, size: "text-[16.5px]" },
            { v: 1.2, size: "text-[18.5px]" },
          ].map((s) => {
            const on = prefs.textScale === s.v;
            return (
              <button
                key={s.v}
                onClick={() => set("textScale", s.v)}
                className={`grid h-[30px] w-[30px] place-items-center rounded-[9px] font-medium transition-colors ${s.size} ${
                  on ? "bg-accent text-white" : "text-muted hover:bg-hover hover:text-fg"
                }`}
                aria-label={`Text size ${s.v}`}
              >
                A
              </button>
            );
          })}
        </div>
      </Row>

      <Row label={tt("appearance.density")} hint={tt("appearance.densityHint")}>
        <Segmented
          value={prefs.density}
          onChange={(v) => set("density", v as Density)}
          options={[
            { value: "comfortable", label: tt("appearance.comfortable") },
            { value: "compact", label: tt("appearance.compact") },
          ]}
        />
      </Row>

      <Row label={tt("appearance.motion")} hint={tt("appearance.motionHint")}>
        <Segmented
          value={prefs.motion}
          onChange={(v) => set("motion", v as "full" | "reduced")}
          options={[
            { value: "full", label: tt("appearance.full") },
            { value: "reduced", label: tt("appearance.reduced") },
          ]}
        />
      </Row>

      <div>
        <Toggle
          label={tt("appearance.showTimes")}
          hint={tt("appearance.showTimesHint")}
          value={prefs.showTimes}
          onChange={(v) => set("showTimes", v)}
        />
        <Toggle
          label={tt("appearance.enterSends")}
          hint={tt("appearance.enterSendsHint")}
          value={prefs.enterToSend}
          onChange={(v) => set("enterToSend", v)}
        />
      </div>
    </div>
  );
}

/* ── language ──────────────────────────────────────────────────────────── */

function LanguageTab() {
  const tt = useT();
  const { tag, auto, choose, translating } = useLocale();
  const [query, setQuery] = useState("");

  const detected = detectLocale();

  /* Search over what a person would actually type: the language in its own
     name, its English name, the code, and — for the 181 languages nobody can
     list from memory — the country it is usually attached to. Accents are
     folded both ways, so "russia" finds "Русский" and "japao" finds "日本語". */
  const needle = fold(query.trim());
  const list = useMemo(() => {
    const rows = languageRows();
    if (!needle) return rows;
    return rows.filter(
      (l) =>
        fold(l.name).includes(needle) ||
        fold(l.native).includes(needle) ||
        fold(l.tag).includes(needle) ||
        fold(l.flag ?? "").includes(needle),
    );
  }, [needle]);

  const detectedLanguage = LANGUAGE_BY_TAG.get(detected);

  return (
    <div className="space-y-4">
      <p className="text-[12px] leading-relaxed text-muted">{tt("language.hint")}</p>

      {/* search */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
          <IconSearch size={14} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tt("language.search")}
          aria-label={tt("language.search")}
          className="w-full rounded-xl border border-border bg-panel/60 py-2.5 pl-9 pr-9 text-[13px] text-fg outline-none transition-colors placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-subtle transition-colors hover:bg-hover hover:text-fg"
            aria-label={tt("common.close")}
          >
            <IconClose size={13} />
          </button>
        )}
      </div>

      {/* The list is 181 rows long and most of them are not translated yet.
          Saying so up front is more honest than letting someone pick Yoruba and
          wonder why the buttons are still English. */}
      {translating && (
        <p className="rounded-lg border border-border bg-panel/50 px-3 py-2 text-[11.5px] leading-relaxed text-subtle">
          {tt("language.translating")}
        </p>
      )}

      <div className="space-y-1.5">
        {/* automatic — the fallback that always exists */}
        {!needle && (
          <button
            onClick={() => choose("auto")}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
              auto ? "border-accent/40 bg-accent/[0.06]" : "border-border bg-panel/50 hover:bg-hover"
            }`}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-raised text-muted">
              <GlobeIcon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-fg">{tt("language.auto")}</span>
              <span className="block truncate text-[11px] text-subtle">
                {tt("language.autoDetected", { lang: detectedLanguage?.native ?? "English" })}
              </span>
            </span>
            {auto && <IconCheck size={15} className="shrink-0 text-accent-light" />}
          </button>
        )}

        {list.map((l) => {
          const on = !auto && tag === l.tag;
          return (
            <button
              key={l.key}
              onClick={() => choose(l.value)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                on ? "border-accent/40 bg-accent/[0.06]" : "border-border bg-panel/50 hover:bg-hover"
              }`}
            >
              <Flag code={l.flag} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-fg">{l.native}</span>
                <span className="block truncate text-[11px] text-subtle">{l.name}</span>
              </span>
              {on && <IconCheck size={15} className="shrink-0 text-accent-light" />}
            </button>
          );
        })}

        {list.length === 0 && (
          <p className="px-1 py-6 text-center text-[12.5px] text-subtle">{tt("language.none")}</p>
        )}
      </div>
    </div>
  );
}

/** lower-cased and accent-free, so a search ignores diacritics */
function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/* ── account ───────────────────────────────────────────────────────────── */

function AccountTab({ onDone }: { onDone: () => void }) {
  const tt = useT();
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
            {/* este bloco JÁ é a aba Conta, então o endereço pode aparecer
                aqui — é o único lugar onde ele existe na tela */}
            <p className="truncate text-[11.5px] text-subtle">{user.email}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-panel p-3">
          <p className="text-[12.5px] font-medium text-fg">{tt("account.notSignedIn")}</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
            {tt("account.notSignedInHint")}
          </p>
          {!dbEnabled && (
            <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-400">
              {tt("account.noDb")}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <ActionRow
          label={tt("account.export")}
          hint={tt("account.exportHint")}
          onClick={exportHistory}
          icon={<IconDownload size={14} />}
        />
        <ActionRow
          label={confirm ? tt("account.deleteConfirm") : tt("account.delete")}
          hint={confirm ? tt("account.deleteConfirmHint") : tt("account.deleteHint")}
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
            label={tt("chat.signOut")}
            hint={tt("account.signOutHint")}
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
  const tt = useT();
  return (
    <div className="space-y-4 text-[12.5px] leading-relaxed text-muted">
      <div className="rounded-xl border border-border bg-panel p-4">
        <p className="text-[13px] font-semibold text-fg">{tt("about.title")}</p>
        <p className="mt-1.5">{tt("about.body")}</p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
          {tt("about.honest")}
        </p>
        <ul className="space-y-1.5">
          {[
            tt("about.point1"),
            tt("about.point2"),
            tt("about.point3"),
            tt("about.point4"),
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* the installers live on their own site now — one line, no panel */}
      <a
        href="https://keew-get.vercel.app"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-2 rounded-xl border border-border bg-panel px-4 py-3 text-[12.5px] text-fg transition-colors hover:border-border-strong hover:bg-hover"
      >
        <span className="font-medium">{tt("about.getApps")}</span>
        <IconDownload size={14} className="shrink-0 text-subtle" />
      </a>

      <p className="text-[11px] text-subtle">
        {tt("about.version")}
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
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[14.5px] font-medium leading-[1.18] text-fg">{label}</p>
        {hint && <p className="mt-[2px] max-w-[186px] text-[11px] leading-[1.25] text-[#a9a9ae]">{hint}</p>}
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
    <div className="flex h-[31px] items-stretch rounded-full border border-[var(--drawer-border)] bg-[var(--drawer-card)] p-[2px]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="relative rounded-full px-[13px] text-[13.5px] font-medium transition-colors"
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${options.map((x) => x.value).join("-")}`}
              className="absolute inset-0 rounded-full bg-[var(--drawer-border-strong)]"
              transition={{ type: "spring", stiffness: 480, damping: 36 }}
            />
          )}
          <span className={`relative ${value === o.value ? "font-semibold text-fg" : "text-muted"}`}>
            {o.label}
          </span>
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
    <div className="flex items-center justify-between gap-3 py-[9px]">
      <div className="min-w-0">
        <p className="text-[14.5px] font-medium leading-[1.18] text-fg">{label}</p>
        {hint && <p className="mt-[2px] max-w-[205px] text-[11px] leading-[1.25] text-[#a9a9ae]">{hint}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-[23px] w-[41px] shrink-0 rounded-full transition-colors ${
          value ? "bg-accent" : "bg-[var(--drawer-border-strong)]"
        }`}
        role="switch"
        aria-checked={value}
        aria-label={label}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 520, damping: 32 }}
          className={`absolute top-[3px] h-[17px] w-[17px] rounded-full bg-white shadow ${
            value ? "left-[21px]" : "left-[3px]"
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

function GlobeIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.2 9h17.6M3.2 15h17.6" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
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
