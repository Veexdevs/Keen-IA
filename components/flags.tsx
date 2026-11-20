"use client";

/**
 * Round country flags.
 *
 * These are the platform's own flag emoji, not drawings. Every system has a
 * real set — Android, iOS, macOS, Windows 11 and Linux all ship them — and they
 * are correct for countries we would never get right by hand (we had the Arabic
 * and Israeli flags on the wrong languages for exactly that reason).
 *
 * Windows and some Linux setups ship no colour emoji font: there the glyph comes
 * out as two letters, so the flag is rendered smaller inside a neutral disc and
 * the letters read as a country code, which is a legible fallback rather than a
 * broken box.
 *
 * Languages with no single home country (Latin, Esperanto, Sanskrit, the CLDR
 * constructs) get a globe instead of a borrowed flag.
 */

/*
 * Regional indicator symbols: "br" → 🇧🇷. This is the standard two-letter
 * encoding of a flag, not a hard-coded table.
 */
const toEmoji = (code: string) =>
  String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );

export function Flag({
  code,
  size = 22,
  className = "",
}: {
  /** ISO-3166 alpha-2, or undefined for languages with no country */
  code?: string;
  size?: number;
  className?: string;
}) {
  if (!code) {
    return (
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-full border border-border bg-panel text-subtle ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.52, lineHeight: 1 }}
      >
        {/* a globe, drawn as text so it inherits the theme colour */}
        ✳
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={code.toUpperCase()}
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.86, lineHeight: 1 }}
    >
      {toEmoji(code)}
    </span>
  );
}
