"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { IconClose, IconPaperclip, IconSend, IconStop } from "./icons";

export type Attachment = { id: string; name: string; size: number; text?: string };

const money = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1_048_576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1_048_576).toFixed(1)} MB`;

/** Lê arquivos de texto no navegador. Imagens e PDFs ficam só citados. */
async function readFile(file: File): Promise<Attachment> {
  const base: Attachment = { id: crypto.randomUUID(), name: file.name, size: file.size };
  const textual =
    file.type.startsWith("text/") ||
    /\.(md|txt|json|csv|ts|tsx|js|jsx|py|c|cpp|java|rs|go|html|css|sql|yml|yaml|toml|xml|sh)$/i.test(file.name);

  if (textual && file.size < 400_000) {
    try {
      const text = await file.text();
      return { ...base, text };
    } catch {
      return base;
    }
  }
  return base;
}

export function Composer({
  onSend,
  streaming,
  onStop,
  placeholder = "Ask Keew anything",
}: {
  onSend: (text: string, files: Attachment[]) => void;
  streaming: boolean;
  onStop: () => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);

  /* cresce com o conteúdo, até 6 linhas */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [text]);

  const add = async (list: FileList | null) => {
    if (!list?.length) return;
    const next = await Promise.all(Array.from(list).slice(0, 5).map(readFile));
    setFiles((f) => [...f, ...next].slice(0, 5));
  };

  const fire = () => {
    const clean = text.trim();
    if (!clean || streaming) return;
    onSend(clean, files);
    setText("");
    setFiles([]);
  };

  return (
    <div className="pointer-events-none sticky bottom-0 z-20 bg-gradient-to-t from-bg via-bg to-transparent pb-4 pt-6">
      <div className="pointer-events-auto mx-auto w-full max-w-3xl px-4">
        <motion.div
          animate={dragging ? { scale: 1.01 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
          className={`rounded-[26px] border bg-panel/90 p-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-colors ${
            dragging ? "border-accent/70" : "border-border-strong focus-within:border-accent/45"
          }`}
        >
          {/* arquivos anexados */}
          <AnimatePresence initial={false}>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 px-1.5 pb-2 pt-1">
                  {files.map((f) => (
                    <motion.span
                      key={f.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-dark py-1 pl-2.5 pr-1 text-[12px] text-fg"
                    >
                      <span className="max-w-[160px] truncate">{f.name}</span>
                      <span className="text-subtle">{money(f.size)}</span>
                      <button
                        onClick={() => setFiles((v) => v.filter((x) => x.id !== f.id))}
                        className="grid h-4 w-4 place-items-center rounded text-subtle transition-colors hover:bg-white/10 hover:text-fg"
                        aria-label={`Remove ${f.name}`}
                      >
                        <IconClose size={10} />
                      </button>
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-1">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => picker.current?.click()}
              className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-subtle transition-colors hover:bg-white/[0.06] hover:text-fg"
              aria-label="Attach files"
            >
              <IconPaperclip size={17} />
            </motion.button>
            <input
              ref={picker}
              type="file"
              multiple
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
              className="scroll-thin max-h-[168px] flex-1 resize-none bg-transparent px-1.5 py-2.5 text-[14.5px] leading-relaxed text-fg outline-none placeholder:text-subtle"
            />

            <AnimatePresence mode="wait" initial={false}>
              {streaming ? (
                <motion.button
                  key="stop"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={onStop}
                  className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Stop generating"
                >
                  <IconStop size={13} />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={text.trim() ? { scale: 1.06 } : undefined}
                  whileTap={text.trim() ? { scale: 0.94 } : undefined}
                  onClick={fire}
                  disabled={!text.trim()}
                  className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-white transition-all disabled:bg-white/[0.07] disabled:text-subtle"
                  aria-label="Send"
                >
                  <IconSend size={17} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-subtle">
          Keew can be wrong. Check anything important.
        </p>
      </div>
    </div>
  );
}
