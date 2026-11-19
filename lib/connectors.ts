"use client";

/**
 * Connectors.
 *
 * Every entry here is either (a) a public API with no key at all, which
 * therefore works with nothing from you, or (b) an API where you paste a token
 * that you generate yourself — never a flow that needs me to register an app
 * on your behalf.
 *
 * Nothing is marked connected until a real request against the real API
 * succeeds. A connector that says "Connected" has proven it, right there,
 * with your key.
 *
 * Where the call happens:
 *   - github      direct from the browser (the API sends CORS `*`)
 *   - vercel      through /api/connectors/vercel, because Vercel sends no CORS
 *   - others      direct from the browser
 * The key always travels in that one request and is never stored on a server.
 */

import { getSecret, putSecret, dropSecret } from "./secure";
import { supabaseBrowser } from "./supabase/client";

export type ConnectorId = "weather" | "currency" | "wikipedia" | "hn" | "github" | "vercel" | "supabase";

export type Field = {
  key: string;
  label: string;
  placeholder: string;
  hint?: string;
  /** where to create this value — opened in a new tab */
  link?: { label: string; href: string };
  secret?: boolean;
};

export type Connector = {
  id: ConnectorId;
  name: string;
  blurb: string;
  /** what Keew can actually do once this is on */
  does: string[];
  /** no key: works as soon as it is switched on */
  keyless?: boolean;
  fields: Field[];
  category: "Data" | "Code" | "Infrastructure";
};

export const CONNECTORS: Connector[] = [
  {
    id: "weather",
    name: "Weather",
    blurb: "Live conditions anywhere on Earth.",
    does: ["Current temperature, humidity and wind for any city", "Answers weather questions in chat"],
    keyless: true,
    fields: [],
    category: "Data",
  },
  {
    id: "currency",
    name: "Exchange rates",
    blurb: "Daily reference rates from the European Central Bank.",
    does: ["Convert between 30+ currencies", "Historical rate lookups"],
    keyless: true,
    fields: [],
    category: "Data",
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    blurb: "Encyclopedia summaries, in the language you ask in.",
    does: ["Define a topic with a sourced summary", "Answer who/what/where questions with a citation"],
    keyless: true,
    fields: [],
    category: "Data",
  },
  {
    id: "hn",
    name: "Hacker News",
    blurb: "What developers are reading right now.",
    does: ["Top stories of the moment", "Search by topic"],
    keyless: true,
    fields: [],
    category: "Data",
  },
  {
    id: "github",
    name: "GitHub",
    blurb: "Your repositories, issues and activity.",
    does: ["List your repositories and their state", "Open issues and pull requests", "Read a file from a repo"],
    fields: [
      {
        key: "token",
        label: "Personal access token",
        placeholder: "ghp_… or github_pat_…",
        secret: true,
        hint: "A fine-grained token with read-only access to the repositories you want Keew to see. Never share it anywhere else.",
        link: { label: "Create a token", href: "https://github.com/settings/tokens" },
      },
    ],
    category: "Code",
  },
  {
    id: "vercel",
    name: "Vercel",
    blurb: "Projects and production deploys.",
    does: ["List your projects and frameworks", "Recent deploys with state and commit"],
    fields: [
      {
        key: "token",
        label: "Access token",
        placeholder: "vercel token",
        secret: true,
        hint: "Read-only is enough. This call goes through Keew's server because Vercel does not allow direct browser calls.",
        link: { label: "Create a token", href: "https://vercel.com/account/tokens" },
      },
    ],
    category: "Infrastructure",
  },
  {
    id: "supabase",
    name: "Supabase",
    blurb: "Projects, tables and row counts.",
    does: ["List your projects", "Table names and row counts of the account database"],
    fields: [
      {
        key: "url",
        label: "Project URL",
        placeholder: "https://xyzcompany.supabase.co",
        hint: "Project Settings → API.",
      },
      {
        key: "key",
        label: "Service role key",
        placeholder: "service_role key",
        secret: true,
        hint: "Needed because row level security hides tables from a normal key. It is powerful: only use it on a machine you trust.",
      },
    ],
    category: "Infrastructure",
  },
];

export type ConnectorState = {
  on: boolean;
  /** which fields hold a value, never the values themselves */
  filled: Record<string, boolean>;
  /** last successful check */
  checkedAt?: number;
  label?: string;
};

const LS_KEY = "keew-ia-connectors-v1";

function loadStates(): Record<string, ConnectorState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ConnectorState>) : {};
  } catch {
    return {};
  }
}

export function saveStates(states: Record<string, ConnectorState>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(states));
  } catch {
    /* ignore */
  }
}

export function loadConnectorStates(): Record<string, ConnectorState> {
  return loadStates();
}

/* ── vault bridge ──────────────────────────────────────────────────────── */

export const vaultId = (id: ConnectorId, field: string) => `keew:${id}:${field}`;
export const vaultOwner = (email?: string | null) => email || "guest";

export async function saveField(id: ConnectorId, field: string, value: string, owner: string) {
  await putSecret(owner, vaultId(id, field), value);
}

export async function readField(id: ConnectorId, field: string, owner: string) {
  return getSecret(owner, vaultId(id, field));
}

export async function forgetConnector(id: ConnectorId, fields: string[]) {
  await Promise.all(fields.map((f) => dropSecret(vaultId(id, f))));
}

/* ── the checks: every one is a real request ───────────────────────────── */

export type CheckResult = { ok: boolean; message: string };

const timeout = (ms = 12_000) => AbortSignal.timeout(ms);

export async function checkConnector(
  id: ConnectorId,
  values: Record<string, string>,
): Promise<CheckResult> {
  try {
    switch (id) {
      case "weather": {
        const r = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&current=temperature_2m",
          { signal: timeout() },
        );
        if (!r.ok) return { ok: false, message: "Weather service did not answer." };
        const d = await r.json();
        return { ok: true, message: `Live — São Paulo is ${d.current?.temperature_2m}°C right now.` };
      }

      case "currency": {
        const r = await fetch("https://api.frankfurter.app/latest?from=USD&to=BRL", { signal: timeout() });
        if (!r.ok) return { ok: false, message: "Exchange service did not answer." };
        const d = await r.json();
        return { ok: true, message: `Live — 1 USD = ${d.rates?.BRL} BRL today.` };
      }

      case "wikipedia": {
        const r = await fetch(
          "https://en.wikipedia.org/api/rest_v1/page/summary/PostgreSQL",
          { signal: timeout() },
        );
        if (!r.ok) return { ok: false, message: "Wikipedia did not answer." };
        const d = await r.json();
        return { ok: true, message: `Live — "PostgreSQL" resolves to a ${d.extract?.length ?? 0} character summary.` };
      }

      case "hn": {
        const r = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", { signal: timeout() });
        if (!r.ok) return { ok: false, message: "Hacker News did not answer." };
        const ids: number[] = await r.json();
        return { ok: true, message: `Live — ${ids.length} stories on the front page.` };
      }

      case "github": {
        const token = values.token?.trim();
        if (!token) return { ok: false, message: "Paste a token first." };
        const r = await fetch("https://api.github.com/user", {
          headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
          signal: timeout(),
        });
        if (r.status === 401) return { ok: false, message: "GitHub rejected that token." };
        if (!r.ok) return { ok: false, message: `GitHub answered ${r.status}.` };
        const u = await r.json();
        return { ok: true, message: `Connected as @${u.login}.` };
      }

      case "vercel": {
        const token = values.token?.trim();
        if (!token) return { ok: false, message: "Paste a token first." };
        const r = await fetch("/api/connectors/vercel", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
          signal: timeout(),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) return { ok: false, message: d?.error ?? `Vercel answered ${r.status}.` };
        return { ok: true, message: `Connected — ${d.projects} project${d.projects === 1 ? "" : "s"} visible.` };
      }

      case "supabase": {
        const url = values.url?.trim().replace(/\/$/, "");
        const key = values.key?.trim();
        if (!url || !key) return { ok: false, message: "Both the URL and the key are needed." };
        if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
          return { ok: false, message: "That does not look like a Supabase project URL." };
        }
        const r = await fetch(`${url}/rest/v1/chats?select=id&limit=1`, {
          headers: { apikey: key, authorization: `Bearer ${key}` },
          signal: timeout(),
        });
        if (r.status === 401 || r.status === 403) return { ok: false, message: "The key was refused." };
        if (r.status === 404) return { ok: false, message: "Reachable, but the chats table does not exist yet — run supabase/schema.sql first." };
        if (!r.ok) return { ok: false, message: `Supabase answered ${r.status}.` };
        return { ok: true, message: "Connected — the chats table is reachable." };
      }
    }
  } catch (err) {
    const name = (err as Error).name;
    if (name === "TimeoutError") return { ok: false, message: "The request timed out." };
    return { ok: false, message: "Could not reach the service from this browser." };
  }
}

/* ── helpers used by the chat route when a connector is on ─────────────── */

export type ConnectorAnswer = { answer: string; live: boolean; source?: string };

/**
 * Tries to answer a question with live data, before the local core.
 * Returns null when no connector covers the question — the core still runs.
 */
export async function answerWithConnector(
  text: string,
  states: Record<string, ConnectorState>,
): Promise<ConnectorAnswer | null> {
  const on = (id: ConnectorId) => states[id]?.on;
  const t = text.toLowerCase();
  const owner = vaultOwner(supabaseBrowser()?.auth ? undefined : undefined);

  /* weather */
  if (on("weather")) {
    const m = text.match(
      /\b(weather|temperature|forecast|how (hot|cold) is it)\b/i,
    );
    if (m) {
      const place = text.match(/\b(?:in|at|for)\s+([A-Za-zÀ-ÿ\s'-]{2,40})[\?\!\.]?$/i)?.[1]?.trim();
      const geo = await geocode(place || "São Paulo");
      if (!geo) {
        return { answer: `I could not find a place called **${place}**. Try just the city name.`, live: true };
      }
      const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}` +
          "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto",
        { signal: timeout() },
      );
      if (!r.ok) return null;
      const d = await r.json();
      const c = d.current;
      return {
        live: true,
        source: "Open-Meteo",
        answer:
          `**${geo.name}** — ${weatherWord(c.weather_code)}, **${c.temperature_2m}°C**\n\n` +
          `- Feels like: ${c.apparent_temperature}°C\n` +
          `- Humidity: ${c.relative_humidity_2m}%\n` +
          `- Wind: ${c.wind_speed_10m} km/h\n\n` +
          `> Live from Open-Meteo through your Weather connector.`,
      };
    }
  }

  /* currency */
  if (on("currency")) {
    const m = text.match(/\b([A-Z]{3})\b.*\b(?:to|in|em|para)\b\s*\b([A-Z]{3})\b/) ||
      text.match(/\b(?:convert|converter)\s+(\d+(?:[.,]\d+)?)\s*([A-Z]{3})\s*(?:to|in|em|para)\s*([A-Z]{3})/i);
    const codeFrom = (m?.[1] ?? "").toUpperCase();
    const codeTo = (m?.[2] ?? "").toUpperCase();
    if (/^[A-Z]{3}$/.test(codeFrom) && /^[A-Z]{3}$/.test(codeTo) && codeFrom !== codeTo) {
      const amount = parseFloat((text.match(/(\d+(?:[.,]\d+)?)/)?.[1] ?? "1").replace(",", "."));
      const r = await fetch(`https://api.frankfurter.app/latest?from=${codeFrom}&to=${codeTo}`, {
        signal: timeout(),
      });
      if (!r.ok) return null;
      const d = await r.json();
      const rate = d.rates?.[codeTo];
      if (!rate) return null;
      return {
        live: true,
        source: "Frankfurter",
        answer:
          `**${amount.toLocaleString("en-US")} ${codeFrom} = ${(amount * rate).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${codeTo}**\n\n` +
          `- Rate: 1 ${codeFrom} = ${rate} ${codeTo}\n- Date: ${d.date}\n\n` +
          `> Live from the ECB reference rates through your Exchange rates connector.`,
      };
    }
  }

  /* wikipedia */
  if (on("wikipedia") && /\b(who|what|where|when) (is|are|was|were)\b|\btell me about\b|\bdefine\b/i.test(t)) {
    const topic = text
      .replace(/^.*?\b(?:who|what|where|when) (?:is|are|was|were)\b\s*/i, "")
      .replace(/^.*?\btell me about\b\s*/i, "")
      .replace(/^.*?\bdefine\b\s*/i, "")
      .replace(/[?!.]/g, "")
      .trim();
    if (topic.length >= 2 && topic.length <= 60) {
      const lang = /\b(quem|qual|o que)\b/i.test(text) ? "pt" : "en";
      const r = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
        { signal: timeout() },
      );
      if (r.ok) {
        const d = await r.json();
        if (d.extract) {
          return {
            live: true,
            source: "Wikipedia",
            answer:
              `## ${d.title}\n\n${d.extract}\n\n` +
              (d.content_urls?.desktop?.page ? `[Read the full article](${d.content_urls.desktop.page})` : ""),
          };
        }
      }
    }
  }

  /* hacker news */
  if (on("hn") && /\b(top|trending|stories|news|hacker news)\b/i.test(t)) {
    const r = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", { signal: timeout() });
    if (r.ok) {
      const ids: number[] = await r.json();
      const first = await Promise.all(
        ids.slice(0, 6).map((id) =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: timeout() })
            .then((x) => x.json())
            .catch(() => null),
        ),
      );
      const rows = first
        .filter(Boolean)
        .map((s, i) => `${i + 1}. [${s.title}](${s.url || `https://news.ycombinator.com/item?id=${s.id}`}) — ${s.score} points`);
      return {
        live: true,
        source: "Hacker News",
        answer: `### Top stories right now\n\n${rows.join("\n")}\n\n> Live from Hacker News through your connector.`,
      };
    }
  }

  return null;
}

/* ── small helpers ─────────────────────────────────────────────────────── */

async function geocode(name: string): Promise<{ name: string; lat: number; lon: number } | null> {
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`,
      { signal: timeout() },
    );
    if (!r.ok) return null;
    const d = await r.json();
    const hit = d.results?.[0];
    if (!hit) return null;
    return { name: `${hit.name}${hit.country ? `, ${hit.country}` : ""}`, lat: hit.latitude, lon: hit.longitude };
  } catch {
    return null;
  }
}

function weatherWord(code: number): string {
  const map: Record<number, string> = {
    0: "clear sky",
    1: "mostly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "fog",
    48: "freezing fog",
    51: "light drizzle",
    53: "drizzle",
    55: "heavy drizzle",
    61: "light rain",
    63: "rain",
    65: "heavy rain",
    66: "freezing rain",
    71: "light snow",
    73: "snow",
    75: "heavy snow",
    80: "rain showers",
    81: "rain showers",
    82: "violent rain showers",
    95: "a thunderstorm",
    96: "a thunderstorm with hail",
    99: "a severe thunderstorm with hail",
  };
  return map[code] ?? "mixed conditions";
}

export const ownerFromEmail = (email?: string | null) => vaultOwner(email);
