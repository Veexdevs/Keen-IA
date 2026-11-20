"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { PendingTile } from "./attachments";
import { IconMic, IconMicStop, IconPlus, IconSendFill, IconStop } from "./icons";
import { readAttachment, type Attachment } from "@/lib/attach";
import { MAX_SECONDS, startRecording, toWav, transcribe, type Recorder } from "@/lib/voice";
import { useStrings, useT } from "@/lib/i18n/use";
import { useLocale } from "@/lib/i18n/store";
import { usePrefs } from "@/lib/settings";

/**
 * The composer.
 *
 * It is in the normal flow at the bottom of the column, not sticky, so the
 * conversation always ends right above it. It sits on the page background —
 * no gradient behind it — which is what used to make the message look like it
 * was floating far above the input.
 *
 * O microfone grava de verdade: um toque começa, outro encerra, e o áudio vira
 * texto dentro da caixa antes de qualquer envio. O texto entra no campo em vez
 * de ir direto para a conversa, porque ditado erra palavra e a pessoa precisa
 * poder corrigir antes de mandar.
 */
export function Composer({
  onSend,
  streaming,
  onStop,
  placeholder,
  value,
  onValueChange,
}: {
  onSend: (text: string, files: Attachment[]) => void;
  streaming: boolean;
  onStop: () => void;
  placeholder?: string;
  /** texto controlado por quem está por fora (editar uma mensagem antiga) */
  value?: string;
  onValueChange?: (text: string) => void;
}) {
  const [inner, setInner] = useState("");
  const text = value ?? inner;
  const setText = useCallback(
    (next: string) => {
      if (onValueChange) onValueChange(next);
      else setInner(next);
    },
    [onValueChange],
  );

  const [files, setFiles] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const enterToSend = usePrefs((s) => s.prefs.enterToSend);
  const locale = useLocale((s) => s.tag);
  const t = useT();

  /* ── ditado ───────────────────────────────────────────────────────────── */
  type Dictation = "idle" | "recording" | "working";
  const [dictation, setDictation] = useState<Dictation>("idle");
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recorder = useRef<Recorder | null>(null);
  const ticker = useRef<number | null>(null);

  useStrings([
    "attach.readingFile",
    "composer.attach",
    "composer.attachTitle",
    "composer.dictate",
    "composer.dictateStop",
    "composer.dictationWorking",
    "composer.disclaimer",
    "composer.placeholder",
    "composer.send",
    "composer.stop",
    "composer.voice",
    "voice.noEngine",
    "voice.badKey",
    "voice.badModel",
    "voice.denied",
    "voice.unsupported",
    "voice.empty",
    "voice.failed",
  ]);
  const hint = placeholder ?? t("composer.placeholder");

  /* grows with the content, up to about five lines */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  /* Um erro de voz some sozinho: ele é sobre uma tentativa, não sobre a tela. */
  useEffect(() => {
    if (!voiceError) return;
    const id = setTimeout(() => setVoiceError(null), 5200);
    return () => clearTimeout(id);
  }, [voiceError]);

  const stopTicker = () => {
    if (ticker.current !== null) {
      window.clearInterval(ticker.current);
      ticker.current = null;
    }
  };

  /* desmontar no meio de uma gravação não pode deixar o microfone aberto */
  useEffect(
    () => () => {
      recorder.current?.cancel();
      stopTicker();
    },
    [],
  );

  const beginDictation = async () => {
    setVoiceError(null);
    try {
      const rec = await startRecording();
      recorder.current = rec;
      setDictation("recording");
      setSeconds(0);
      setLevel(0);
      ticker.current = window.setInterval(() => {
        const s = rec.seconds();
        setSeconds(s);
        setLevel(rec.level());
        /* o teto de um minuto para sozinho, e transcreve o que já foi dito */
        if (s >= MAX_SECONDS) void endDictation();
      }, 90);
    } catch (err) {
      const name = (err as Error)?.name ?? "";
      const msg = (err as Error)?.message ?? "";
      setVoiceError(
        msg === "unsupported" || name === "NotSupportedError"
          ? t("voice.unsupported")
          : name === "NotAllowedError" || name === "SecurityError"
            ? t("voice.denied")
            : t("voice.failed"),
      );
    }
  };

  const endDictation = async () => {
    const rec = recorder.current;
    recorder.current = null;
    stopTicker();
    if (!rec) {
      setDictation("idle");
      return;
    }
    setDictation("working");
    try {
      const blob = await rec.stop();
      /* meia dúzia de bytes é microfone mudo, não fala: não gasta uma chamada */
      if (blob.size < 2_000) {
        setVoiceError(t("voice.empty"));
        return;
      }
      const wav = await toWav(blob);
      const said = await transcribe(wav, locale);
      if (!said) {
        setVoiceError(t("voice.empty"));
        return;
      }
      /* entra no campo, com espaço quando já havia texto — ditado é acréscimo */
      const next = text.trim() ? `${text.replace(/\s+$/, "")} ${said}` : said;
      setText(next);
      requestAnimationFrame(() => {
        ref.current?.focus();
        ref.current?.setSelectionRange(next.length, next.length);
      });
    } catch (err) {
      const code = (err as Error)?.message ?? "";
      setVoiceError(
        code === "no-engine"
          ? t("voice.noEngine")
          : code === "bad-key" || code === "unauthorized"
            ? t("voice.badKey")
            : code === "bad-model"
              ? t("voice.badModel")
              : code === "too-long"
                ? t("voice.empty")
                : t("voice.failed"),
      );
    } finally {
      setDictation("idle");
      setSeconds(0);
      setLevel(0);
    }
  };

  const add = async (list: FileList | null) => {
    if (!list?.length) return;
    setReading(true);
    const picked = Array.from(list).slice(0, 8 - files.length);
    const next = await Promise.all(picked.map(readAttachment));
    setFiles((f) => [...f, ...next].slice(0, 8));
    setReading(false);
    requestAnimationFrame(() => ref.current?.focus());
  };

  const canSend = (text.trim() || files.length > 0) && !streaming && dictation === "idle";

  const fire = () => {
    if (!canSend) return;
    onSend(text.trim(), files);
    setText("");
    setFiles([]);
    if (ref.current) ref.current.style.height = "0px";
  };

  const recording = dictation === "recording";
  const working = dictation === "working";

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
          dragging
            ? "border-accent/70"
            : recording
              ? "border-accent/60"
              : "border-[rgba(255,255,255,0.07)] focus-within:border-[rgba(255,255,255,0.12)]"
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

          {/* microfone: grava, mostra o tempo e devolve o texto ao campo */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => (recording ? void endDictation() : working ? null : void beginDictation())}
            disabled={working || streaming}
            className={`relative grid h-10 w-8 shrink-0 place-items-center transition-colors ${
              recording ? "text-accent-light" : working ? "text-subtle" : "text-fg hover:text-accent-light"
            } disabled:opacity-60`}
            aria-label={recording ? t("composer.dictateStop") : t("composer.dictate")}
            title={recording ? t("composer.dictateStop") : t("composer.dictate")}
          >
            <AnimatePresence mode="wait" initial={false}>
              {recording ? (
                <motion.span
                  key="stop"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                >
                  <IconMicStop size={18} />
                </motion.span>
              ) : working ? (
                <motion.span
                  key="busy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="block h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-accent-light"
                />
              ) : (
                <motion.span
                  key="mic"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                >
                  <IconMic size={18} />
                </motion.span>
              )}
            </AnimatePresence>

            {/* anel que pulsa com a voz: o microfone está aberto, e dá para ver */}
            {recording && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full border border-accent/50"
                animate={{ scale: [1, 1.18 + level * 0.5, 1], opacity: [0.6, 0.15, 0.6] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
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

          {/* durante a gravação o campo dá lugar ao estado: tempo, nível e o que fazer */}
          <AnimatePresence mode="wait" initial={false}>
            {recording || working ? (
              <motion.div
                key="dictation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden px-1 py-[7px]"
              >
                <span className="shrink-0 font-mono text-[13px] tabular-nums text-accent-light">
                  {String(Math.floor(seconds / 60)).padStart(1, "0")}:
                  {String(seconds % 60).padStart(2, "0")}
                </span>
                {/* a onda tem largura fixa: o rótulo ao lado precisa de espaço
                    garantido, e esticar a onda por todo o campo empurrava o
                    texto por cima dela */}
                <span className="flex h-3.5 w-[54px] shrink-0 items-end gap-[2px] overflow-hidden" aria-hidden>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="min-w-[2px] flex-1 rounded-full bg-accent-light/70"
                      animate={
                        recording
                          ? {
                              height: [
                                `${20 + ((i * 37) % 30)}%`,
                                `${25 + level * 75 * (0.5 + ((i * 53) % 50) / 100)}%`,
                                `${20 + ((i * 29) % 40)}%`,
                              ],
                            }
                          : { height: "18%" }
                      }
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.03 }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">
                  {working ? t("composer.dictationWorking") : t("composer.dictateStop")}
                </span>
              </motion.div>
            ) : (
              <motion.textarea
                key="input"
                ref={ref as unknown as React.Ref<HTMLTextAreaElement>}
                value={text}
                rows={1}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  const send = enterToSend
                    ? e.key === "Enter" && !e.shiftKey
                    : e.key === "Enter" && (e.metaKey || e.ctrlKey);
                  if (send) {
                    e.preventDefault();
                    fire();
                  }
                }}
                placeholder={hint}
                className="scroll-thin max-h-[128px] flex-1 resize-none bg-transparent px-1 py-[7px] text-[14.5px] leading-[1.45] text-fg outline-none placeholder:text-[#8b8d94]"
              />
            )}
          </AnimatePresence>

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

      {/* o erro de voz fala a língua da interface e some sozinho */}
      <AnimatePresence>
        {voiceError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            role="status"
            className="mt-2 px-3 text-[12px] leading-relaxed text-amber-300/90"
          >
            {voiceError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
