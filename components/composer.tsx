"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { PendingTile } from "./attachments";
import { IconArrowUp, IconPaperclip, IconStop } from "./icons";
import { readAttachment, type Attachment } from "@/lib/attach";

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

  /* grows with the content, up to about five lines */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
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
  };

  return (
    <div className="pointer-events-none sticky bottom-0 z-20 bg-gradient-to-t from-bg via-bg/95 to-transparent pb-3 pt-8">
      <div className="pointer-events-auto mx-auto w-full max-w-[760px] px-4">
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
          className={`rounded-[22px] border bg-panel/85 px-2.5 py-2 shadow-[0_10px_36px_-16px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-colors ${
            dragging
              ? "border-accent/70 bg-panel"
              : "border-white/[0.09] focus-within:border-white/20"
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
                <div className="flex flex-wrap gap-2 px-1 pb-2 pt-1">
                  {files.map((f) => (
                    <PendingTile
                      key={f.id}
                      item={f}
                      onRemove={() => setFiles((v) => v.filter((x) => x.id !== f.id))}
                    />
                  ))}
                  {reading && (
                    <div className="shimmer h-[62px] w-[62px] shrink-0 rounded-xl" aria-label="Reading file" />
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
              className="mb-[3px] grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
              aria-label="Attach files"
              title="Attach image, video or file"
            >
              <IconPaperclip size={17} />
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
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  fire();
                }
              }}
              placeholder={placeholder}
              className="scroll-thin max-h-[132px] flex-1 resize-none bg-transparent px-1.5 py-[7px] text-[14.5px] leading-[1.5] text-fg outline-none placeholder:text-subtle"
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
                  className="mb-[3px] grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
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
                  className="mb-[3px] grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-white transition-all disabled:bg-white/[0.06] disabled:text-subtle"
                  aria-label="Send"
                >
                  <IconArrowUp size={17} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="mt-2 text-center text-[10.5px] leading-relaxed text-subtle/80">
          Keew can be wrong. Check anything important.
        </p>
      </div>
    </div>
  );
}
