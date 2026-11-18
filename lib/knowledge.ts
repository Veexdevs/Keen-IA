/**
 * Keew IA — retrieval layer (RAG) without external infrastructure.
 *
 * Hybrid lexical search: BM25-ish scoring over the user's knowledge documents
 * plus the built-in Keew corpus. Pure TypeScript, edge-runtime safe, and
 * deterministic — a passed-in document set always yields the same context,
 * which keeps answers grounded and testable.
 */

import type { KnowledgeDoc } from "./types";

export type IndexedDoc = KnowledgeDoc & { score?: number; excerpt?: string };

const STOPWORDS = new Set(
  ("a o e é de da do das dos em no na nos nas um uma uns umas para por com como que se ao aos "
    + "à às ou mas and or the of to in on with for is are be it this that eu você voce me te "
    + "seu sua meu minha mais menos muito muito pode fazer qual quais onde quando porque porquê "
    + "hoje agora então entao sobre entre já ja ser estar ter tem foi são sao").split(/\s+/),
);

export function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    .map(stem);
}

/** Very light Portuguese/English stemmer — enough for recall, cheap to run. */
function stem(word: string): string {
  for (const suffix of ["amento", "imento", "ações", "acoes", "mente", "ções", "coes", "ando", "endo", "indo", "aram", "eram", "iram", "ou", "ar", "er", "ir", "es", "s"]) {
    if (word.length > suffix.length + 3 && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

type Entry = { id: string; title: string; tokens: string[]; tf: Map<string, number>; len: number; doc: KnowledgeDoc };

export type SearchIndex = {
  entries: Entry[];
  df: Map<string, number>;
  avgLen: number;
};

export function buildIndex(docs: KnowledgeDoc[]): SearchIndex {
  const entries: Entry[] = docs.map((doc) => {
    const tokens = tokenize(`${doc.title} ${doc.title} ${doc.content}`);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    return { id: doc.id, title: doc.title, tokens, tf, len: tokens.length || 1, doc };
  });
  const df = new Map<string, number>();
  for (const e of entries) for (const t of e.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const avgLen = entries.reduce((s, e) => s + e.len, 0) / Math.max(entries.length, 1);
  return { entries, df, avgLen };
}

export function search(index: SearchIndex, query: string, k = 4, minScore = 0.6): IndexedDoc[] {
  const q = tokenize(query);
  if (!q.length || !index.entries.length) return [];
  const N = index.entries.length;
  const scored = index.entries.map((e) => {
    let score = 0;
    for (const term of q) {
      const tf = e.tf.get(term);
      if (!tf) continue;
      const df = index.df.get(term) || 0;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const k1 = 1.4;
      const b = 0.75;
      const norm = 1 - b + (b * e.len) / (index.avgLen || 1);
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * norm));
      if (e.title.toLowerCase().includes(term)) score += 0.8;
    }
    return { ...e.doc, score };
  });
  return scored
    .filter((d) => (d.score || 0) >= minScore)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, k)
    .map((d) => ({ ...d, excerpt: excerptFor(d.content, q) }));
}

/** Pull the most query-relevant window of a document. */
export function excerptFor(content: string, queryTokens: string[], size = 900): string {
  const clean = content.replace(/\s+/g, " ").trim();
  if (clean.length <= size) return clean;
  const lower = clean.toLowerCase();
  let best = 0;
  let bestHits = -1;
  const step = 220;
  for (let i = 0; i < clean.length - size * 0.6; i += step) {
    const window = lower.slice(i, i + size);
    let hits = 0;
    for (const t of queryTokens) if (window.includes(t)) hits++;
    if (hits > bestHits) { bestHits = hits; best = i; }
  }
  const start = Math.max(0, best - 80);
  return (start > 0 ? "… " : "") + clean.slice(start, start + size) + " …";
}

/** Render retrieved documents into a compact, model-friendly context block. */
export function toContext(docs: IndexedDoc[], maxChars = 6000): string {
  if (!docs.length) return "";
  let out = "";
  for (const d of docs) {
    const block = `\n\n### ${d.title}\n${(d.excerpt || d.content).slice(0, 2200)}`;
    if (out.length + block.length > maxChars) break;
    out += block;
  }
  return out.trim();
}

/* ─────────────────────────────────────────────────── built-in Keew corpus */

export const KEEW_CORPUS: KnowledgeDoc[] = [
  {
    id: "keew-identity",
    title: "What Keew IA is",
    content:
      "Keew IA is an artificial intelligence built and owned by Veexdevs. It runs on its own infrastructure, in the " +
      "browser and as an installable app. It works in two integrated layers: the Keew Core, deterministic, which " +
      "resolves mathematics, dates, unit conversions, text transforms and knowledge retrieval without depending on " +
      "the network; and the Keew Reason, the deeper reasoning that carries open conversation, code and analysis when " +
      "an engine is connected. The mark is a broken triple arc in blue #0048F8. Keew is objective, technical and " +
      "direct: no filler, code that actually runs, verifiable steps. The interface is in English.",
    createdAt: 0,
    updatedAt: 0,
    tags: ["identity", "brand"],
  },
  {
    id: "keew-architecture",
    title: "How the Keew IA platform is built",
    content:
      "The platform has four layers. 1) Client: Next.js 15 with the App Router and React 19, running in the browser " +
      "and installable to the home screen as a PWA. 2) Engine: a single endpoint, /api/chat, streams answers over SSE " +
      "and routes automatically between the deterministic core and the language engine. 3) Storage: Supabase " +
      "(Postgres) holds accounts, chats and messages, protected by row level security so one account can never read " +
      "another's data. Without an account, chats stay in that browser only. 4) Identity: email and password, or Google " +
      "sign-in, handled by Supabase Auth.",
    createdAt: 0,
    updatedAt: 0,
    tags: ["architecture", "engineering"],
  },
  {
    id: "keew-code-style",
    title: "Keew code standard",
    content:
      "When writing code, Keew follows: strict TypeScript, small named functions, no unnecessary dependencies, " +
      "explicit error handling, accessibility (aria attributes, visible focus), mobile-first responsiveness, and " +
      "comments only where the why is not obvious. In Python: type hints, pathlib, no globals. It always delivers the " +
      "complete file when the result is going to be pasted, and explains the diff when editing something that exists.",
    createdAt: 0,
    updatedAt: 0,
    tags: ["code"],
  },
  {
    id: "keew-privacy",
    title: "Privacy and your data",
    content:
      "Your account, your chats and your messages live in the Keew database, in rows that only your account can read. " +
      "Deleting a chat deletes its messages. When no account is signed in, chats are stored only in that browser and " +
      "never leave the device. Nothing is sent to a third party beyond what the answer needs. Secrets stay in server " +
      "environment variables, never in logs and never in the browser bundle.",
    createdAt: 0,
    updatedAt: 0,
    tags: ["privacy", "data"],
  },
  {
    id: "keew-limits",
    title: "What Keew can and cannot do",
    content:
      "Keew answers with certainty on: arithmetic and percentages, unit and temperature conversion, dates, deadlines " +
      "and weekdays, extractive summaries of long texts, text transforms (slug, base64, JSON validation, word counts) " +
      "and questions about what is written in its knowledge base. Open-ended writing, free-form analysis and topics " +
      "outside that set need a language engine connected to the app. When it has none, Keew says so instead of " +
      "inventing an answer. This limit is deliberate: an honest refusal is worth more than a confident guess.",
    createdAt: 0,
    updatedAt: 0,
    tags: ["limits", "honesty"],
  },
];
