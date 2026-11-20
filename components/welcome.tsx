"use client";

import { motion } from "framer-motion";

import { Logo } from "./logo";
import { useT } from "@/lib/i18n/use";

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.07 * i, type: "spring" as const, stiffness: 260, damping: 28 },
  }),
};

/**
 * A tela de abertura de uma conversa vazia.
 *
 * A marca grande fica aqui, acima da saudação, e o nome de quem entrou vai em
 * azul depois da vírgula — "Olá, teste". O nome vem do perfil; quando não há
 * perfil, cai no que existe: o que o Supabase guardou, o prefixo do email, ou
 * a própria marca na primeira visita.
 */
export function Welcome({ name }: { name?: string }) {
  const t = useT();
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col items-center px-5 pb-4 pt-[7vh] text-center sm:pt-[9vh]">
      <motion.div custom={0} variants={rise} initial="hidden" animate="show" className="relative mb-5">
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-accent/20 blur-2xl"
          animate={{ scale: [1, 1.16, 1], opacity: [0.4, 0.62, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <Logo size={86} spin />
        </motion.div>
      </motion.div>

      <motion.h1
        custom={1}
        variants={rise}
        initial="hidden"
        animate="show"
        className="text-[29px] font-bold leading-tight tracking-[-0.025em] text-fg sm:text-[31px]"
      >
        {name ? (
          <>
            {/* o dicionário traz "Olá, {name}", então o "Olá, " já vem com o
                espaço; a marca precisa envolvê-lo sem quebrar a linha */}
            {t("welcome.greeting", { name: "" })}
            <span className="text-accent">{name}</span>
          </>
        ) : (
          <>
            {/* text-fg, não text-white: no tema claro o branco puro sumia
                contra o fundo e sobrava só o "Keen" na tela. As letras vêm do
                idioma — AI, KI, ИИ… */}
            Keen <span className="text-accent">{t("brand.ia")}</span>
          </>
        )}
      </motion.h1>

      <motion.p
        custom={2}
        variants={rise}
        initial="hidden"
        animate="show"
        className="mt-3 max-w-[335px] text-[13.5px] leading-[1.45] text-muted sm:max-w-sm"
      >
        {t("welcome.subtitle")}
      </motion.p>
    </div>
  );
}
