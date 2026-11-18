"use client";

import { memo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
import type { Msg } from "@/lib/store";

/* ── botão de ação ─────────────────────────────────────────────────────── */

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
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
        active ? "text-accent-light" : "text-subtle hover:bg-white/[0.07] hover:text-fg"
      }`}
    >
      {children}
    </motion.button>
  );
}

/* ── indicador de digitação ────────────────────────────────────────────── */

export function Typing() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-accent-light"
          animate={{ y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

/* ── uma mensagem ──────────────────────────────────────────────────────── */

export const Message = memo(function Message({
  msg,
  avatar,
  onRegenerate,
  onEdit,
  onShare,
  isLast,
}: {
  msg: Msg;
  avatar?: string;
  onRegenerate?: () => void;
  onEdit?: (text: string) => void;
  onShare?: () => void;
  isLast?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const isUser = msg.role === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* sem permissão para a área de transferência */
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={`group/msg relative flex gap-3 px-4 py-3 sm:px-6 ${
        isUser ? "" : "border-l-2 border-accent/45"
      }`}
    >
      {/* avatar */}
      <div className="mt-0.5 shrink-0">
        {isUser ? (
          avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.07] text-muted">
              <IconUser size={14} />
            </span>
          )
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/12">
            <Logo size={15} />
          </span>
        )}
      </div>

      {/* conteúdo */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[12.5px] font-semibold text-white">{isUser ? "You" : "Keew IA"}</span>
        </div>

        <div className="text-[14.5px] leading-relaxed text-[#d6d6d9]">
          {msg.pending && !msg.content ? (
            <Typing />
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
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

        {/* erro */}
        <AnimatePresence>
          {msg.error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-[12.5px] text-red-300"
            >
              {msg.error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* fontes */}
        {!!msg.sources?.length && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {msg.sources.slice(0, 4).map((s, i) => (
              <motion.a
                key={i}
                href={s.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="max-w-[220px] truncate rounded-md border border-border-strong bg-panel px-2 py-1 text-[11.5px] text-muted transition-colors hover:border-accent/40 hover:text-fg"
              >
                {s.title}
              </motion.a>
            ))}
          </div>
        )}

        {/* ações */}
        {!msg.pending && (
          <div
            className={`mt-1.5 flex items-center gap-0.5 transition-opacity duration-200 ${
              isUser ? "opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100" : "opacity-60 group-hover/msg:opacity-100"
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
                    <IconCheck size={14} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                  >
                    <IconCopy size={14} />
                  </motion.span>
                )}
              </AnimatePresence>
            </Action>

            {!isUser && (
              <>
                <Action label={speaking ? "Stop reading" : "Read aloud"} onClick={speak} active={speaking}>
                  <IconSpeak size={14} />
                </Action>
                {isLast && onRegenerate && (
                  <Action label="Regenerate" onClick={onRegenerate}>
                    <IconRefresh size={14} />
                  </Action>
                )}
              </>
            )}

            {isUser && onEdit && (
              <Action label="Edit" onClick={() => onEdit(msg.content)}>
                <IconEdit size={14} />
              </Action>
            )}

            {onShare && (
              <Action label="Share" onClick={onShare}>
                <IconShare size={14} />
              </Action>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});
