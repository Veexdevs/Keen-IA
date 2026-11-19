"use client";

import { memo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AttachmentGallery } from "./attachments";
import { Markdown } from "./markdown";
import { Logo } from "./logo";
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconRefresh,
  IconShare,
  IconSpeak,
  IconUser,
} from "./icons";
import type { Attachment } from "@/lib/attach";
import type { Msg } from "@/lib/store";

/* ── action button ─────────────────────────────────────────────────────── */

function Action({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-6 w-6 place-items-center rounded-md transition-colors ${
        active ? "text-accent-light" : "text-subtle hover:bg-hover hover:text-fg"
      }`}
    >
      {children}
    </motion.button>
  );
}

/* ── typing dots ───────────────────────────────────────────────────────── */

export function Typing() {
  return (
    <span className="inline-flex items-center gap-[3px] py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-[5px] w-[5px] rounded-full bg-accent-light"
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/* ── one message ───────────────────────────────────────────────────────── */

export const Message = memo(function Message({
  msg,
  avatar,
  onRegenerate,
  onEdit,
  onShare,
  onOpenAttachment,
  isLast,
}: {
  msg: Msg;
  avatar?: string;
  onRegenerate?: () => void;
  onEdit?: (text: string) => void;
  onShare?: () => void;
  onOpenAttachment?: (a: Attachment) => void;
  isLast?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const isUser = msg.role === "user";
  const files = msg.attachments ?? [];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const clean = msg.content.replace(/[*_`#>~]/g, "").slice(0, 4000);
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = navigator.language || "en-US";
    utter.rate = 1;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className={`group/msg relative flex w-full gap-3 px-4 sm:px-0 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* avatar — the assistant keeps its mark, the user keeps a face */}
      <div className="mt-0.5 shrink-0">
        {isUser ? (
          avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/10" />
          ) : (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-hover text-muted">
              <IconUser size={13} />
            </span>
          )
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-black ring-1 ring-black/70">
            <Logo size={14} />
          </span>
        )}
      </div>

      {/* body */}
      <div className={`flex min-w-0 flex-1 flex-col ${isUser ? "items-end" : "items-start"}`}>
        <span className="mb-1 flex items-center gap-1.5 text-[11.5px] font-semibold tracking-wide text-subtle">
          {isUser ? "You" : "Keew IA"}
          {!isUser && msg.live && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/12 px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wider text-emerald-400">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              live · {msg.live}
            </span>
          )}
        </span>

        {/* attachments first: what you sent leads the message */}
        {files.length > 0 && (
          <div className={`w-full ${msg.content ? "mb-2" : ""} ${isUser ? "flex justify-end" : ""}`}>
            <AttachmentGallery
              items={files}
              align={isUser ? "right" : "left"}
              onOpen={(a) => onOpenAttachment?.(a)}
            />
          </div>
        )}

        <div
          className={`w-full text-[14.5px] leading-[1.7] ${
            isUser ? "text-[var(--user-text)] text-right" : "text-[var(--body-text)]"
          }`}
        >
          {msg.pending && !msg.content ? (
            <Typing />
          ) : isUser ? (
            <p className="inline-block whitespace-pre-wrap break-words text-left">{msg.content}</p>
          ) : (
            <>
              <Markdown content={msg.content} />
              {msg.pending && (
                <span className="ml-0.5 inline-block align-baseline">
                  <span className="caret" />
                </span>
              )}
            </>
          )}
        </div>

        {/* error */}
        <AnimatePresence>
          {msg.error && (
            <motion.p
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[12px] text-red-300"
            >
              {msg.error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* sources */}
        {!!msg.sources?.length && (
          <div className={`mt-2 flex flex-wrap gap-1.5 ${isUser ? "justify-end" : ""}`}>
            {msg.sources.slice(0, 4).map((s, i) => (
              <motion.a
                key={i}
                href={s.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="max-w-[200px] truncate rounded-md border border-border-strong bg-panel px-1.5 py-0.5 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-fg"
              >
                {s.title}
              </motion.a>
            ))}
          </div>
        )}

        {/* actions, revealed on hover like Arena and Claude */}
        {!msg.pending && (msg.content || files.length > 0) && (
          <div
            className={`mt-1.5 flex items-center gap-0.5 transition-opacity duration-150 ${
              isUser
                ? "flex-row-reverse opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100"
                : "opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100"
            }`}
          >
            <Action label={copied ? "Copied" : "Copy"} onClick={copy} active={copied}>
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="ok"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                  >
                    <IconCheck size={13} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                  >
                    <IconCopy size={13} />
                  </motion.span>
                )}
              </AnimatePresence>
            </Action>

            {!isUser && (
              <>
                <Action label={speaking ? "Stop reading" : "Read aloud"} onClick={speak} active={speaking}>
                  <IconSpeak size={13} />
                </Action>
                {isLast && onRegenerate && (
                  <Action label="Regenerate" onClick={onRegenerate}>
                    <IconRefresh size={13} />
                  </Action>
                )}
              </>
            )}

            {isUser && onEdit && (
              <Action label="Edit" onClick={() => onEdit(msg.content)}>
                <IconEdit size={13} />
              </Action>
            )}

            {onShare && (
              <Action label="Share" onClick={onShare}>
                <IconShare size={13} />
              </Action>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});
