"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { IconClose, IconEye, IconEyeOff, IconGoogle, IconUser } from "./icons";
import { Logo } from "./logo";
import { useStrings, useT } from "@/lib/i18n/use";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabase/client";

/* ── casca comum ───────────────────────────────────────────────────────── */

const backdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18 },
};

const panel = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 6 },
  transition: { type: "spring" as const, stiffness: 360, damping: 30 },
};

function Shell({
  open,
  onClose,
  children,
  width = 400,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
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
          {...backdrop}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            {...panel}
            style={{ maxWidth: width }}
            className="relative w-full overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Header({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  const t = useT();

  useStrings(["common.cancel", "common.close", "login.create", "login.createLink", "login.email", "login.errEmail", "login.errGoogle", "login.errGoogleProvider", "login.errGoogleRedirect", "login.errGoogleUrl", "login.errNoDb", "login.errPw", "login.errSignIn", "login.errUnavailable", "login.google", "login.googleNote", "login.haveAccount", "login.hidePw", "login.newHere", "login.noDb", "login.or", "login.password", "login.passwordHint", "login.showPw", "login.signIn", "login.signInLink", "login.signInSub", "login.signUp", "login.signUpSub", "login.welcome", "profile.avatarUrl", "profile.email", "profile.name", "profile.namePlaceholder", "profile.remove", "profile.save", "profile.subtitle", "profile.title", "profile.upload", "share.copied", "share.copy", "share.note", "share.subtitle", "share.title"]);
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-6 pb-5 pt-6">
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      <motion.button
        whileHover={{ rotate: 90, scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClose}
        className="-mr-1 -mt-1 rounded-lg p-1.5 text-subtle transition-colors hover:bg-dark hover:text-fg"
        aria-label={t("common.close")}
      >
        <IconClose size={17} />
      </motion.button>
    </div>
  );
}

/* ── login ─────────────────────────────────────────────────────────────── */

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const first = useRef<HTMLInputElement>(null);

  const enabled = isSupabaseConfigured();
  const t = useT();

  useEffect(() => {
    if (!open) return;
    setMsg(null);
    const t = setTimeout(() => first.current?.focus(), 220);
    return () => clearTimeout(t);
  }, [open, mode]);

  /* Which error code each failure maps to, in the person's language. */
  const say = (code: string) => {
    const map: Record<string, Parameters<typeof t>[0]> = {
      "wrong-credentials": "login.errWrong",
      invalid: "login.errWrong",
      "invalid-email": "login.errEmail",
      "weak-password": "login.errPw",
      "long-password": "login.errPw",
      exists: "login.errExists",
      unconfirmed: "login.errUnconfirmed",
      "rate-limited": "login.errRate",
      unavailable: "login.errUnavailable",
      "no-session": "login.errSignIn",
      "no-database": "login.errNoDb",
      "no-admin-key": "login.errNoDb",
    };
    setMsg({ kind: "error", text: t(map[code] ?? "login.errSignIn") });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb) {
      setMsg({ kind: "error", text: t("login.errNoDb") });
      return;
    }
    if (!email.includes("@")) {
      setMsg({ kind: "error", text: t("login.errEmail") });
      return;
    }
    if (password.length < 6) {
      setMsg({ kind: "error", text: t("login.errPw") });
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      if (mode === "signup") {
        /*
         * The account is created by our own route, which uses the admin API
         * instead of GoTrue's mailer. GoTrue sends a confirmation e-mail on
         * every signup, and on the free plan that mailer allows two an hour
         * for the whole project — the third person to sign up was getting an
         * error and no account. Confirmation is off here anyway, so that mail
         * was pure waste.
         */
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: email.split("@")[0] }),
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string };

        if (!res.ok) {
          setBusy(false);
          say(body.error ?? "unknown");
          return;
        }

        /* created and confirmed — sign straight in, no detour through e-mail */
        const { error } = await sb.auth.signInWithPassword({ email, password });
        setBusy(false);
        if (error) {
          setMsg({ kind: "error", text: t("login.errSignIn") });
          setMode("signin");
          return;
        }
        onClose();
        window.location.reload();
        return;
      }

      /* sign in: our route, so a paused project and a wrong password do not
         look the same */
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        session?: { access_token: string; refresh_token: string };
      };

      if (!res.ok || !body.session) {
        setBusy(false);
        say(body.error ?? "unknown");
        return;
      }

      /* hand the session to the browser client so @supabase/ssr writes the
         same cookies the server reads */
      const { error } = await sb.auth.setSession({
        access_token: body.session.access_token,
        refresh_token: body.session.refresh_token,
      });
      setBusy(false);
      if (error) {
        setMsg({ kind: "error", text: t("login.errSignIn") });
        return;
      }

      onClose();
      window.location.reload();
    } catch {
      setBusy(false);
      setMsg({ kind: "error", text: t("login.errUnavailable") });
    }
  };

  const google = async () => {
    const sb = supabaseBrowser();
    if (!sb) {
      setMsg({ kind: "error", text: t("login.errNoDb") });
      return;
    }
    if (busy) return;

    setBusy(true);
    setMsg(null);

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { data, error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    // on success the browser leaves for Google, so we only get here on failure
    if (error) {
      setBusy(false);
      const m = error.message.toLowerCase();
      const text = m.includes("not enabled") || m.includes("provider")
        ? t("login.errGoogleProvider")
        : m.includes("redirect") || m.includes("url")
          ? t("login.errGoogleRedirect", { url: redirectTo })
          : t("login.errGoogle");
      setMsg({ kind: "error", text });
      return;
    }

    if (!data?.url) {
      setBusy(false);
      setMsg({ kind: "error", text: t("login.errGoogleUrl") });
    }
  };

  return (
    <Shell open={open} onClose={onClose}>
      <Header
        title={mode === "signin" ? t("login.welcome") : t("login.create")}
        subtitle={
          mode === "signin" ? t("login.signInSub") : t("login.signUpSub")
        }
        onClose={onClose}
      />

      <form onSubmit={submit} className="px-6 py-5">
        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-subtle">
          {t("login.email")}
        </label>
        <input
          ref={first}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mb-4 w-full rounded-xl border border-border-strong bg-dark px-3.5 py-2.5 text-[14px] text-fg outline-none transition-all placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/25"
        />

        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-subtle">
          {t("login.password")}
        </label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.passwordHint")}
            className="w-full rounded-xl border border-border-strong bg-dark py-2.5 pl-3.5 pr-11 text-[14px] text-fg outline-none transition-all placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-subtle transition-colors hover:text-fg"
            aria-label={show ? t("login.hidePw") : t("login.showPw")}
          >
            {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </button>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.p
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 14 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className={`overflow-hidden rounded-lg px-3 py-2 text-[12.5px] leading-relaxed ${
                msg.kind === "error"
                  ? "bg-red-500/10 text-red-300"
                  : "bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {msg.text}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={busy || !enabled}
          whileHover={busy ? undefined : { scale: 1.01 }}
          whileTap={busy ? undefined : { scale: 0.985 }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-50"
        >
          {busy ? <Spinner /> : null}
          {mode === "signin" ? t("login.signIn") : t("login.signUp")}
        </motion.button>

        {!enabled && (
          <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] leading-relaxed text-amber-300/90">
            {t("login.noDb")}
          </p>
        )}

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-subtle">{t("login.or")}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <motion.button
          type="button"
          onClick={google}
          disabled={busy || !enabled}
          whileHover={busy ? undefined : { scale: 1.01 }}
          whileTap={busy ? undefined : { scale: 0.985 }}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border-strong bg-dark py-2.5 text-[14px] font-medium text-fg transition-colors hover:bg-panel disabled:opacity-50"
        >
          <IconGoogle />
          {t("login.google")}
        </motion.button>

        <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-subtle">
          {t("login.googleNote")}
        </p>

        <p className="mt-5 text-center text-[13px] text-muted">
          {mode === "signin" ? `${t("login.newHere")} ` : `${t("login.haveAccount")} `}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-accent-light underline-offset-4 hover:underline"
          >
            {mode === "signin" ? t("login.createLink") : t("login.signInLink")}
          </button>
        </p>
      </form>
    </Shell>
  );
}

/* ── perfil ────────────────────────────────────────────────────────────── */

export function ProfileModal({
  open,
  onClose,
  profile,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  profile: { display_name: string; avatar_url: string; email: string };
  onSave: (patch: { display_name?: string; avatar_url?: string }) => void;
}) {
  const t = useT();
  const [name, setName] = useState(profile.display_name);
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(profile.display_name);
    setAvatar(profile.avatar_url);
  }, [open, profile]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 1_500_000) return; // 1,5 MB é suficiente para um avatar
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(f);
  };

  return (
    <Shell open={open} onClose={onClose}>
      <Header title={t("profile.title")} subtitle={t("profile.subtitle")} onClose={onClose} />

      <div className="px-6 py-6">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.06, type: "spring", stiffness: 300, damping: 22 }}
            className="relative"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                className="h-20 w-20 rounded-full border border-border-strong object-cover"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full border border-border-strong bg-dark text-subtle">
                <IconUser size={30} />
              </div>
            )}
            <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/5" />
          </motion.div>

          <div className="mt-4 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => file.current?.click()}
              className="rounded-lg border border-border-strong px-3 py-1.5 text-[12.5px] font-medium text-fg transition-colors hover:bg-dark"
            >
              {t("profile.upload")}
            </motion.button>
            {avatar && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setAvatar("")}
                className="rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-muted transition-colors hover:bg-dark hover:text-fg"
              >
                {t("profile.remove")}
              </motion.button>
            )}
          </div>
          <input
            ref={file}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-subtle">
              {t("profile.name")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("profile.namePlaceholder")}
              className="w-full rounded-xl border border-border-strong bg-dark px-3.5 py-2.5 text-[14px] text-fg outline-none transition-all placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-subtle">
              {t("profile.avatarUrl")}
            </label>
            <input
              value={avatar.startsWith("data:") ? "" : avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-border-strong bg-dark px-3.5 py-2.5 text-[14px] text-fg outline-none transition-all placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
          </div>
          {/* o endereço saiu daqui: ele mora na aba Conta, e este painel é
              aberto pelo retrato no menu lateral, longe de qualquer intenção
              de mexer em conta */}

        </div>

        <div className="mt-6 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              onSave({ display_name: name.trim() || "You", avatar_url: avatar });
              onClose();
            }}
            className="flex-1 rounded-xl bg-accent py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-light"
          >
            {t("profile.save")}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={onClose}
            className="rounded-xl border border-border-strong px-4 py-2.5 text-[14px] font-medium text-muted transition-colors hover:bg-dark hover:text-fg"
          >
            {t("common.cancel")}
          </motion.button>
        </div>
      </div>
    </Shell>
  );
}

/* ── compartilhar ──────────────────────────────────────────────────────── */

export function ShareModal({
  open,
  onClose,
  url,
  title,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    setCopied(false);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      /* área de transferência bloqueada */
    }
  };

  return (
    <Shell open={open} onClose={onClose} width={440}>
      <Header
        title={t("share.title")}
        subtitle={t("share.subtitle")}
        onClose={onClose}
      />
      <div className="px-6 py-6">
        <div className="rounded-xl border border-border bg-dark px-3.5 py-3">
          <p className="truncate text-[13px] text-muted">{title}</p>
          <p className="mt-1 truncate font-mono text-[12px] text-subtle">{url}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            onClick={copy}
            className="flex-1 rounded-xl bg-accent py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-light"
          >
            {copied ? t("share.copied") : t("share.copy")}
          </motion.button>
          {/* abrir a página é o que prova que o link funciona antes de colar
              num chat — e o que mostra ao dono o que o outro vai ver */}
          <a
            href={url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="grid shrink-0 place-items-center rounded-xl border border-border-strong px-4 text-[13px] font-medium text-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            {t("share.open")}
          </a>
        </div>
        <p className="mt-3 text-center text-[12px] leading-relaxed text-subtle">
          {t("share.publicNote")}
        </p>
      </div>
    </Shell>
  );
}

export function Spinner({ size = 15 }: { size?: number }) {
  return (
    <motion.span
      style={{ width: size, height: size }}
      className="inline-block rounded-full border-2 border-white/25 border-t-white"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
      aria-hidden
    />
  );
}
