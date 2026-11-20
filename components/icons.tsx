"use client";

/** Ícones de traço, 1.75px, cantos redondos — um só conjunto. */

type P = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export const IconMenu = ({ size = 20, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2.1}>
    <path d="M3.8 6.6h16.4M3.8 12h16.4M3.8 17.4h11.4" />
  </svg>
);

export const IconPlus = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconSend = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
  </svg>
);

export const IconPaperclip = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M20 11.5 12.2 19.3a5 5 0 0 1-7.1-7.1L13 4.3a3.4 3.4 0 1 1 4.8 4.8l-7.7 7.8a1.8 1.8 0 1 1-2.5-2.6l7-7.1" />
  </svg>
);

export const IconCopy = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-6A3.5 3.5 0 0 0 3 6.5v6A2.5 2.5 0 0 0 5.5 15" />
  </svg>
);

export const IconCheck = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const IconSpeak = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M11 5 6.5 9H3.5v6h3L11 19V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
  </svg>
);

export const IconRefresh = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M20 11.5A8 8 0 1 0 18 17" />
    <path d="M20.5 4.5v6.5H14" />
  </svg>
);

export const IconShare = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="18" cy="5.5" r="2.8" />
    <circle cx="6" cy="12" r="2.8" />
    <circle cx="18" cy="18.5" r="2.8" />
    <path d="m8.5 10.6 7-3.6M8.5 13.4l7 3.6" />
  </svg>
);

export const IconEdit = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>
);

export const IconTrash = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 7h16M9.5 7V5h5v2M6.5 7l.8 12.2A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.8L17.5 7" />
  </svg>
);

export const IconClose = ({ size = 18, className, strokeWidth }: P) => (
  <svg {...base(size, className)} {...(strokeWidth ? { strokeWidth } : {})}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconLogout = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" />
    <path d="M10 8.5 6.5 12l3.5 3.5M6.5 12H16" />
  </svg>
);

export const IconUser = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const IconGoogle = ({ size = 17, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z" />
    <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3a11.5 11.5 0 0 0 10.2 6.3Z" />
    <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z" />
    <path fill="#EA4335" d="M12 4.7c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3C6.5 6.9 9 4.7 12 4.7Z" />
  </svg>
);

export const IconEye = ({ size = 17, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const IconEyeOff = ({ size = 17, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M9.9 6a9.6 9.6 0 0 1 2.1-.2c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-2.5 3.4M6.3 7.7A17 17 0 0 0 2.5 12S6 18.2 12 18.2c1.3 0 2.5-.3 3.6-.7" />
    <path d="M4 4l16 16" />
  </svg>
);

export const IconStop = ({ size = 16, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <rect x="7" y="7" width="10" height="10" rx="2" />
  </svg>
);

export const IconDownload = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />
  </svg>
);

export const IconChevron = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="m8 10 4 4 4-4" />
  </svg>
);

export const IconArrowUp = ({ size = 17, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const IconPlay = ({ size = 12, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M8.5 5.6a1 1 0 0 1 1.52-.85l8.2 5.4a1.2 1.2 0 0 1 0 2.03l-8.2 5.4a1 1 0 0 1-1.52-.86Z" />
  </svg>
);

export const IconFile = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M13.5 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9.5Z" />
    <path d="M13.5 3.5v6h6" />
  </svg>
);

export const IconChat = ({ size = 15, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2.2}>
    <path d="M20.6 11.9a8.4 8.4 0 0 1-8.7 8.3 9 9 0 0 1-3.1-.5c-1.4.7-3.2 1.2-4.9 1 .8-1 1.2-2.3 1.2-3.6a8.2 8.2 0 0 1-1-4A8.4 8.4 0 0 1 12.8 3.6a8.4 8.4 0 0 1 7.8 8.3Z" />
  </svg>
);

export const IconSearch = ({ size = 15, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

export const IconSliders = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h9M17 17h3" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="15" cy="17" r="2" />
  </svg>
);

export const IconChevronLeft = ({ size = 14, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="m14.5 6-6 6 6 6" />
  </svg>
);

/* ── as abas do topo ────────────────────────────────────────────────────── */

/** Projetos: uma pilha de pastas. */
export const IconProjects = ({ size = 20, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2.2}>
    <path d="M9.2 2.9h5.6" />
    <path d="M4.6 6.2h14.8v2.4H4.6z" />
    <path d="M6.6 8.6h10.8v9.9a2.5 2.5 0 0 1-2.5 2.5H9.1a2.5 2.5 0 0 1-2.5-2.5V8.6Z" />
  </svg>
);

/** Code: as duas barras e a diagonal. */
export const IconCode = ({ size = 20, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2.2}>
    <path d="M8.6 6.6 3.6 12l5 5.4M15.4 6.6 20.4 12l-5 5.4" />
    <path d="M13.4 4.4 10.6 19.6" />
  </svg>
);

/** Designer: um pincel de ponta fina. */
export const IconDesigner = ({ size = 20, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2.2}>
    <path d="m10.1 12.7 7.8-7.8a2.6 2.6 0 0 1 3.7 3.7l-7.8 7.8" />
    <path d="M6.9 15.4c-1.6 0-2.9 1.3-2.9 3 0 1.2-2.3 1.4-1.9 1.9 1 1 2.3 1.9 3.8 1.9 2.1 0 3.8-1.7 3.8-3.8a2.9 2.9 0 0 0-2.8-3Z" />
  </svg>
);

/** Perfil: a cabeça e os ombros, num círculo. */
export const IconProfile = ({ size = 20, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="9.9" r="2.7" />
    <path d="M6.4 18.3a6 6 0 0 1 11.2 0" />
  </svg>
);

/** Microfone: ondas para o ditado. */
export const IconVoice = ({ size = 20, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <rect x="9.1" y="3.2" width="1.9" height="17.6" rx=".95" />
    <rect x="4.9" y="7.4" width="1.9" height="9.2" rx=".95" />
    <rect x="13.3" y="8.4" width="1.9" height="7.2" rx=".95" />
    <rect x="17.5" y="10.2" width="1.9" height="3.6" rx=".95" opacity=".55" />
  </svg>
);

/** Enviar: a seta no disco, inclinada como um papel dobrado. */
export const IconSendFill = ({ size = 20, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M20.3 4.1c.4-.4.2-1-.4-1l-15 5.4c-.6.2-.6 1 0 1.2l6.2 2.4c.2.1.4.2.5.4l2.5 6.1c.2.6 1 .6 1.2 0l5.4-14.5Z" />
  </svg>
);

/* ── as formas exatas do menu lateral ───────────────────────────────────── */

/** Dois balões sobrepostos, como no estado vazio do histórico. */
export const IconChatsEmpty = ({ size = 40, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
       stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
       className={className} aria-hidden>
    {/* balão de trás */}
    <path d="M11.5 7.5h11a3 3 0 0 1 3 3v6.2a3 3 0 0 1-3 3h-1.2v3.6l-3.9-3.6h-4.9" />
    {/* balão da frente, com o rabicho embaixo à esquerda */}
    <path d="M9.5 10.5h-2a3 3 0 0 0-3 3v5.4a3 3 0 0 0 3 3h.9v3.3l3.6-3.3h5.6a3 3 0 0 0 3-3v-5.4a3 3 0 0 0-3-3h-6.1" />
  </svg>
);

/** Os três controles deslizantes, como no cartão de Configurações. */
export const IconSlidersLines = ({ size = 22, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={2} strokeLinecap="round"
       className={className} aria-hidden>
    <path d="M3 6.5h5.2M12.6 6.5H21" />
    <path d="M3 12h12.4M19.8 12H21" />
    <path d="M3 17.5h3.4M10.8 17.5H21" />
    <circle cx="10.3" cy="6.5" r="2.1" />
    <circle cx="17.5" cy="12" r="2.1" />
    <circle cx="8.5" cy="17.5" r="2.1" />
  </svg>
);

/** Sol de oito raios. */
export const IconSun = ({ size = 18, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={1.9} strokeLinecap="round"
       className={className} aria-hidden>
    <circle cx="12" cy="12" r="4.1" />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i * Math.PI) / 4;
      return <path key={i} d={`M${12 + Math.cos(a) * 6.6} ${12 + Math.sin(a) * 6.6}L${12 + Math.cos(a) * 8.9} ${12 + Math.sin(a) * 8.9}`} />;
    })}
  </svg>
);

/** Lua crescente cheia. */
export const IconMoon = ({ size = 18, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
       className={className} aria-hidden>
    <path d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a8.9 8.9 0 1 0 10.8 10.8Z" />
  </svg>
);

/** A seta da direita, como no cartão de conta. */
export const IconChevronRight = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </svg>
);

/* ── ícones das abas de Configurações ─────────────────────────────────── */

/** tomada com cabo, para Conectores */
export const IconPlug = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <path d="M9 2.6v4.2M15 2.6v4.2" />
    <path d="M6.4 6.8h11.2v1.9a5.6 5.6 0 0 1-11.2 0Z" />
    <path d="M12 14.3v7.1" />
  </svg>
);

/** aro com meridianos, para Idioma */
export const IconGlobe = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <circle cx="12" cy="12" r="9.1" />
    <path d="M2.9 9.2h18.2M2.9 14.8h18.2" />
    <path d="M12 2.9c2.6 2.6 3.9 5.7 3.9 9.1s-1.3 6.5-3.9 9.1c-2.6-2.6-3.9-5.7-3.9-9.1S9.4 5.5 12 2.9Z" />
  </svg>
);

/** engrenagem, para Geral */
export const IconGear = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.65a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);

/** sol com raios de ponta redonda, para Aparência */
export const IconSunRays = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <circle cx="12" cy="12" r="3.9" />
    <path d="M12 1.9v2.4M12 19.7v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M1.9 12h2.4M19.7 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
  </svg>
);
