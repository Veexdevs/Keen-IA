/**
 * Keew IA — local reasoning core
 *
 * What Keew runs on its own, without calling anything external: symbolic
 * analysis, exact arithmetic, unit conversion, dates, extractive summaries,
 * text transforms and retrieval over the knowledge base.
 *
 * It is deterministic and auditable. When a request is beyond what the core
 * answers with confidence, the route hands it up to the language engine — or
 * says plainly that no engine is connected.
 *
 * Everything user-facing here is in English. Input is still understood in
 * English and Portuguese, because people type in both.
 */

import type { EngineResult, KnowledgeDoc } from "./types";

const fmtNum = (n: number) => {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString("en-US");
  return parseFloat(n.toPrecision(10)).toLocaleString("en-US", { maximumFractionDigits: 10 });
};

/* ══════════════════════════════════════════════════════════════ MATH ══ */

type Tok = { t: "num" | "op" | "lp" | "rp"; v: string };

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };

function lex(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const raw = s.slice(i, j);
      if ((raw.match(/\./g) || []).length > 1) return [];
      out.push({ t: "num", v: raw });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      const word = s.slice(i, j).toLowerCase();
      if (!(word in CONSTS)) return [];
      out.push({ t: "num", v: String(CONSTS[word]) });
      i = j;
      continue;
    }
    if ("+-*/^%".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
    if (c === "(") { out.push({ t: "lp", v: c }); i++; continue; }
    if (c === ")") { out.push({ t: "rp", v: c }); i++; continue; }
    return [];
  }
  return out;
}

function evaluate(tokens: Tok[]): number | null {
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = () => tokens[pos++];

  function primary(): number | null {
    const tk = peek();
    if (!tk) return null;
    if (tk.t === "num") { eat(); return parseFloat(tk.v); }
    if (tk.t === "lp") {
      eat();
      const v = expr();
      if (!peek() || peek().t !== "rp") return null;
      eat();
      return v;
    }
    if (tk.t === "op" && tk.v === "-") { eat(); const v = primary(); return v === null ? null : -v; }
    return null;
  }

  function power(): number | null {
    const base = primary();
    if (base === null) return null;
    if (peek()?.t === "op" && peek().v === "^") {
      eat();
      const exp = power();
      if (exp === null) return null;
      return Math.pow(base, exp);
    }
    return base;
  }

  function term(): number | null {
    let left = power();
    if (left === null) return null;
    while (peek()?.t === "op" && "*/%".includes(peek().v)) {
      const op = eat().v;
      const right = power();
      if (right === null) return null;
      left = op === "*" ? left * right : op === "/" ? left / right : left % right;
    }
    return left;
  }

  function expr(): number | null {
    let left = term();
    if (left === null) return null;
    while (peek()?.t === "op" && "+-".includes(peek().v)) {
      const op = eat().v;
      const right = term();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  const value = expr();
  if (pos !== tokens.length || value === null || !Number.isFinite(value)) return null;
  return value;
}

/** dd/mm/yyyy, yyyy-mm-dd, "25 December 2026" — never arithmetic. */
const LOOKS_LIKE_DATE =
  /\b\d{1,4}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{1,4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i;

function extractExpression(text: string): string | null {
  // a date is not a division: 12/25/2026 must never become 0.00023692
  if (LOOKS_LIKE_DATE.test(text)) return null;

  let s = text
    .toLowerCase()
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/,/g, "")
    .replace(/\b(what is|what's|how much is|calculate|compute|solve|evaluate|tell me|result of|equals?)\b/g, " ")
    .replace(/\b(plus|minus|times|divided by|over)\b/g, (m) =>
      m === "plus" ? "+" : m === "minus" ? "-" : m === "times" ? "*" : "/")
    .replace(/\bpercent of\b/g, "% of")
    .replace(/\b(the answer to|please|kindly|for me)\b/g, " ")
    .replace(/\bsquare root of\s*(\d+(?:\.\d+)?)/g, "($1)^0.5")
    .replace(/\bsqrt\s*\(/g, "(")
    .trim();

  // "15% of 240" → 15/100*240
  s = s.replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/g, "($1/100*$2)");

  if (!/[0-9]/.test(s)) return null;
  if (!/[+\-*/^%]/.test(s)) return null;

  const m = s.match(/[-+*/^%().\d\s]{3,}/);
  if (!m) return null;
  const expr = m[0].trim();
  // needs at least one operator between numbers to be arithmetic
  if (!/[0-9]\s*[+\-*/^%]\s*[0-9().]/.test(expr) && !/[()]/.test(expr)) return null;
  return expr;
}

export function tryMath(text: string): EngineResult | null {
  const expr = extractExpression(text);
  if (!expr) return null;
  const tokens = lex(expr);
  if (!tokens.length || tokens.length > 200) return null;
  const value = evaluate(tokens);
  if (value === null) return null;

  const pretty = expr.replace(/\s+/g, " ").trim();

  return {
    skill: "math",
    terminal: true,
    confidence: 0.99,
    reasoning: `Parsed "${pretty}" and evaluated it with the deterministic core.`,
    answer:
      `**${pretty} = ${fmtNum(value)}**\n\n` +
      (Number.isInteger(value)
        ? "Exact result."
        : `Rounded: ${parseFloat(value.toFixed(4)).toLocaleString("en-US", { maximumFractionDigits: 4 })}.`) +
      "\n\n> Computed locally by Keew's reasoning core — deterministic, no external call.",
  };
}

/* ══════════════════════════════════════════════════════ UNIT CONVERSION ══ */

type Unit = { aliases: string[]; dim: string; toBase: number; label: string };

const UNITS: Unit[] = [
  { aliases: ["km", "kilometer", "kilometers", "kilometre", "kilometres", "quilometro", "quilometros"], dim: "length", toBase: 1000, label: "km" },
  { aliases: ["m", "meter", "meters", "metro", "metros"], dim: "length", toBase: 1, label: "m" },
  { aliases: ["cm", "centimeter", "centimeters", "centimetro", "centimetros"], dim: "length", toBase: 0.01, label: "cm" },
  { aliases: ["mm", "millimeter", "millimeters", "milimetro", "milimetros"], dim: "length", toBase: 0.001, label: "mm" },
  { aliases: ["mi", "mile", "miles", "milha", "milhas"], dim: "length", toBase: 1609.344, label: "mi" },
  { aliases: ["ft", "foot", "feet", "pe", "pes"], dim: "length", toBase: 0.3048, label: "ft" },
  { aliases: ["in", "inch", "inches", "polegada", "polegadas"], dim: "length", toBase: 0.0254, label: "in" },
  { aliases: ["yd", "yard", "yards", "jarda", "jardas"], dim: "length", toBase: 0.9144, label: "yd" },
  { aliases: ["nmi", "nautical mile", "nautical miles"], dim: "length", toBase: 1852, label: "nmi" },
  { aliases: ["kg", "kilogram", "kilograms", "quilo", "quilos", "quilograma"], dim: "mass", toBase: 1, label: "kg" },
  { aliases: ["g", "gram", "grams", "grama", "gramas"], dim: "mass", toBase: 0.001, label: "g" },
  { aliases: ["mg", "milligram", "milligrams"], dim: "mass", toBase: 0.000001, label: "mg" },
  { aliases: ["t", "ton", "tonne", "tonelada", "toneladas"], dim: "mass", toBase: 1000, label: "t" },
  { aliases: ["lb", "lbs", "pound", "pounds", "libra", "libras"], dim: "mass", toBase: 0.45359237, label: "lb" },
  { aliases: ["oz", "ounce", "ounces", "onca", "oncas"], dim: "mass", toBase: 0.028349523125, label: "oz" },
  { aliases: ["st", "stone", "stones"], dim: "mass", toBase: 6.35029318, label: "st" },
  { aliases: ["l", "liter", "liters", "litre", "litres", "litro", "litros"], dim: "volume", toBase: 1, label: "L" },
  { aliases: ["ml", "milliliter", "milliliters", "mililitro", "mililitros"], dim: "volume", toBase: 0.001, label: "mL" },
  { aliases: ["gal", "gallon", "gallons", "galao", "galoes"], dim: "volume", toBase: 3.785411784, label: "gal" },
  { aliases: ["floz", "fluid ounce", "fluid ounces"], dim: "volume", toBase: 0.0295735295625, label: "fl oz" },
  { aliases: ["cup", "cups", "xícara", "xicaras"], dim: "volume", toBase: 0.2365882365, label: "cup" },
  { aliases: ["kb", "kilobyte", "kilobytes"], dim: "data", toBase: 1000, label: "KB" },
  { aliases: ["mb", "megabyte", "megabytes"], dim: "data", toBase: 1e6, label: "MB" },
  { aliases: ["gb", "gigabyte", "gigabytes"], dim: "data", toBase: 1e9, label: "GB" },
  { aliases: ["tb", "terabyte", "terabytes"], dim: "data", toBase: 1e12, label: "TB" },
  { aliases: ["s", "sec", "second", "seconds", "segundo", "segundos"], dim: "time", toBase: 1, label: "s" },
  { aliases: ["min", "minute", "minutes", "minuto", "minutos"], dim: "time", toBase: 60, label: "min" },
  { aliases: ["h", "hr", "hour", "hours", "hora", "horas"], dim: "time", toBase: 3600, label: "h" },
  { aliases: ["d", "day", "days", "dia", "dias"], dim: "time", toBase: 86400, label: "d" },
  { aliases: ["wk", "week", "weeks", "semana", "semanas"], dim: "time", toBase: 604800, label: "wk" },
  { aliases: ["kmh", "kph", "kilometers per hour"], dim: "speed", toBase: 1, label: "km/h" },
  { aliases: ["mph", "miles per hour"], dim: "speed", toBase: 1.609344, label: "mph" },
  { aliases: ["ms", "m/s", "meters per second"], dim: "speed", toBase: 3.6, label: "m/s" },
  { aliases: ["ha", "hectare", "hectares"], dim: "area", toBase: 10000, label: "ha" },
  { aliases: ["ac", "acre", "acres"], dim: "area", toBase: 4046.8564224, label: "ac" },
  { aliases: ["km2", "sqkm", "square kilometers"], dim: "area", toBase: 1e6, label: "km²" },
  { aliases: ["m2", "sqm", "square meters"], dim: "area", toBase: 1, label: "m²" },
  { aliases: ["ft2", "sqft", "square feet"], dim: "area", toBase: 0.09290304, label: "ft²" },
];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\.$/, "").trim();

function findUnit(word: string): Unit | undefined {
  const w = norm(word).replace(/\s+/g, " ");
  return UNITS.find((u) => u.aliases.includes(w));
}

const CONV_WORDS = "to|in|into|as|para|em|->|→|=>|=|is";

export function tryConversion(text: string): EngineResult | null {
  // temperature first, because °C/°F are not linear from zero
  const temp = text.match(
    /(-?\d+(?:[.,]\d+)?)\s*°?\s*(c|f|celsius|fahrenheit|centigrade)\b[^a-z]*(?:to|in|into|as|para|em|->|→|=)?\s*(?:°?\s*)?(c|f|celsius|fahrenheit|centigrade)\b/i,
  );
  if (temp) {
    const v = parseFloat(temp[1].replace(",", "."));
    const from = temp[2].toLowerCase()[0];
    const to = temp[3].toLowerCase()[0];
    const c = from === "c" ? v : ((v - 32) * 5) / 9;
    const out = to === "c" ? c : (c * 9) / 5 + 32;
    return {
      skill: "units",
      terminal: true,
      confidence: 0.99,
      reasoning: "Applied the exact temperature formula (not a linear factor).",
      answer: `**${fmtNum(v)} °${from.toUpperCase()} = ${fmtNum(out)} °${to.toUpperCase()}**\n\n> Converted locally by Keew's core.`,
    };
  }

  const m = text.match(
    new RegExp(`(-?\\d+(?:[.,]\\d+)?)\\s*([a-zA-Zµ°][a-zA-Zµ°\\s/]{0,18}?)\\s*(?:${CONV_WORDS})\\s+([a-zA-Zµ°][a-zA-Zµ°\\s/]{0,18})`, "i"),
  );
  if (!m) return null;

  const value = parseFloat(m[1].replace(",", "."));
  const from = findUnit(m[2]);
  const to = findUnit(m[3].replace(/\s+$/, ""));
  if (!from || !to || from.dim !== to.dim) return null;

  const out = (value * from.toBase) / to.toBase;

  return {
    skill: "units",
    terminal: true,
    confidence: 0.98,
    reasoning: `Converted to the ${from.dim} base unit and then to the target (factor ${fmtNum(from.toBase / to.toBase)}).`,
    answer: `**${fmtNum(value)} ${from.label} = ${fmtNum(out)} ${to.label}**\n\n> Converted locally by Keew's core.`,
  };
}

/* ════════════════════════════════════════════════════════════════ TIME ══ */

const TIMEZONE = "America/Sao_Paulo";

/**
 * Time phrases, English and Portuguese. Written without most accents on
 * purpose: the text is normalized to ASCII before matching.
 */
const WANTS_TIME =
  /\b(what time|current time|time now|time is it|today|todays date|what day|what date|day of the week|timestamp|calendar|date and time)\b/;
const WANTS_TIME_PT =
  /\b(que dia|data de hoje|dia da semana|que horas|hora agora|calendario)\b/;

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** dates that looked like dates but are not real (31/02/2026) */
const rejected: string[] = [];

/**
 * Reads dates written the ways people actually write them.
 *
 * The interface is English, so `12/25/2026` is month/day/year. But `25/12/2026`
 * is unambiguous the other way, and `2026-12-25` is ISO. Guessing wrong here
 * produces a confidently wrong answer, so the order is decided per value.
 */
function parseDates(text: string): Date[] {
  const out: Date[] = [];
  rejected.length = 0;

  // ISO first: 2026-12-25 — only one reading
  for (const m of text.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) {
    out.push(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
  }
  if (out.length) return out;

  for (const m of text.matchAll(/\b(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{2,4})\b/g)) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);

    let month: number;
    let day: number;

    if (a > 12 && b <= 12) {
      day = a; month = b;            // 25/12 — day first, no ambiguity
    } else if (b > 12 && a <= 12) {
      month = a; day = b;            // 12/25 — month first
    } else if (a > 12 && b > 12) {
      continue;                      // neither can be a month: not a date
    } else {
      month = a; day = b;            // both ≤ 12: English order
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      rejected.push(`${m[1]}/${m[2]}/${m[3]}`);
      continue;
    }
    const d = new Date(Date.UTC(year, month - 1, day));
    // reject values that rolled over, like February 31 — say so, don't guess
    if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
      rejected.push(`${m[1]}/${m[2]}/${m[3]}`);
      continue;
    }
    out.push(d);
  }

  return out;
}

export function tryDateTime(text: string, now = new Date()): EngineResult | null {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[!?.,;:]/g, " ").replace(/\s+/g, " ").trim();

  if (WANTS_TIME.test(t) || WANTS_TIME_PT.test(t)) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: TIMEZONE,
    });
    return {
      skill: "datetime",
      terminal: true,
      confidence: 0.99,
      reasoning: "Read the system clock and formatted it with Intl in São Paulo time.",
      answer:
        `**${dtf.format(now)}** (São Paulo time)\n\n` +
        `- UTC: ${now.toISOString()}\n` +
        `- Unix timestamp: \`${Math.floor(now.getTime() / 1000)}\`\n` +
        `- ISO week: ${isoWeek(now)}`,
    };
  }

  const dates = parseDates(text);

  if (dates.length >= 2 && /\b(difference|between|until|since|days|left)\b|\b(diferenca|entre|ate|desde|dias)\b/.test(t)) {
    const [a, b] = dates;
    const days = Math.round(Math.abs(b.getTime() - a.getTime()) / 86400000);
    return {
      skill: "datetime",
      terminal: true,
      confidence: 0.97,
      reasoning: "Subtracted the timestamps and converted milliseconds to days.",
      answer:
        `**${days.toLocaleString("en-US")} days** between ${a.toLocaleDateString("en-US", { timeZone: "UTC" })} and ${b.toLocaleDateString("en-US", { timeZone: "UTC" })}.\n\n` +
        `- Weeks: ${(days / 7).toFixed(2)}\n- Months (average): ${(days / 30.4375).toFixed(2)}\n- Years: ${(days / 365.25).toFixed(3)}`,
    };
  }

  // a date that does not exist: say it, never snap to a nearby day
  if (!dates.length && rejected.length) {
    return {
      skill: "datetime",
      terminal: true,
      confidence: 0.9,
      reasoning: "The input matched the date shape but is not a real calendar date.",
      answer: `**${rejected[0]} is not a real date.** Check the day and month and ask again.`,
    };
  }

  // days until / since a date, counted from today
  if (dates.length === 1 && /\b(how many days|days until|days left|days since|days to go|countdown)\b|\b(quantos dias|dias ate|dias desde|falta)\b/.test(t)) {
    const target = dates[0];
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const days = Math.round((target.getTime() - today.getTime()) / 86400000);
    const when = target.toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
    return {
      skill: "datetime",
      terminal: true,
      confidence: 0.97,
      reasoning: "Counted whole days from today to the target date, in UTC.",
      answer:
        days === 0
          ? `**${when} is today.**`
          : days > 0
            ? `**${days.toLocaleString("en-US")} days** until ${when}.\n\n` +
              `- Weeks: ${(days / 7).toFixed(1)}\n- Months (average): ${(days / 30.4375).toFixed(1)}`
            : `**${Math.abs(days).toLocaleString("en-US")} days** have passed since ${when}.`,
    };
  }

  // single date → weekday
  if (dates.length === 1 && /\b(what day|weekday|which day|day of the week)\b/.test(t)) {
    const d = dates[0];
    return {
      skill: "datetime",
      terminal: true,
      confidence: 0.95,
      reasoning: "Resolved the calendar date with UTC arithmetic.",
      answer: `**${d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })}, ${d.toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" })}**`,
    };
  }

  return null;
}

/* ════════════════════════════════════════════════════════════════ TEXT ══ */

export function tryTextOps(text: string): EngineResult | null {
  const t = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  /* base64 decode */
  const wantsDecode = /\b(decode|decrypt|unbase64|descodifique|decodifique|decodificar|descriptograf)/.test(t);
  const b64dec = text.match(/(?:decode|decrypt|decodif\w*|descriptograf\w*)[^:\-]*[:\-]?\s*`?([A-Za-z0-9+/=]{4,})`?/i);
  if (wantsDecode && b64dec) {
    try {
      const decoded = Buffer.from(b64dec[1], "base64").toString("utf8");
      if (decoded && /[\x20-\x7E\u00C0-\u017F]/.test(decoded)) {
        return {
          skill: "text",
          terminal: true,
          confidence: 0.95,
          reasoning: "Decoded the base64 string as UTF-8.",
          answer: `**Result:**\n\`\`\`\n${decoded}\n\`\`\``,
        };
      }
    } catch {
      /* not valid base64 */
    }
  }

  /* base64 encode */
  if (!wantsDecode && /\b(base64|encode|codifique|codificar)\b/.test(t)) {
    const afterColon = text.includes(":") ? text.slice(text.lastIndexOf(":") + 1) : "";
    const payload = (
      afterColon || text.replace(/^.*?\b(?:base64|encode|codifique|codificar)\b\s*(?:in|to|em|para)?\s*[:\-]?\s*/i, "")
    ).trim();
    if (payload.length > 1) {
      return {
        skill: "text",
        terminal: true,
        confidence: 0.9,
        reasoning: "Encoded the text as base64 (UTF-8).",
        answer: `\`${Buffer.from(payload).toString("base64")}\``,
      };
    }
  }

  /* slug */
  if (/\bslug\b/.test(t)) {
    const payload = text.replace(/^.*?\bslug\b\s*(?:of|for|from|de|da|do)?\s*[:\-]?\s*/i, "").replace(/^["'`]|["'`]$/g, "").trim();
    if (payload) {
      const slug = norm(payload).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return {
        skill: "text",
        terminal: true,
        confidence: 0.95,
        reasoning: "Lowercased, stripped accents and replaced separators.",
        answer: `\`${slug}\``,
      };
    }
  }

  /* word count */
  if (/\b(word count|count words|how many words|character count|how many characters|contar palavras|quantas palavras|contar caracteres)\b/.test(t)) {
    const body =
      text.split(/[:：]/).slice(1).join(":").trim() ||
      text.replace(/.*?\b(words?|characters?|palavras?|caracteres?)\b\s*[:\-]?\s*/i, "").trim();
    const words = body.split(/\s+/).filter(Boolean).length;
    return {
      skill: "text",
      terminal: true,
      confidence: 0.99,
      reasoning: "Split on whitespace and counted code points.",
      answer:
        `- Words: **${words.toLocaleString("en-US")}**\n` +
        `- Characters: **${[...body].length.toLocaleString("en-US")}**\n` +
        `- Lines: **${body.split("\n").length.toLocaleString("en-US")}**\n` +
        `- Reading time (~200 wpm): **${Math.max(1, Math.round(words / 200))} min**`,
    };
  }

  /* JSON validate / format */
  if (/\b(validate|format|pretty)\s*(the\s*)?json|json\s*(valid|formatted)\b|\bvalide\b.*json/i.test(text)) {
    const body = text.slice(text.indexOf("{"));
    try {
      const parsed = JSON.parse(body.slice(0, body.lastIndexOf("}") + 1));
      return {
        skill: "text",
        terminal: true,
        confidence: 0.95,
        reasoning: "Parsed with JSON.parse and re-printed with 2-space indentation.",
        answer: "Valid JSON ✅\n\n```json\n" + JSON.stringify(parsed, null, 2) + "\n```",
      };
    } catch (e) {
      return {
        skill: "text",
        terminal: true,
        confidence: 0.95,
        reasoning: "JSON.parse threw; reported the position.",
        answer: `Invalid JSON ❌\n\n\`${(e as Error).message}\``,
      };
    }
  }

  /* regex */
  if (/\b(regex|regular expression|expressao regular)\b/.test(t)) {
    return {
      skill: "text",
      terminal: true,
      confidence: 0.8,
      reasoning: "Offering a regex reference instead of guessing the pattern.",
      answer:
        "I can build the expression with you — tell me the **pattern you want to match** and **two examples** (one that should match, one that shouldn't).\n\n" +
        "Quick reference meanwhile:\n\n| Token | Meaning |\n| --- | --- |\n| `^` `$` | start / end |\n| `\\d` `\\w` `\\s` | digit, word, space |\n| `*` `+` `?` | 0+, 1+, optional |\n| `{n,m}` | repeat between n and m |\n| `(?:…)` | non-capturing group |\n| `(?=…)` | lookahead |",
    };
  }

  return null;
}

/* ══════════════════════════════════════════════════════ SUMMARIZATION ══ */

const STOP = new Set(
  (
    "a an and are as at be but by for from has have he her his i if in into is it its me my no not of on or our she so " +
    "that the their them then there these they this to was we were what when where which who will with you your " +
    "a o e de da do das dos em no na nos nas um uma uns umas para por com como que se ao aos ou mas eu voce me te " +
    "seu sua meu minha mais menos muito pode fazer qual quais onde quando porque hoje agora entao sobre entre ja ser estar ter tem foi sao"
  ).split(/\s+/),
);

export function tokenize(s: string): string[] {
  return norm(s)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.replace(/(ing|ed|es|s)$/, ""));
}

export function summarize(raw: string): EngineResult | null {
  const text = raw
    .replace(
      /^\s*(?:summari[sz]e|summary|tl;?dr|resuma|resumir|resumo|faca um resumo)\s*(?:this|the|these|este|esse|o|a|isto|isso)?\s*(?:text|document|content|texto|documento|conteudo)?\s*[:\-]?\s*/i,
      "",
    )
    .trim();
  if (text.split(/\s+/).length < 90) return null;

  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…])\s+/)
    .filter((s) => s.split(" ").length > 4);
  if (sentences.length < 4) return null;

  const df = new Map<string, number>();
  const bags = sentences.map((s) => {
    const toks = tokenize(s);
    for (const t of new Set(toks)) df.set(t, (df.get(t) || 0) + 1);
    return toks;
  });

  const scored = sentences.map((s, i) => {
    let score = 0;
    const tf = new Map<string, number>();
    for (const t of bags[i]) tf.set(t, (tf.get(t) || 0) + 1);
    for (const [t, c] of tf) score += (c / Math.max(1, bags[i].length)) * Math.log(1 + sentences.length / (df.get(t) || 1));
    if (i === 0) score *= 1.25; // lead bias
    if (/\b(therefore|conclusion|summary|result|thus)\b|\b(portanto|conclus|resumo|resultado|logo)\b/i.test(s)) score *= 1.15;
    score /= Math.sqrt(s.split(" ").length); // length penalty
    return { s, i, score };
  });

  const take = Math.max(3, Math.min(6, Math.round(sentences.length * 0.28)));
  const picked = [...scored].sort((a, b) => b.score - a.score).slice(0, take).sort((a, b) => a.i - b.i);
  const keywords = [...df.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
  const words = text.split(/\s+/).length;
  const kept = picked.reduce((a, p) => a + p.s.split(" ").length, 0);

  return {
    skill: "summarize",
    terminal: true,
    confidence: 0.9,
    reasoning:
      "Extractive summarization: tokenization, per-sentence TF-IDF, length penalty, lead bias, " +
      `then the ${take} most informative sentences in original order.`,
    answer:
      `## Summary\n\n${picked.map((p) => `- ${p.s.trim()}`).join("\n")}\n\n` +
      `**Keywords:** ${keywords.map((k) => `\`${k}\``).join(" · ")}\n\n` +
      `_Reduction: ${words} → ${kept} words (${Math.round((1 - kept / words) * 100)}%). Ran in the local core._`,
  };
}

/* ══════════════════════════════════════════════════════════ KNOWLEDGE ══ */

export function tryKnowledge(query: string, docs: KnowledgeDoc[]): EngineResult | null {
  if (!docs.length) return null;
  const q = new Set(tokenize(query));
  if (q.size < 2) return null;

  const ranked = docs
    .map((d) => {
      const titleTokens = new Set(tokenize(d.title));
      const bodyTokens = new Set(tokenize(`${d.title} ${d.content}`));
      let titleHits = 0;
      let bodyHits = 0;
      for (const t of q) {
        if (titleTokens.has(t)) titleHits++;
        else if (bodyTokens.has(t)) bodyHits++;
      }
      return { d, titleHits, bodyHits, score: (titleHits * 2 + bodyHits) / (q.size * 2) };
    })
    // a title match is a strong signal; a body-only match needs real coverage
    .filter((r) => r.titleHits >= 1 || r.bodyHits >= Math.max(3, Math.ceil(q.size * 0.5)))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!ranked.length) return null;
  const best = ranked[0];
  const paragraphs = best.d.content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const relevant = paragraphs
    .map((p) => {
      const toks = new Set(tokenize(p));
      let hits = 0;
      for (const t of q) if (toks.has(t)) hits++;
      return { p, hits };
    })
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 2)
    .map((x) => x.p);

  return {
    skill: "knowledge",
    terminal: true,
    confidence: 0.74 + best.score * 0.2,
    reasoning: `Retrieved ${ranked.length} document(s) by lexical similarity (term coverage ${(best.score * 100).toFixed(0)}%) and reordered paragraphs by relevance.`,
    answer:
      `${(relevant.length ? relevant : [best.d.content.slice(0, 700)]).join("\n\n")}\n\n` +
      `---\n**Sources (${ranked.length}):** ` +
      ranked.map((r) => `\`${r.d.title}\``).join(" · "),
  };
}

/* ═════════════════════════════════════════════════════════════ PLANNING ══ */

const PLAN_VERBS =
  /\b(plan|planning|roadmap|how do i|how to|step by step|strategy|implement|build|create a plan|planeje|plano|como faco|como fazer|passo a passo|estrategia|implemente|monte|desenvolva|construa)\b/i;

export function tryPlan(text: string): EngineResult | null {
  if (!PLAN_VERBS.test(text) || text.length > 1200) return null;
  const goal = text
    .replace(/^(plan|how do i|how to|strategy for|planeje|monte|estrategia para|como faco|como fazer|criar|construir)\s*/i, "")
    .trim();
  if (goal.length < 8) return null;

  const steps = [
    `**Define the outcome** — one sentence on what is done at the end: "${goal.slice(0, 120)}".`,
    "**Map the constraints** — deadline, budget, existing stack, who signs off, what cannot change.",
    "**Break it into deliverables** — each one must be verifiable by someone outside the project.",
    "**Order by risk** — attack first the item that would invalidate the others if it failed.",
    "**Build the smallest slice** — the thinnest version that runs end to end, even if ugly.",
    "**Instrument it** — a log, a metric and one alert before widening the audience.",
    "**Review, then expand** — only add scope once the smallest slice has proven stable.",
  ];

  return {
    skill: "plan",
    terminal: false,
    confidence: 0.7,
    reasoning: `Structured the request into seven stages (outcome → constraints → deliverables → risk → smallest slice → instrumentation → expansion).`,
    answer:
      `### Execution plan\n\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
      `**Typical risks:** scope growing without anything being cut; no definition of "done"; a single point of failure.\n\n` +
      `**Concrete next step:** tell me the stack and the deadline and I will detail the deliverables in step 3, one by one.`,
  };
}

/* ═══════════════════════════════════════════════════════════════ SOCIAL ══ */

const norm2 = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[!?.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** True when every word of one phrase appears in the other (order-insensitive). */
function covers(a: string, b: string): boolean {
  const A = new Set(norm2(a).split(" ").filter(Boolean));
  const B = new Set(norm2(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return false;
  const [small, big] = A.size <= B.size ? [A, B] : [B, A];
  return [...small].every((w) => big.has(w));
}

export function trySocial(text: string): EngineResult | null {
  const t = norm(text).replace(/[!?.,;]+/g, " ").replace(/\s+/g, " ").trim();

  const GREET =
    /^(hi+|hey+|hello+|yo|sup|howdy|good morning|good afternoon|good evening|morning|evening|hi there|hello there|how are you|how's it going|hows it going|what's up|whats up|oi+|ola+|opa|eai|e ai|bom dia|boa tarde|boa noite|salve|tudo bem|tudo bom|tudo certo|como vai|beleza|blz|suave|tranquilo)$/;

  const parts = text
    .split(/\s*[,;.!?]\s*|\s+and\s+|\s+(?=(?:how are you|how's it going|what's up)\b)/)
    .map((f) => norm(f).replace(/[!?.,;]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const isGreeting =
    t.length <= 40 &&
    (GREET.test(t) ||
      (parts.length > 1 && parts.every((f) => GREET.test(f))) ||
      parts.some((f) => GREET.test(f) && f.split(" ").length >= 2));

  if (isGreeting) {
    const hour = new Date().getHours();
    const mood = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    return {
      skill: "social",
      terminal: true,
      confidence: 0.95,
      reasoning: "Greeting recognized — short reply from the local core.",
      answer:
        `${mood}. Keew IA here — local core active.\n\n` +
        `I handle **calculations**, **unit conversions**, **dates and deadlines**, **summaries**, ` +
        `**JSON/base64/slug** and **search over the knowledge base** right away. Open-ended conversation ` +
        `needs a language engine connected.\n\n` +
        `What do you need?`,
    };
  }

  if (/^(thanks|thank you|thx|ty|appreciate|obrigad|valeu|agradec)/.test(t)) {
    return {
      skill: "social",
      terminal: true,
      confidence: 0.9,
      reasoning: "Acknowledgement.",
      answer: "Anytime. Call me when you need something.",
    };
  }

  if (
    /(what can you do|your (capabilities|skills)|available commands|help me understand you)/.test(t) ||
    (covers(t, "help") && t.split(" ").length <= 3) ||
    (covers(t, "ajuda") && t.split(" ").length <= 3)
  ) {
    return {
      skill: "social",
      terminal: true,
      confidence: 0.9,
      reasoning: "Mapped what the deterministic core resolves and what needs the language engine.",
      answer:
        "Two levels — and the first one needs no internet at all.\n\n" +
        "**Right now, with the local core only**\n\n" +
        "| Ask like this | What I do |\n| --- | --- |\n" +
        "| `(1847 * 23) / 7 + 256^0.5` | exact arithmetic with precedence |\n" +
        "| `15% of 240` | percentages |\n" +
        "| `180 lb to kg` · `30 °C to °F` | units and temperature |\n" +
        "| `what day is it` · `days between 01/01/2026 and 03/31/2026` | dates, deadlines, ISO week |\n" +
        "| paste a text and say `summarize` | extractive summary with keywords |\n" +
        "| `slug of Café com Leite` · `encode in base64: keew` · `validate this json` | text transforms |\n" +
        "| `who is Keew IA` · questions about your documents | knowledge base |\n\n" +
        "**Everything else** needs a language engine connected to the app.",
    };
  }

  if (/^(who are you|what are you|your name|what do you do|what can you do|introduce yourself|quem (e|es) voce|seu nome|o que voce e|o que voce faz|qual seu papel|apresente se)/.test(t)) {
    return {
      skill: "social",
      terminal: true,
      confidence: 0.95,
      reasoning: "Keew's identity lives in the native corpus.",
      answer:
        "I'm **Keew IA** — an artificial intelligence built and owned by Veexdevs.\n\n" +
        "| | |\n| --- | --- |\n" +
        "| Core | Keew Core — deterministic reasoning: math, dates, units, summaries, knowledge |\n" +
        "| Account | Chats, messages and your profile, saved to your own database |\n" +
        "| Interface | Web, installable to the home screen |\n\n" +
        "I'm honest about my limits: without a language engine connected I do the deterministic work " +
        "and tell you when a question is beyond it, instead of making an answer up.",
    };
  }

  return null;
}

/** Derives a list from a sentence: "list 5 ways to X". */
export function tryList(text: string): EngineResult | null {
  const m = text.match(/\b(?:list|give me|show me|cite|name|enumerate|liste|listar|cite|citar|enumere)\b\s*(?:me\s*)?(\d{1,2})?\s*(?:\w+\s+){0,3}(?:to|for|of|about|on|de|para|sobre)\s+(.{4,120})/i);
  if (!m) return null;
  const count = Math.min(parseInt(m[1] || "5", 10) || 5, 10);
  const topic = m[2].replace(/[?.!]+$/, "").trim();
  if (topic.length < 4) return null;

  const angles = [
    "foundation — the principle that holds the topic up",
    "practice — how it works day to day",
    "common mistakes — what usually goes wrong",
    "measurement — how you know it is working",
    "variation — a less obvious alternative",
    "cost — the price in time, money and attention",
    "risk — the worst realistic scenario",
    "sequence — the order that avoids rework",
    "tooling — what removes the manual effort",
    "maintenance — what has to last after launch",
  ];

  return {
    skill: "list",
    terminal: false,
    confidence: 0.55,
    reasoning: `Framed "${topic}" through ${count} angles so the answer does not repeat the same idea.`,
    answer:
      `### ${count} angles on "${topic}"\n\n` +
      angles
        .slice(0, count)
        .map((a, i) => {
          const [head, tail] = a.split(" — ");
          return `${i + 1}. **${head.charAt(0).toUpperCase() + head.slice(1)}** — ${tail}.`;
        })
        .join("\n") +
      "\n\nWant me to go deeper on one of them with concrete examples?",
  };
}

/* ═════════════════════════════════════════════════════════════ FALLBACK ══ */

export function fallback(query: string): EngineResult {
  const q = query.trim();
  const topic = q.length > 90 ? `${q.slice(0, 90)}…` : q;
  return {
    skill: "fallback",
    terminal: true,
    confidence: 1,
    reasoning: "Beyond the deterministic core, and no language engine is connected.",
    answer:
      `I can't answer that.\n\n` +
      `**"${topic}"** is an open-ended language question, and the Keew running here is deterministic: it ` +
      `does arithmetic, dates, unit conversion, text transforms and search over your documents — it does ` +
      `not write or interpret free text.\n\n` +
      `Answering anything would need a language engine connected to this app. Until then I'd rather tell ` +
      `you this than invent an answer.\n\n` +
      `**What I can do right now:**\n\n` +
      `| Ask | Example |\n| --- | --- |\n` +
      `| math and percentages | \`calculate 15% of 240\` |\n` +
      `| unit conversion | \`180 lb to kg\` |\n` +
      `| dates and deadlines | \`how many days until 12/25/2026\` |\n` +
      `| text | \`slug of Café com Leite\` · \`summarize: <text>\` |\n` +
      `| your documents | ask about anything in Keew's knowledge base |`,
  };
}

/* ══════════════════════════════════════════════════════════ ENTRYPOINT ══ */

export function reason(query: string, docs: KnowledgeDoc[] = [], now = new Date()): EngineResult {
  const chain = [trySocial, tryMath, tryConversion, tryDateTime, tryTextOps, tryList, tryPlan];
  for (const fn of chain) {
    const r = fn(query, now as never);
    if (r && r.confidence >= 0.8) return r;
  }
  const knowledge = tryKnowledge(query, docs);
  if (knowledge) return knowledge;
  const summary = summarize(query);
  if (summary) return summary;
  for (const fn of chain) {
    const r = fn(query, now as never);
    if (r) return r;
  }
  return fallback(query);
}
