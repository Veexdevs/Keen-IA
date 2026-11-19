"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { PendingTile } from "./attachments";
import { IconArrowUp, IconPaperclip, IconStop } from "./icons";
import { readAttachment, type Attachment } from "@/lib/attach";
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
  placeholder = "How can I help today?",
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
    <div className="mx-auto w-full max-w-[760px] shrink-0 self-end px-4 pb-3 sm:px-0">
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
        className={`rounded-[20px] border bg-panel px-2 py-1.5 shadow-[var(--shadow-soft)] transition-colors ${
          dragging ? "border-accent/70" : "border-border-strong focus-within:border-accent/45"
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
                  <div className="shimmer h-[58px] w-[58px] shrink-0 rounded-lg" aria-label="Reading file" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-1">
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => picker.current?.click()}
            className="mb-[2px] grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-fg"
            aria-label="Attach files"
            title="Attach image, video or file"
          >
            <IconPaperclip size={16} />
          </motion.button>
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
            placeholder={placeholder}
            className="scroll-thin max-h-[128px] flex-1 resize-none bg-transparent px-1 py-[7px] text-[14.5px] leading-[1.45] text-fg outline-none placeholder:text-subtle"
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
                className="mb-[2px] grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-hover-strong text-fg transition-colors hover:bg-raised"
                aria-label="Stop generating"
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
                className="mb-[2px] grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-white transition-all disabled:bg-hover disabled:text-subtle"
                aria-label="Send"
              >
                <IconArrowUp size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="mt-2 text-center text-[10.5px] leading-relaxed text-subtle">
        Keew can be wrong. Check anything important.
      </p>
    </div>
  );
}
