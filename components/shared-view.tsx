"use client";

import Link from "next/link";

import { Markdown } from "@/components/markdown";
import { Logo, Wordmark } from "@/components/logo";
import { useT } from "@/lib/i18n/use";
import type { SharedAnswer } from "@/lib/share";

/**
 * A página de uma resposta compartilhada.
 *
 * Ela mostra a resposta e nada mais: nem o resto da conversa, nem quem
 * perguntou, nem quando — só o texto, a marca e o caminho de volta. É uma
 * página de leitura, então o layout é uma coluna estreita com a mesma
 * tipografia do chat, sem o cabeçalho de navegação do app.
 */
export function SharedView({ answer }: { answer: SharedAnswer | null }) {
  const t = useT();

  return (
    <main className="min-h-dvh bg-bg px-5 py-10 text-fg">
      <div className="mx-auto flex w-full max-w-[680px] flex-col">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Wordmark size={24} fontSize={18} />
          <Link
            href="/"
            className="rounded-lg border border-border-strong px-3 py-1.5 text-[12.5px] font-medium text-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            {t("share.back")}
          </Link>
        </header>

        {answer ? (
          <>
            {answer.title && (
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-subtle">
                {answer.title}
              </p>
            )}
            <article className="rounded-2xl border border-border bg-panel/45 px-5 py-5 text-[15px] leading-[1.72] text-[var(--body-text)] sm:px-7 sm:py-6">
              <Markdown content={answer.text} />
            </article>
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-panel/45 px-6 py-10 text-center">
            <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-black ring-1 ring-black/70">
              <Logo size={22} />
            </span>
            <p className="text-[14px] text-muted">{t("share.notFound")}</p>
          </div>
        )}

        <footer className="mt-8 border-t border-border pt-5 text-[11.5px] leading-relaxed text-subtle">
          {t("share.publicNote")}
        </footer>
      </div>
    </main>
  );
}
