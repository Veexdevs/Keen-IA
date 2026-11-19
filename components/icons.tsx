"use client";

/** Ícones de traço, 1.75px, cantos redondos — um só conjunto. */

type P = { size?: number; className?: string };

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
  <svg {...base(size, className)}>
    <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
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

export const IconClose = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
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
  <svg {...base(size, className)}>
    <path d="M20.5 11.5a7.6 7.6 0 0 1-8.2 7.6 8.7 8.7 0 0 1-2.8-.5L4.5 20.5l1.4-4.2a7.4 7.4 0 0 1-1-3.9A7.6 7.6 0 0 1 12 4.5a7.6 7.6 0 0 1 8.5 7Z" />
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
