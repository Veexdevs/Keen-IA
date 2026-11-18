"use client";

import { motion } from "framer-motion";

/**
 * A marca da Keew: três arcos em órbita formando um círculo aberto.
 *
 * Usa o SVG traçado da arte original (IoU 97,3% com o arquivo), então
 * escala sem perder qualidade em qualquer tamanho e nunca corta.
 */
export function Logo({
  size = 28,
  className = "",
  spin = false,
}: {
  size?: number;
  className?: string;
  spin?: boolean;
}) {
  return (
    <motion.span
      className={`inline-grid shrink-0 place-items-center ${className}`}
      style={{ width: size, height: size }}
      initial={false}
      animate={spin ? { rotate: 360 } : { rotate: 0 }}
      transition={spin ? { duration: 22, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mark.svg" alt="Keew IA" width={size} height={size} style={{ display: "block" }} />
    </motion.span>
  );
}

/** Marca + nome, com o "IA" no peso mais claro. */
export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo size={size} />
      <span className="text-[15px] font-extrabold tracking-wider text-white">
        Keew <span className="text-accent-light">IA</span>
      </span>
    </span>
  );
}
