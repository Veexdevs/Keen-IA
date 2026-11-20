"use client";

import { motion } from "framer-motion";

import { useT } from "@/lib/i18n/use";

/**
 * A marca da Keen: três arcos em órbita formando um círculo aberto.
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
      <img src="/mark.svg" alt="Keen IA" width={size} height={size} style={{ display: "block" }} />
    </motion.span>
  );
}

/**
 * Marca + nome.
 *
 * As duas letras vêm do idioma: IA em português e espanhol, KI em alemão e
 * holandês, ИИ em russo, AI onde a sigla inglesa é a que as pessoas usam.
 * Estava fixo em "IA" e por isso a marca ficava errada em 14 dos 20 idiomas.
 */
export function Wordmark({ size = 24 }: { size?: number }) {
  const t = useT();
  return (
    /* dir="ltr": a marca é um nome próprio e nunca se inverte, mesmo que
       alguma tradução traga um trecho RTL para dentro do texto */
    <span dir="ltr" className="flex items-center gap-2.5">
      <Logo size={size} />
      <span className="text-[15px] font-extrabold tracking-wider text-fg">
        Keen {t("brand.ia")}
      </span>
    </span>
  );
}
