/**
 * A marca da Keew — um losango vazado com o núcleo sólido no centro.
 * Desenhada em SVG para nunca cortar, nunca desalinhar e escalar em qualquer
 * tamanho. É o único elemento gráfico do produto.
 */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M16 2.6 29.4 16 16 29.4 2.6 16 16 2.6Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="4.1" fill="currentColor" />
    </svg>
  );
}

/** A marca com o nome — usada onde precisa de identificação textual. */
export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <Mark size={size} />
      <span className="text-[13.5px] font-medium tracking-tight">Keew IA</span>
    </span>
  );
}
