/**
 * The few drawings this page needs.
 *
 * Inline SVG rather than an icon package: the whole page uses six shapes, and
 * a dependency for six shapes is weight the visitor pays for on a download
 * page. The mark is the same path the app uses, so the brand is identical.
 */

type P = { size?: number; className?: string };

/** Keew's mark, the same one the app ships. */
export function Mark({ size = 26, className }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 420 420"
      className={className}
      fill="#0048f8"
      aria-hidden
    >
      <path d="M199.5 419.32c-33.7-1.7-69.2-12.6-96.45-29.63-18.18-11.37-44.68-34.86-52.86-46.87-9.16-13.44 1.29-21.21 14.95-11.12 31.97 23.61 58.88 34.5 92.13 37.3 74.65 6.29 146.08-42.41 172.74-143.09 3.3-8.63 6.62-5.52 6.62 4.3 0 22.88-9.1 63.35-20.35 88.6-19.67 44.2-50.6 76.6-88.4 92.5-12.3 5.2-23.8 7.6-37.4 8.1l.02-.09Z" />
      <path d="M199.8 219.6c-1.5 0-2.2-.7-2.2-2.2V3.3c0-1.5.7-2.2 2.2-2.2h32.4c1.5 0 2.2.7 2.2 2.2v153.4c0 4.5 5.3 6.7 8.4 3.6L347.9 3.9c1.2-1.2 2.6-1.5 4.2-.9l38.6 13.3c2.4.8 2.8 3.4.9 5.2L258.4 158.9c-2.9 2.8-2.9 7.5 0 10.3l135.9 130.1c1.9 1.8 1.5 4.4-.9 5.2l-39.2 13.2c-1.6.5-3 .2-4.1-1L215 177.5c-3.1-3.1-8.4-.9-8.4 3.6v36.3c0 1.5-.7 2.2-2.2 2.2h-4.6Z" />
    </svg>
  );
}

export function Spark({ size = 16, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2.6l2.1 6.1 6.1 2.1-6.1 2.1-2.1 6.1-2.1-6.1L3.8 10.8l6.1-2.1L12 2.6Z"
        fill="currentColor"
      />
      <path
        d="M18.6 15.8l.9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9.9-2.5Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

export function Download({ size = 15, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3.5v11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path
        d="M7.6 10.4L12 14.8l4.4-4.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.5 19.5h15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/** A phone, drawn with the rounded corner the real thing has. */
export function Phone({ size = 19, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="6.4" y="2.6" width="11.2" height="18.8" rx="2.9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10.4 5.1h3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="18.2" r="0.95" fill="currentColor" />
    </svg>
  );
}

/** The Windows mark, four panes. */
export function WindowsMark({ size = 18, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 4.6l7.6-1.05v7.7H3V4.6Zm8.6-1.2L21 2v9.25h-9.4V3.4ZM3 12.2h7.6v7.75L3 18.9v-6.7Zm8.6 0H21V22l-9.4-1.3v-8.5Z" />
    </svg>
  );
}

/** Tux, reduced to what reads at 18 pixels. */
export function TuxMark({ size = 18, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2.6c2.5 0 4.1 1.9 4.1 4.4 0 1.7-.3 3 .3 4.4 1 2.4 3 4.6 3.3 6.6.3 2.2-1.2 3.4-3.3 3.4H7.6c-2.1 0-3.6-1.2-3.3-3.4.3-2 2.3-4.2 3.3-6.6.6-1.4.3-2.7.3-4.4 0-2.5 1.6-4.4 4.1-4.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10.1" cy="6.6" r="0.95" fill="currentColor" />
      <circle cx="13.9" cy="6.6" r="0.95" fill="currentColor" />
      <path d="M10.4 8.9c.9.85 2.3.85 3.2 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.1 14.2h7.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[11.5px] font-medium text-muted">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-soft opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-soft" />
      </span>
      {children}
    </span>
  );
}
