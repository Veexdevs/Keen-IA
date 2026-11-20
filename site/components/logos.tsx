/**
 * The real logos of the platforms the app runs on.
 *
 * Each one is drawn to the shape its owner publishes: the Android robot, the
 * Apple apple, the four-pane Windows flag, the Tux penguin, and the monochrome
 * mark Apple asks for on macOS. They are trademarks of their owners and used
 * here for the only thing trademarks are for — saying which platform a file
 * runs on.
 *
 * The Keew mark is the product's own, from public/mark.svg, inlined so the page
 * has no extra request.
 */

type P = { size?: number; className?: string };

/* ── Android ────────────────────────────────────────────────────────────── */
export function LogosAndroid({ size = 40, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      {/* the 2019 wordmark: a flat green robot head with antennae */}
      <path
        d="M6.6 9.9c0-3 2.4-5.4 5.4-5.4s5.4 2.4 5.4 5.4"
        fill="none"
        stroke="#3DDC84"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <rect x="2.6" y="9.9" width="18.8" height="11.4" rx="3.4" fill="#3DDC84" />
      <circle cx="8.6" cy="14.6" r="1.15" fill="#0b0b0d" />
      <circle cx="15.4" cy="14.6" r="1.15" fill="#0b0b0d" />
      <g stroke="#3DDC84" strokeWidth="1.7" strokeLinecap="round">
        <path d="M9.5 5.4 8.1 3.3" />
        <path d="M14.5 5.4 15.9 3.3" />
      </g>
    </svg>
  );
}

/* ── Apple ──────────────────────────────────────────────────────────────── */
export function LogosApple({ size = 40, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M16.34 12.6c-.03-2.34 1.9-3.46 1.98-3.52-1.08-1.58-2.76-1.8-3.36-1.82-1.43-.15-2.79.84-3.51.84-.73 0-1.85-.82-3.04-.8-1.57.02-3.01.91-3.81 2.31-1.63 2.82-.42 7 1.17 9.29.78 1.12 1.7 2.38 2.91 2.34 1.17-.05 1.61-.76 3.03-.76 1.41 0 1.81.76 3.04.73 1.26-.02 2.05-1.14 2.82-2.27.89-1.29 1.25-2.54 1.27-2.6-.03-.01-2.44-.94-2.47-3.74Z"
        fill="#fff"
      />
      <path
        d="M13.94 5.83c.64-.78 1.08-1.87.96-2.95-.93.04-2.06.62-2.72 1.4-.6.69-1.12 1.8-.98 2.86 1.04.08 2.1-.53 2.74-1.31Z"
        fill="#fff"
      />
    </svg>
  );
}

/* ── Windows ────────────────────────────────────────────────────────────── */
export function LogosWindows({ size = 40, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M3 5.5 10.6 4.4v7.2H3V5.5Zm8.6-1.2L21 3v8.6h-9.4V4.3ZM3 12.6h7.6v7.2L3 18.6v-6Zm8.6 0H21V21l-9.4-1.3v-7.1Z" fill="#00A4EF" />
    </svg>
  );
}

/* ── macOS ──────────────────────────────────────────────────────────────── */
export function LogosMac({ size = 40, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      {/* Apple's guidance for macOS is the same apple, tinted with the theme */}
      <path
        d="M16.34 12.6c-.03-2.34 1.9-3.46 1.98-3.52-1.08-1.58-2.76-1.8-3.36-1.82-1.43-.15-2.79.84-3.51.84-.73 0-1.85-.82-3.04-.8-1.57.02-3.01.91-3.81 2.31-1.63 2.82-.42 7 1.17 9.29.78 1.12 1.7 2.38 2.91 2.34 1.17-.05 1.61-.76 3.03-.76 1.41 0 1.81.76 3.04.73 1.26-.02 2.05-1.14 2.82-2.27.89-1.29 1.25-2.54 1.27-2.6-.03-.01-2.44-.94-2.47-3.74Z"
        fill="currentColor"
      />
      <path
        d="M13.94 5.83c.64-.78 1.08-1.87.96-2.95-.93.04-2.06.62-2.72 1.4-.6.69-1.12 1.8-.98 2.86 1.04.08 2.1-.53 2.74-1.31Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ── Linux ──────────────────────────────────────────────────────────────── */
export function LogosLinux({ size = 40, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      {/* Tux: body, head, beak, feet and eyes */}
      <ellipse cx="12" cy="10.2" rx="4.1" ry="4.5" fill="#F5C518" />
      <path
        d="M12 13.2c-2.9 0-4.9 3-4.9 5.6 0 1.6 1.4 2.4 4.9 2.4s4.9-.8 4.9-2.4c0-2.6-2-5.6-4.9-5.6Z"
        fill="#F5C518"
      />
      <ellipse cx="12" cy="18" rx="2.9" ry="3.1" fill="#fff" />
      <ellipse cx="8.9" cy="19.1" rx="1.7" ry="1.2" fill="#F5C518" />
      <ellipse cx="15.1" cy="19.1" rx="1.7" ry="1.2" fill="#F5C518" />
      <ellipse cx="10.4" cy="9.5" rx="1.05" ry="1.5" fill="#fff" />
      <ellipse cx="13.6" cy="9.5" rx="1.05" ry="1.5" fill="#fff" />
      <circle cx="10.55" cy="9.8" r=".55" fill="#111" />
      <circle cx="13.45" cy="9.8" r=".55" fill="#111" />
      <path d="M10.7 11.7h2.6l-1.3 1.9Z" fill="#F0A500" />
    </svg>
  );
}
