"use client";

import { motion } from "framer-motion";

import { Logo } from "./logo";

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, type: "spring" as const, stiffness: 260, damping: 26 },
  }),
};

const SUGGESTIONS = [
  { label: "Do a quick calculation", prompt: "What is 15% of 240?" },
  { label: "Convert a measurement", prompt: "Convert 12 kilometers to miles" },
  { label: "Figure out a date", prompt: "How many days until December 25, 2026?" },
  { label: "Clean up a string", prompt: "Make a slug from 'Café com Leite'" },
];

export function Welcome({ name, onPick }: { name?: string; onPick: (prompt: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-2 pt-[8vh] text-center sm:pt-[13vh]">
      <motion.div
        custom={0}
        variants={rise}
        initial="hidden"
        animate="show"
        className="relative mb-7"
      >
        {/* halo que respira */}
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-accent/25 blur-2xl"
          animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <Logo size={62} spin />
        </motion.div>
      </motion.div>

      <motion.h1
        custom={1}
        variants={rise}
        initial="hidden"
        animate="show"
        className="text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-[44px]"
      >
        {name ? (
          <>
            Hello, <span className="text-accent-light">{name}</span>
          </>
        ) : (
          <>
            Keew <span className="text-accent-light">IA</span>
          </>
        )}
      </motion.h1>

      <motion.p
        custom={2}
        variants={rise}
        initial="hidden"
        animate="show"
        className="mt-3 max-w-md text-[15px] leading-relaxed text-muted"
      >
        Your own intelligence. Ask a question, drop a file, or start with one of these.
      </motion.p>

      <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            custom={3 + i}
            variants={rise}
            initial="hidden"
            animate="show"
            whileHover={{ y: -2, scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            onClick={() => onPick(s.prompt)}
            className="group rounded-xl border border-border bg-panel/60 px-4 py-3 text-left transition-colors hover:border-accent/40 hover:bg-panel"
          >
            <span className="block text-[13px] font-semibold text-fg">{s.label}</span>
            <span className="mt-0.5 block truncate text-[12px] text-subtle transition-colors group-hover:text-muted">
              {s.prompt}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
