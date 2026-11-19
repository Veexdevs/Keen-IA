"use client";

/**
 * Round country flags, drawn in SVG.
 *
 * Every shape is an explicit vector rather than an emoji or a sprite image:
 * emojis render as two-letter boxes on Windows, and images would need a
 * request per flag. These are a few paths each, they scale, and they sit
 * correctly inside a circle.
 */

type P = { size?: number; className?: string };

import { useId } from "react";

/**
 * The circular frame.
 *
 * The clip path needs a unique id per instance — a fixed id makes every flag
 * on the page share the first one, which is how a Brazilian flag ends up
 * clipped by a Japanese circle. useId gives a stable, unique value.
 */
const Circle = ({ size, className, children }: P & { children: React.ReactNode }) => {
  const raw = useId();
  const id = `flag-${raw.replace(/[:]/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      style={{ borderRadius: "50%", display: "block", flexShrink: 0 }}
    >
      <defs>
        <clipPath id={id}>
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
      <circle cx="12" cy="12" r="11.35" fill="none" stroke="rgba(127,127,127,0.4)" strokeWidth="1.3" />
    </svg>
  );
};

/* ── United States ─────────────────────────────────────────────────────── */
export const FlagUS = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#fff" />
    {[0, 2, 4, 6, 8, 10, 12].map((i) => (
      <rect key={i} y={i * 1.85} width="24" height="1.85" fill="#B22234" />
    ))}
    <rect width="11" height="9.3" fill="#3C3B6E" />
    {[0, 1, 2].map((r) =>
      [0, 1, 2, 3].map((c) => (
        <circle key={`${r}-${c}`} cx={1.6 + c * 2.5} cy={1.9 + r * 2.8} r="0.62" fill="#fff" />
      )),
    )}
  </Circle>
);

/* ── Brazil ────────────────────────────────────────────────────────────── */
export const FlagBR = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#009B3A" />
    <path d="M12 3.6 21 12l-9 8.4L3 12Z" fill="#FEDF00" />
    <circle cx="12" cy="12" r="4.1" fill="#002776" />
    <path d="M8.2 10.9c2.4 1.1 5.2 1.2 7.6.2" stroke="#fff" strokeWidth="0.9" fill="none" />
  </Circle>
);

/* ── Spain ─────────────────────────────────────────────────────────────── */
export const FlagES = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#AA151B" />
    <rect y="6" width="24" height="12" fill="#F1BF00" />
    <rect x="5.2" y="9.6" width="2.1" height="4.9" rx="0.5" fill="#AA151B" />
    <rect x="5.8" y="8.7" width="0.9" height="1" fill="#AA151B" />
  </Circle>
);

/* ── France ────────────────────────────────────────────────────────────── */
export const FlagFR = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="8" height="24" fill="#0055A4" />
    <rect x="8" width="8" height="24" fill="#fff" />
    <rect x="16" width="8" height="24" fill="#EF4135" />
  </Circle>
);

/* ── Germany ───────────────────────────────────────────────────────────── */
export const FlagDE = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="8" fill="#000" />
    <rect y="8" width="24" height="8" fill="#DD0000" />
    <rect y="16" width="24" height="8" fill="#FFCE00" />
  </Circle>
);

/* ── Italy ─────────────────────────────────────────────────────────────── */
export const FlagIT = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="8" height="24" fill="#009246" />
    <rect x="8" width="8" height="24" fill="#fff" />
    <rect x="16" width="8" height="24" fill="#CE2B37" />
  </Circle>
);

/* ── Portugal ──────────────────────────────────────────────────────────── */
export const FlagPT = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#FF0000" />
    <rect width="9.6" height="24" fill="#006600" />
    <circle cx="9.6" cy="12" r="3.1" fill="#FFD700" opacity="0.95" />
    <circle cx="9.6" cy="12" r="2.2" fill="#FF0000" />
  </Circle>
);

/* ── Mexico ────────────────────────────────────────────────────────────── */
export const FlagMX = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="8" height="24" fill="#006847" />
    <rect x="8" width="8" height="24" fill="#fff" />
    <rect x="16" width="8" height="24" fill="#CE1126" />
    <circle cx="12" cy="12" r="2.1" fill="#8B5A2B" opacity="0.85" />
  </Circle>
);

/* ── Argentina ─────────────────────────────────────────────────────────── */
export const FlagAR = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#74ACDF" />
    <rect y="8" width="24" height="8" fill="#fff" />
    <circle cx="12" cy="12" r="1.7" fill="#F6B40E" />
  </Circle>
);

/* ── Colombia ──────────────────────────────────────────────────────────── */
export const FlagCO = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="12" fill="#FCD116" />
    <rect y="12" width="24" height="6" fill="#003893" />
    <rect y="18" width="24" height="6" fill="#CE1126" />
  </Circle>
);

/* ── Chile ─────────────────────────────────────────────────────────────── */
export const FlagCL = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#fff" />
    <rect y="12" width="24" height="12" fill="#D52B1E" />
    <rect width="12" height="12" fill="#0039A6" />
    <path d="M6 4.4 6.9 7h2.7l-2.2 1.6.9 2.7L6 9.7l-2.3 1.6.9-2.7L2.4 7h2.7Z" fill="#fff" />
  </Circle>
);

/* ── Peru ──────────────────────────────────────────────────────────────── */
export const FlagPE = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="8" height="24" fill="#D91023" />
    <rect x="8" width="8" height="24" fill="#fff" />
    <rect x="16" width="8" height="24" fill="#D91023" />
  </Circle>
);

/* ── Uruguay ───────────────────────────────────────────────────────────── */
export const FlagUY = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#fff" />
    {[1, 3, 5, 7].map((i) => (
      <rect key={i} y={i * 2.7} width="24" height="2.7" fill="#0038A8" />
    ))}
    <rect width="10" height="10" fill="#fff" />
    <circle cx="5" cy="5" r="2.4" fill="#FCD116" />
  </Circle>
);

/* ── United Kingdom ────────────────────────────────────────────────────── */
export const FlagGB = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#012169" />
    <path d="M0 0l24 24M24 0L0 24" stroke="#fff" strokeWidth="4.4" />
    <path d="M0 0l24 24M24 0L0 24" stroke="#C8102E" strokeWidth="2.1" />
    <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="7" />
    <path d="M12 0v24M0 12h24" stroke="#C8102E" strokeWidth="4" />
  </Circle>
);

/* ── Canada ────────────────────────────────────────────────────────────── */
export const FlagCA = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#fff" />
    <rect width="6.4" height="24" fill="#D80621" />
    <rect x="17.6" width="6.4" height="24" fill="#D80621" />
    <path
      d="M12 5.5 13 8l2-.7-.8 2.4 1.9 1-1.9 1.2.5 1.9-2-.6-.7 2.3-.7-2.3-2 .6.5-1.9L7.9 10.7l1.9-1-.8-2.4 2 .7Z"
      fill="#D80621"
    />
  </Circle>
);

/* ── Japan ─────────────────────────────────────────────────────────────── */
export const FlagJP = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#fff" />
    <circle cx="12" cy="12" r="6.4" fill="#BC002D" />
  </Circle>
);

/* ── China ─────────────────────────────────────────────────────────────── */
export const FlagCN = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#DE2910" />
    <path d="M6 4.4 6.9 7h2.7l-2.2 1.6.9 2.7L6 9.7l-2.3 1.6.9-2.7L2.4 7h2.7Z" fill="#FFDE00" />
    {[
      [11, 4.3],
      [13.4, 6.6],
      [13.4, 9.6],
      [11, 11.9],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="0.95" fill="#FFDE00" />
    ))}
  </Circle>
);

/* ── South Korea ───────────────────────────────────────────────────────── */
export const FlagKR = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#fff" />
    <path d="M12 6.4a5.6 5.6 0 0 1 0 11.2 2.8 2.8 0 0 1 0-5.6 2.8 2.8 0 0 0 0-5.6Z" fill="#CD2E3A" />
    <path d="M12 6.4a5.6 5.6 0 0 0 0 11.2 2.8 2.8 0 0 0 0-5.6 2.8 2.8 0 0 1 0-5.6Z" fill="#0047A0" />
    <rect x="3.6" y="4.6" width="4.6" height="1" rx="0.5" fill="#000" transform="rotate(-35 5.9 5.1)" />
    <rect x="15.8" y="18.4" width="4.6" height="1" rx="0.5" fill="#000" transform="rotate(-35 18.1 18.9)" />
  </Circle>
);

/* ── India ─────────────────────────────────────────────────────────────── */
export const FlagIN = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="8" fill="#FF9933" />
    <rect y="8" width="24" height="8" fill="#fff" />
    <rect y="16" width="24" height="8" fill="#138808" />
    <circle cx="12" cy="12" r="2.6" fill="none" stroke="#000080" strokeWidth="0.8" />
    <circle cx="12" cy="12" r="0.7" fill="#000080" />
  </Circle>
);

/* ── Russia ────────────────────────────────────────────────────────────── */
export const FlagRU = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="8" fill="#fff" />
    <rect y="8" width="24" height="8" fill="#0039A6" />
    <rect y="16" width="24" height="8" fill="#D52B1E" />
  </Circle>
);

/* ── Netherlands ───────────────────────────────────────────────────────── */
export const FlagNL = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="8" fill="#AE1C28" />
    <rect y="8" width="24" height="8" fill="#fff" />
    <rect y="16" width="24" height="8" fill="#21468B" />
  </Circle>
);

/* ── Poland ────────────────────────────────────────────────────────────── */
export const FlagPL = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="12" fill="#fff" />
    <rect y="12" width="24" height="12" fill="#DC143C" />
  </Circle>
);

/* ── Turkey ────────────────────────────────────────────────────────────── */
export const FlagTR = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#E30A17" />
    <circle cx="10.4" cy="12" r="4.4" fill="#fff" />
    <circle cx="12" cy="12" r="3.5" fill="#E30A17" />
    <path d="M16.2 10.2l1.3 2.1 2.4-.6-1.6 1.9 1.4 2-2.3-.9-1.6 1.9.3-2.5-2.3-.9 2.4-.6Z" fill="#fff" />
  </Circle>
);

/* ── Saudi Arabia ──────────────────────────────────────────────────────── */
export const FlagSA = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#006C35" />
    <rect x="5" y="9.4" width="14" height="1.4" rx="0.7" fill="#fff" />
    <rect x="5.6" y="13.4" width="12.8" height="1.1" rx="0.5" fill="#fff" />
    <path d="M17.8 14.2c.8-.3 1.2-1 1-1.8" stroke="#fff" strokeWidth="1" fill="none" strokeLinecap="round" />
  </Circle>
);

/* ── Indonesia ─────────────────────────────────────────────────────────── */
export const FlagID = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="12" fill="#CE1126" />
    <rect y="12" width="24" height="12" fill="#fff" />
  </Circle>
);

/* ── Egypt ─────────────────────────────────────────────────────────────── */
export const FlagEG = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="8" fill="#CE1126" />
    <rect y="8" width="24" height="8" fill="#fff" />
    <rect y="16" width="24" height="8" fill="#000" />
    <circle cx="12" cy="12" r="1.5" fill="#C09300" />
  </Circle>
);

/* ── Nigeria ───────────────────────────────────────────────────────────── */
export const FlagNG = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="8" height="24" fill="#008751" />
    <rect x="8" width="8" height="24" fill="#fff" />
    <rect x="16" width="8" height="24" fill="#008751" />
  </Circle>
);

/* ── South Africa ──────────────────────────────────────────────────────── */
export const FlagZA = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="12" fill="#DE3831" />
    <rect y="12" width="24" height="12" fill="#002395" />
    <path d="M0 12h24" stroke="#007A4D" strokeWidth="5" />
    <path d="M0 2 11 12 0 22Z" fill="#007A4D" />
    <path d="M0 4.2 8.2 12 0 19.8Z" fill="#FFB612" />
    <path d="M0 6.6 5.6 12 0 17.4Z" fill="#000" />
  </Circle>
);

/* ── Australia ─────────────────────────────────────────────────────────── */
export const FlagAU = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#012169" />
    <path d="M0 0l8 8M8 0L0 8" stroke="#fff" strokeWidth="1.8" />
    <path d="M0 0l8 8M8 0L0 8" stroke="#C8102E" strokeWidth="0.9" />
    <path d="M4 0v8M0 4h8" stroke="#fff" strokeWidth="2.6" />
    <path d="M4 0v8M0 4h8" stroke="#C8102E" strokeWidth="1.4" />
    {[
      [16, 7],
      [19, 11],
      [14.5, 12],
      [17.5, 15.5],
      [20, 8.6],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="0.85" fill="#fff" />
    ))}
  </Circle>
);

/* ── Ukraine ───────────────────────────────────────────────────────────── */
export const FlagUA = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="12" fill="#0057B7" />
    <rect y="12" width="24" height="12" fill="#FFD700" />
  </Circle>
);

/* ── Vietnam ───────────────────────────────────────────────────────────── */
export const FlagVN = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#DA251D" />
    <path
      d="M12 6.4l1.55 4.77h5.01l-4.05 2.94 1.55 4.77L12 15.94l-4.06 2.94 1.55-4.77-4.05-2.94h5.01Z"
      fill="#FFFF00"
    />
  </Circle>
);

/* ── Thailand ──────────────────────────────────────────────────────────── */
export const FlagTH = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#A51931" />
    <rect y="4" width="24" height="16" fill="#F4F5F8" />
    <rect y="8" width="24" height="8" fill="#2D2A4A" />
  </Circle>
);

/* ── Israel ────────────────────────────────────────────────────────────── */
export const FlagIL = ({ size = 22, className }: P) => (
  <Circle size={size} className={className}>
    <rect width="24" height="24" fill="#fff" />
    <rect y="3.4" width="24" height="2.6" fill="#0038B8" />
    <rect y="18" width="24" height="2.6" fill="#0038B8" />
    <path
      d="M12 8.2l2.6 4.5h-5.2Zm0 1.7l1.7 2.8h-3.4Z"
      fill="#0038B8"
      fillRule="evenodd"
    />
    <path
      d="M12 15.8l-2.6-4.5h5.2Zm0-1.7l-1.7-2.8h3.4Z"
      fill="#0038B8"
      fillRule="evenodd"
    />
  </Circle>
);

/* ── registry ──────────────────────────────────────────────────────────── */

export const FLAGS = {
  us: FlagUS,
  br: FlagBR,
  es: FlagES,
  fr: FlagFR,
  de: FlagDE,
  it: FlagIT,
  pt: FlagPT,
  mx: FlagMX,
  ar: FlagAR,
  co: FlagCO,
  cl: FlagCL,
  pe: FlagPE,
  uy: FlagUY,
  gb: FlagGB,
  ca: FlagCA,
  jp: FlagJP,
  cn: FlagCN,
  kr: FlagKR,
  in: FlagIN,
  ru: FlagRU,
  nl: FlagNL,
  pl: FlagPL,
  tr: FlagTR,
  sa: FlagSA,
  id: FlagID,
  eg: FlagEG,
  ng: FlagNG,
  za: FlagZA,
  au: FlagAU,
  ua: FlagUA,
  vn: FlagVN,
  th: FlagTH,
  il: FlagIL,
} as const;

export type FlagCode = keyof typeof FLAGS;

export function Flag({ code, size = 22 }: { code: FlagCode; size?: number }) {
  const F = FLAGS[code] ?? FLAGS.us;
  return <F size={size} />;
}
