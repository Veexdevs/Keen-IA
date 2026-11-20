"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { PendingTile } from "./attachments";
import { IconPlus, IconSendFill, IconStop, IconVoice } from "./icons";
import { readAttachment, type Attachment } from "@/lib/attach";
import { useStrings, useT } from "@/lib/i18n/use";
import { usePrefs } from "@/lib/settings";

/**
 * The composer.
 *
 * It is in the normal flow at the bottom of the column, not sticky, so the
 * conversation always ends right above it. It sits on the page background —
 * no gradient behind it — which is what used to make the message look like it
 * was floating far above the input.
 */
export function Composer({
  onSend,
  streaming,
  onStop,
  placeholder,
}: {
  onSend: (text: string, files: Attachment[]) => void;
  streaming: boolean;
  onStop: () => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const enterToSend = usePrefs((s) => s.prefs.enterToSend);
  const t = useT();

  useStrings(["attach.readingFile", "composer.attach", "composer.attachTitle", "composer.disclaimer", "composer.placeholder", "composer.send", "composer.stop", "composer.voice"]);
  const hint = placeholder ?? t("composer.placeholder");

  /* grows with the content, up to about five lines */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  const add = async (list: FileList | null) => {
    if (!list?.length) return;
    setReading(true);
    const picked = Array.from(list).slice(0, 8 - files.length);
    const next = await Promise.all(picked.map(readAttachment));
    setFiles((f) => [...f, ...next].slice(0, 8));
    setReading(false);
    requestAnimationFrame(() => ref.current?.focus());
  };

  const canSend = (text.trim() || files.length > 0) && !streaming;

  const fire = () => {
    if (!canSend) return;
    onSend(text.trim(), files);
    setText("");
    setFiles([]);
    if (ref.current) ref.current.style.height = "0px";
  };

  return (
    <div className="mx-auto w-full max-w-[760px] shrink-0 self-end px-3 pb-5 sm:px-0">
      <motion.div
        animate={dragging ? { scale: 1.008 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void add(e.dataTransfer.files);
        }}
        className={`rounded-full border bg-[var(--drawer-card)] px-[7px] py-[7px] transition-colors ${
          dragging ? "border-accent/70" : "border-[rgba(255,255,255,0.07)] focus-within:border-[rgba(255,255,255,0.12)]"
        }`}
      >
        {/* attachments being prepared */}
        <AnimatePresence initial={false}>
          {(files.length > 0 || reading) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 px-1 pb-1.5 pt-1.5">
                {files.map((f) => (
                  <PendingTile
                    key={f.id}
                    item={f}
                    onRemove={() => setFiles((v) => v.filter((x) => x.id !== f.id))}
                  />
                ))}
                {reading && (
                  <div className="shimmer h-[58px] w-[58px] shrink-0 rounded-lg" aria-label={t("attach.readingFile")} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1">
          {/* "+" num disco próprio, como na referência */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => picker.current?.click()}
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[var(--drawer-border)] text-fg transition-colors hover:bg-[var(--drawer-border-strong)]"
            aria-label={t("composer.attach")}
            title={t("composer.attachTitle")}
          >
            <IconPlus size={22} />
          </motion.button>

          <span aria-hidden className="mx-1 h-[26px] w-px shrink-0 bg-[rgba(255,255,255,0.13)]" />

          <button
            type="button"
            onClick={() => ref.current?.focus()}
            className="grid h-10 w-8 shrink-0 place-items-center text-fg"
            aria-label={t("composer.voice")}
            title={t("composer.voice")}
          >
            <IconVoice size={20} />
          </button>
          <input
            ref={picker}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.txt,.md,.json,.csv,.ts,.tsx,.js,.py,.html,.css,.sql,.yml,.yaml"
            className="hidden"
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />

          <textarea
            ref={ref}
            value={text}
            rows={1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              const send = enterToSend ? e.key === "Enter" && !e.shiftKey : e.key === "Enter" && (e.metaKey || e.ctrlKey);
              if (send) {
                e.preventDefault();
                fire();
              }
            }}
            placeholder={hint}
            className="scroll-thin max-h-[128px] flex-1 resize-none bg-transparent px-1 py-[7px] text-[14.5px] leading-[1.45] text-fg outline-none placeholder:text-[#8b8d94]"
          />

          <AnimatePresence mode="wait" initial={false}>
            {streaming ? (
              <motion.button
                key="stop"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hover-strong text-fg transition-colors hover:bg-raised"
                aria-label={t("composer.stop")}
              >
                <IconStop size={12} />
              </motion.button>
            ) : (
              <motion.button
                key="send"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                whileHover={canSend ? { scale: 1.05 } : undefined}
                whileTap={canSend ? { scale: 0.95 } : undefined}
                onClick={fire}
                disabled={!canSend}
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-accent text-white transition-all disabled:opacity-90"
                aria-label={t("composer.send")}
              >
                <IconSendFill size={21} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </div>
  );
}
