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

export function Welcome({ name }: { name?: string }) {
  const t = useT();
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col items-center px-5 pb-4 pt-[11vh] text-center sm:pt-[15vh]">
      <motion.div custom={0} variants={rise} initial="hidden" animate="show" className="relative mb-6">
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
          <Logo size={46} spin />
        </motion.div>
      </motion.div>

      <motion.h1
        custom={1}
        variants={rise}
        initial="hidden"
        animate="show"
        className="text-[27px] font-bold leading-tight tracking-[-0.025em] text-fg sm:text-[32px]"
      >
        {name ? (
          <>
            {t("welcome.greeting", { name: "" })}<span className="text-accent-light">{name}</span>
          </>
        ) : (
          <>
            Keew <span className="text-white">IA</span>
          </>
        )}
      </motion.h1>

      <motion.p
        custom={2}
        variants={rise}
        initial="hidden"
        animate="show"
        className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted"
      >
        {t("welcome.subtitle")}
      </motion.p>
    </div>
  );
}
