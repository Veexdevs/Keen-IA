"use client";

/** Marks for each connector, drawn as SVG so they scale and theme cleanly. */

type P = { size?: number };

export function GitHubMark({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function VercelMark({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5 23.2 21.5H.8Z" />
    </svg>
  );
}

export function SupabaseMark({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13.2 1.5 3.6 14.3h7.3l-.9 8.2 9.9-13.1h-7.4Z" fill="#3ECF8E" />
    </svg>
  );
}

export function WikipediaMark({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <text
        x="12"
        y="18"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="19"
        fontWeight="700"
        fill="currentColor"
      >
        W
      </text>
    </svg>
  );
}

export function HackerNewsMark({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="1" y="1" width="22" height="22" rx="3" fill="#FF6600" />
      <path
        d="M8 6.5 11.2 12v5h1.6v-5L16 6.5h-1.8l-2.2 4.2-2.2-4.2Z"
        fill="#fff"
      />
    </svg>
  );
}

export function WeatherMark({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8.5" cy="8.5" r="3" />
      <path d="M8.5 2.5v1.6M8.5 12.9v1.6M2.5 8.5h1.6M12.9 8.5h1.6M4.3 4.3l1.1 1.1M11.6 11.6l1.1 1.1M12.7 4.3l-1.1 1.1" />
      <path d="M17.5 20.5h-8a3.2 3.2 0 0 1-.3-6.4 4.2 4.2 0 0 1 8.1-.6 3.5 3.5 0 0 1 .2 7Z" />
    </svg>
  );
}

export function CurrencyMark({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v10M14.5 9.3A2.6 2.6 0 0 0 12 8h-.4a2.2 2.2 0 0 0-.3 4.4h1.5a2.2 2.2 0 0 1-.3 4.4h-.5a2.6 2.6 0 0 1-2.5-1.3" />
    </svg>
  );
}
