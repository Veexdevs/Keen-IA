"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { IconClose, IconEye, IconEyeOff, IconGoogle, IconUser } from "./icons";
import { Logo } from "./logo";
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
        aria-label="Close"
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

  useEffect(() => {
    if (!open) return;
    setMsg(null);
    const t = setTimeout(() => first.current?.focus(), 220);
    return () => clearTimeout(t);
  }, [open, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = supabaseBrowser();
    if (!sb) {
      setMsg({ kind: "error", text: "Accounts are not set up on this deployment." });
      return;
    }
    if (!email.includes("@")) {
      setMsg({ kind: "error", text: "That email doesn't look right." });
      return;
    }
    if (password.length < 6) {
      setMsg({ kind: "error", text: "Password needs at least 6 characters." });
      return;
    }

    setBusy(true);
    setMsg(null);

    if (mode === "signin") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setMsg({
          kind: "error",
          text: error.message.includes("Invalid login")
            ? "Wrong email or password."
            : "Couldn't sign you in. Try again.",
        });
        return;
      }
      onClose();
      window.location.reload();
    } else {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setBusy(false);
      if (error) {
        setMsg({
          kind: "error",
          text: error.message.includes("already registered")
            ? "This email already has an account — sign in instead."
            : "Couldn't create the account. Try again.",
        });
        return;
      }
      if (data.session) {
        onClose();
        window.location.reload();
      } else {
        setMsg({ kind: "ok", text: "Account created. Check your email to confirm it, then sign in." });
        setMode("signin");
      }
    }
  };

  const google = async () => {
    const sb = supabaseBrowser();
    if (!sb) {
      setMsg({ kind: "error", text: "Accounts are not set up on this deployment." });
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
        ? "Google sign-in is not enabled for this project yet. In Supabase → Authentication → Providers, turn on Google and paste the client ID and secret."
        : m.includes("redirect") || m.includes("url")
          ? `This address is not in Supabase's allowed redirect list. Add ${redirectTo} in Authentication → URL configuration.`
          : "Google sign-in could not start. Try again, or use email and password.";
      setMsg({ kind: "error", text });
      return;
    }

    if (!data?.url) {
      setBusy(false);
      setMsg({ kind: "error", text: "Google sign-in did not return a URL. Check the provider setup in Supabase." });
    }
  };

  return (
    <Shell open={open} onClose={onClose}>
      <Header
        title={mode === "signin" ? "Welcome back" : "Create your account"}
        subtitle={
          mode === "signin"
            ? "Sign in to keep your chats, files and settings across devices."
            : "Your chats are saved to your account, on every device you use."
        }
        onClose={onClose}
      />

      <form onSubmit={submit} className="px-6 py-5">
        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-subtle">
          Email
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
          Password
        </label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-xl border border-border-strong bg-dark py-2.5 pl-3.5 pr-11 text-[14px] text-fg outline-none transition-all placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-subtle transition-colors hover:text-fg"
            aria-label={show ? "Hide password" : "Show password"}
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
          {mode === "signin" ? "Sign in" : "Create account"}
        </motion.button>

        {!enabled && (
          <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] leading-relaxed text-amber-300/90">
            The database is not configured on this deployment, so accounts are off. You can still
            chat — messages stay in this browser only.
          </p>
        )}

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-subtle">or</span>
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
          Continue with Google
        </motion.button>

        <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-subtle">
          Google sign-in opens Google in this tab and returns you here.
        </p>

        <p className="mt-5 text-center text-[13px] text-muted">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-accent-light underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
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
      <Header title="Your profile" subtitle="How your account appears in Keew IA." onClose={onClose} />

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
              Upload photo
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
                Remove
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
              Display name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-border-strong bg-dark px-3.5 py-2.5 text-[14px] text-fg outline-none transition-all placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-subtle">
              Avatar URL
            </label>
            <input
              value={avatar.startsWith("data:") ? "" : avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-border-strong bg-dark px-3.5 py-2.5 text-[14px] text-fg outline-none transition-all placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-subtle">
              Email
            </label>
            <input
              value={profile.email}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-border bg-dark/50 px-3.5 py-2.5 text-[14px] text-muted outline-none"
            />
          </div>
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
            Save changes
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={onClose}
            className="rounded-xl border border-border-strong px-4 py-2.5 text-[14px] font-medium text-muted transition-colors hover:bg-dark hover:text-fg"
          >
            Cancel
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
        title="Share this chat"
        subtitle="Anyone with the link will be able to read this conversation."
        onClose={onClose}
      />
      <div className="px-6 py-6">
        <div className="rounded-xl border border-border bg-dark px-3.5 py-3">
          <p className="truncate text-[13px] text-muted">{title}</p>
          <p className="mt-1 truncate font-mono text-[12px] text-subtle">{url}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
          onClick={copy}
          className="mt-4 w-full rounded-xl bg-accent py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-light"
        >
          {copied ? "Link copied" : "Copy link"}
        </motion.button>
        <p className="mt-3 text-center text-[12px] leading-relaxed text-subtle">
          Share links are generated on this device. Copy the address bar to share this chat.
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
