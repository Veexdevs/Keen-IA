"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { IconClose, IconDownload, IconFile, IconPlay } from "./icons";
import { formatSize, type Attachment } from "@/lib/attach";
import { useT } from "@/lib/i18n/use";

/* ── lightbox for images and videos ────────────────────────────────────── */

export function Viewer({
  item,
  onClose,
}: {
  item: Attachment | null;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
        >
          <motion.button
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <IconClose size={18} />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-4xl overflow-hidden rounded-2xl border border-border-strong bg-panel"
          >
            {item.kind === "video" ? (
              item.url ? (
                <video src={item.url} controls autoPlay className="max-h-[82vh] w-full bg-black" />
              ) : (
                <div className="p-10 text-center text-[13px] text-muted">
                  {t("attach.videoGone")}
                </div>
              )
            ) : item.url || item.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url || item.thumb} alt={item.name} className="max-h-[82vh] w-full object-contain" />
            ) : null}

            <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2.5">
              <p className="truncate text-[12.5px] text-muted">{item.name}</p>
              <span className="shrink-0 text-[11.5px] text-subtle">{formatSize(item.size)}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── a tile in the composer (before sending) ───────────────────────────── */

export function PendingTile({ item, onRemove }: { item: Attachment; onRemove: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.86, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.86, y: 6 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="group relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-xl border border-border-strong bg-dark"
    >
      {item.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumb} alt={item.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1">
          <IconFile size={17} className="text-subtle" />
          <span className="w-full truncate text-center text-[8.5px] leading-tight text-subtle">
            {item.name}
          </span>
        </div>
      )}

      {item.kind === "video" && (
        <span className="absolute inset-0 grid place-items-center bg-black/30">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white">
            <IconPlay size={10} />
          </span>
        </span>
      )}

      <button
        onClick={onRemove}
        className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-black/75 text-white opacity-0 transition-opacity group-hover:opacity-100"
        aria-label={`Remove ${item.name}`}
      >
        <IconClose size={9} />
      </button>
    </motion.div>
  );
}

/* ── what lands in the message ─────────────────────────────────────────── */

export function AttachmentGallery({
  items,
  align,
  onOpen,
}: {
  items: Attachment[];
  align: "left" | "right";
  onOpen: (a: Attachment) => void;
}) {
  const t = useT();
  const media = items.filter((i) => i.kind === "image" || i.kind === "video");
  const others = items.filter((i) => i.kind !== "image" && i.kind !== "video");

  return (
    <div className={`flex flex-col gap-2 ${align === "right" ? "items-end" : "items-start"}`}>
      {media.length > 0 && (
        <div
          className={`grid gap-1.5 ${
            media.length === 1 ? "max-w-[340px] grid-cols-1" : "max-w-[340px] grid-cols-2"
          }`}
        >
          {media.slice(0, 4).map((m, i) => {
            const single = media.length === 1;
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onOpen(m)}
                className={`group relative overflow-hidden rounded-xl border border-border-strong bg-dark ${
                  single ? "aspect-[4/3]" : "aspect-square"
                }`}
              >
                {m.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.thumb}
                    alt={m.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-subtle">
                    <IconFile size={22} />
                    <span className="px-3 text-center text-[10.5px] leading-tight">{m.name}</span>
                  </span>
                )}

                {m.kind === "video" && (
                  <>
                    <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span className="absolute inset-0 grid place-items-center">
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        className="grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm ring-1 ring-white/25"
                      >
                        <IconPlay size={13} />
                      </motion.span>
                    </span>
                    <span className="absolute bottom-1.5 right-2 text-[10px] font-medium text-white/85">
                      {formatSize(m.size)}
                    </span>
                  </>
                )}

                {media.length === 4 && i === 3 && <span className="absolute inset-0 bg-black/0" />}
              </motion.button>
            );
          })}
        </div>
      )}

      {others.map((f) => (
        <motion.a
          key={f.id}
          href={f.url}
          download={f.url ? f.name : undefined}
          onClick={(e) => {
            if (!f.url) e.preventDefault();
          }}
          target={f.url ? "_blank" : undefined}
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex w-full max-w-[320px] items-center gap-2.5 rounded-xl border border-border bg-panel/80 px-2.5 py-2 text-left transition-colors hover:border-accent/40 hover:bg-panel ${
            align === "right" ? "ml-auto" : ""
          }`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-hover text-muted">
            <IconFile size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-medium text-fg">{f.name}</span>
            <span className="block text-[10.5px] text-subtle">
              {formatSize(f.size)}
              {f.previewOnly && !f.url ? ` · ${t("attach.nameOnly")}` : ""}
            </span>
          </span>
          {f.url && <IconDownload size={13} className="shrink-0 text-subtle" />}
        </motion.a>
      ))}
    </div>
  );
}

/** Opens a viewer from a gallery click. */
export function useViewer() {
  const [open, setOpen] = useState<Attachment | null>(null);
  return {
    open,
    openWith: setOpen,
    close: () => setOpen(null),
    node: <Viewer item={open} onClose={() => setOpen(null)} />,
  };
}
