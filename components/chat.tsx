"use client";

/**
 * Keew IA — a única tela.
 *
 * Sem barra lateral, sem abas, sem configuração: uma coluna de conversa, o
 * campo de escrita e mais nada. A partir daqui, cada ajuste é conversado.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, Check, Copy, RotateCcw, Square, Trash2 } from "lucide-react";

import { Mark } from "@/components/mark";
import { Markdown } from "@/components/markdown";
import { useChat, type Msg } from "@/lib/chat";

export function Chat() {
  const messages = useChat((s) => s.messages);
  const streaming = useChat((s) => s.streaming);
  const send = useChat((s) => s.send);
  const stop = useChat((s) => s.stop);
  const regenerate = useChat((s) => s.regenerate);
  const clear = useChat((s) => s.clear);

  const [value, setValue] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const atBottom = useRef(true);

  // só renderiza o histórico depois de ler o navegador: evita piscar
  useEffect(() => setHydrated(true), []);

  // acompanha a resposta enquanto ela chega, mas respeita quem rolou para cima
  useLayoutEffect(() => {
    if (!atBottom.current) return;
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // campo cresce com o texto, até um limite
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  const submit = () => {
    if (!value.trim() || streaming) return;
    void send(value);
    setValue("");
    atBottom.current = true;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-[100dvh] flex-col bg-bg">
      {/* topo mínimo: marca à esquerda, limpar à direita quando há conversa */}
      <header className="flex h-14 shrink-0 items-center justify-between px-5 sm:px-7">
        {empty ? (
          <span />
        ) : (
          <span className="flex items-center gap-2 text-[13px] font-medium tracking-tight text-fg">
            <Mark size={17} />
            Keew IA
          </span>
        )}
        {!empty && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] text-subtle transition-colors hover:bg-elev hover:text-fg"
            title="Limpar conversa"
          >
            <Trash2 className="size-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
      </header>

      {/* conversa */}
      <div
        ref={scroller}
        onScroll={() => {
          const el = scroller.current;
          if (!el) return;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {!hydrated ? null : empty ? (
          <Empty />
        ) : (
          <div className="mx-auto flex w-full max-w-[680px] flex-col gap-8 px-5 pb-10 pt-4 sm:px-7">
            {messages.map((m, i) => (
              <Bubble key={m.id} message={m} isLast={i === messages.length - 1 && !streaming} onRetry={regenerate} />
            ))}
          </div>
        )}
      </div>

      {/* campo */}
      <div className="shrink-0 bg-gradient-to-t from-bg via-bg to-transparent px-4 pb-4 pt-2 sm:px-7 sm:pb-6">
        <div className="mx-auto w-full max-w-[680px]">
          <div className="relative flex items-end gap-2 rounded-[22px] border border-line bg-panel px-2.5 py-2 transition-colors focus-within:border-line-strong">
            <textarea
              ref={input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Pergunte alguma coisa…"
              className="scroll-thin max-h-[180px] min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-[1.5] text-fg placeholder:text-subtle focus:outline-none"
            />
            {streaming ? (
              <button
                onClick={stop}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong bg-elev text-fg transition-colors hover:text-rose-400"
                aria-label="Parar"
              >
                <Square className="size-3 fill-current" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!value.trim()}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-fg transition-all hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-25"
                aria-label="Enviar"
              >
                <ArrowUp className="size-4" strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── tela vazia: a marca e nada mais ─────────────────────────────────────── */

function Empty() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 pb-16">
      <span className="grid size-[76px] place-items-center rounded-[24px] bg-accent text-accent-fg">
        <Mark size={40} />
      </span>
      <h1 className="mt-6 text-[22px] font-medium tracking-tight text-fg">Keew IA</h1>
    </div>
  );
}

/* ── um turno ────────────────────────────────────────────────────────────── */

function Bubble({
  message,
  isLast,
  onRetry,
}: {
  message: Msg;
  isLast: boolean;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  if (message.role === "user") {
    return (
      <div className="anim-rise flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[18px] bg-accent px-4 py-2.5 text-[14.5px] leading-[1.6] text-accent-fg">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="anim-rise group flex gap-3">
      <span className="mt-0.5 grid size-[26px] shrink-0 place-items-center rounded-[9px] bg-accent text-accent-fg">
        <Mark size={15} />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        {message.content ? (
          <div className="text-[15px] text-fg">
            <Markdown content={message.content} />
            {message.pending && <span className="caret ml-0.5" />}
          </div>
        ) : message.pending ? (
          <span className="flex gap-1 py-1.5">
            <Dot delay="0ms" />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </span>
        ) : null}

        {!!message.sources?.length && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.sources.slice(0, 4).map((s, i) => (
              <span
                key={`${s.title}-${i}`}
                className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[11px] text-muted"
                title={s.title}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-accent/70" />
                <span className="truncate">{s.title}</span>
              </span>
            ))}
          </div>
        )}

        {message.error && <p className="mt-2 text-[12px] text-rose-400">{message.error}</p>}

        {!message.pending && message.content && (
          <div className="mt-1.5 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <IconButton label="Copiar" onClick={copy}>
              {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            </IconButton>
            {isLast && (
              <IconButton label="Gerar de novo" onClick={onRetry}>
                <RotateCcw className="size-3.5" />
              </IconButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-pulse rounded-full bg-accent"
      style={{ animationDelay: delay }}
    />
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-7 place-items-center rounded-[8px] text-subtle transition-colors hover:bg-elev hover:text-fg"
    >
      {children}
    </button>
  );
}
