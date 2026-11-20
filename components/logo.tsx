"use client";

import { motion } from "framer-motion";

import { useT } from "@/lib/i18n/use";

/**
 * A marca da Keen: três arcos em órbita formando um círculo aberto.
 *
 * Usa o SVG traçado da arte original (IoU 97,3% com o arquivo), então
 * escala sem perder qualidade em qualquer tamanho e nunca corta.
 *
 * `size` é o diâmetro que a marca ocupa na tela, de ponta a ponta da tinta —
 * o viewBox do arquivo já é justo em torno do desenho. Não aplique scale(),
 * zoom nem `object-fit` por cima: a rodada em que o <img> ganhou
 * `transform: scale(1.15)` a marca ficou 15% maior que a referência em toda
 * tela, e 108 px no centro chegaram à tela como se fossem 124.
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
export function Wordmark({ size = 24, fontSize }: { size?: number; fontSize?: number }) {
  const t = useT();
  const type = fontSize ?? Math.round((size * 19) / 26);
  return (
    /* dir="ltr": a marca é um nome próprio e nunca se inverte, mesmo que
       alguma tradução traga um trecho RTL para dentro do texto */
    <span dir="ltr" className="flex items-center gap-2">
      <Logo size={size} />
      <span className="font-extrabold leading-none tracking-[-0.01em] text-fg" style={{ fontSize: type }}>
        Keen <span className="text-accent">{t("brand.ia")}</span>
      </span>
    </span>
  );
}
