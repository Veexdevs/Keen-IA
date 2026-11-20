"use client";

import { motion } from "framer-motion";

import { IconChat, IconCode, IconDesigner, IconProjects } from "./icons";
import { useT } from "@/lib/i18n/use";

/**
 * As quatro seções, numa pílula logo abaixo do cabeçalho.
 *
 * Só Chat existe hoje. Projetos, Code e Designer aparecem desabilitados —
 * mostrar a divisão desde já é mais honesto do que fingir que o produto tem
 * uma coisa só, e mais honesto ainda do que um botão que não leva a lugar
 * nenhum. Quando cada uma existir, é trocar `disabled` por `onSelect`.
 */

export type TabId = "chat" | "projects" | "code" | "designer";

const TABS: { id: TabId; label: string; icon: (p: { size?: number; className?: string }) => React.JSX.Element }[] = [
  { id: "chat", label: "Chat", icon: IconChat },
  { id: "projects", label: "Projetos", icon: IconProjects },
  { id: "code", label: "Code", icon: IconCode },
  { id: "designer", label: "Designer", icon: IconDesigner },
];

export function Tabs({ active = "chat" }: { active?: TabId }) {
  const t = useT();

  return (
    <div className="shrink-0 px-[7px] sm:px-5">
      {/* max-w alinha com a coluna do chat; a pílula em si é o cartão */}
      <nav
        className="mx-auto flex w-full max-w-[760px] items-stretch rounded-[23px] border border-[rgba(255,255,255,0.10)] bg-[var(--drawer-card)] px-1"
        aria-label={t("tabs.label")}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const on = id === active;
          const soon = id !== "chat";
          return (
            <button
              key={id}
              type="button"
              disabled={soon}
              aria-current={on ? "page" : undefined}
              title={soon ? t("tabs.soon") : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-[1px] rounded-full px-1 pb-[10px] pt-[7px] transition-colors ${
                on ? "text-accent" : soon ? "text-fg/55" : "text-muted hover:text-fg"
              } ${soon ? "cursor-default" : ""}`}
            >
              <Icon size={22} />
              <span className={`text-[11px] leading-none ${on ? "font-semibold" : "font-medium"}`}>{label}</span>

              {on && (
                /* a barra fina sob a aba ativa, colada no fundo da pílula */
                <motion.span
                  layoutId="tab-underline"
                  className="absolute -bottom-px left-1/2 h-[3px] w-[68%] -translate-x-1/2 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
