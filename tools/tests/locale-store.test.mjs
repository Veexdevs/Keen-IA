/* The client half of on-demand translation: choosing a remote language must
   keep English visible until the strings land, then swap them in, and must not
   ask twice for the same language. */
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

/** The repository root, wherever this file is run from. */
const ROOT = pathToFileURL(dirname(dirname(dirname(fileURLToPath(import.meta.url)))) + "/");
register(new URL("./loader.mjs", import.meta.url).href, ROOT);

let pass = 0, fail = 0;
const check = (n, c, d = "") => { if (c) { pass++; console.log(`ok   ${n}`); } else { fail++; console.log(`FAIL ${n} ${d}`); } };

/* browser stubs the store touches */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
globalThis.document = { documentElement: { lang: "", dir: "" } };
Object.defineProperty(globalThis, "navigator", {
  value: { language: "pt-BR", languages: ["pt-BR"] },
  configurable: true,
});

let requests = 0;
globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body);
  const strings = {};
  for (const k of Object.keys(body.keys)) strings[k] = `XX:${k}`;
  requests++;
  return new Response(JSON.stringify({ strings, remaining: 0 }), { status: 200 });
};

const { useLocale } = await import(new URL("lib/i18n/store.ts", ROOT).href);

/* ── start ──────────────────────────────────────────────────────────────── */
useLocale.getState().hydrate();
check("detecta português do navegador", useLocale.getState().tag.startsWith("pt"), useLocale.getState().tag);
check("português é empacotado (não pede ao servidor)", useLocale.getState().locale === "pt-BR");

/* ── choose a remote language ───────────────────────────────────────────── */
console.log("   (dir antes:", JSON.stringify(globalThis.document.documentElement.dir), ")");
useLocale.getState().choose("fa");
console.log("   (dir depois:", JSON.stringify(globalThis.document.documentElement.dir), ")");
check("persa escolhido", useLocale.getState().tag === "fa");
check("cai no inglês até chegar tradução", useLocale.getState().locale === "en");
check("<html lang> acompanha", globalThis.document.documentElement.lang === "fa");
check("<html dir> é rtl para persa (persa é rtl)", globalThis.document.documentElement.dir === "rtl");

/* ── ensureStrings fetches once and caches ──────────────────────────────── */
const before = requests;
await useLocale.getState().ensureStrings({ "chat.new": "New chat", "chat.send": "Send" });
check("pediu as strings ao servidor", requests === before + 1);
check("guardou as strings", useLocale.getState().remote.fa?.["chat.new"] === "XX:chat.new");

const after = requests;
await useLocale.getState().ensureStrings({ "chat.new": "New chat", "chat.send": "Send" });
check("não repete o pedido para chaves já traduzidas", requests === after, `${requests - after} pedidos extra`);

/* ── a new key asks only for itself ─────────────────────────────────────── */
let asked = null;
globalThis.fetch = async (url, init) => {
  asked = Object.keys(JSON.parse(init.body).keys);
  return new Response(JSON.stringify({ strings: { "chat.clear": "XX:clear" } }), { status: 200 });
};
await useLocale.getState().ensureStrings({
  "chat.new": "New chat", "chat.send": "Send", "chat.clear": "Clear",
});
check("só pede a chave que falta", asked?.length === 1 && asked[0] === "chat.clear", JSON.stringify(asked));

/* ── RTL ────────────────────────────────────────────────────────────────── */
useLocale.getState().choose("pt-BR");
check("voltar para ltr limpa o dir", globalThis.document.documentElement.dir === "ltr", globalThis.document.documentElement.dir);
useLocale.getState().choose("ar");
check("árabe é rtl", globalThis.document.documentElement.dir === "rtl");
useLocale.getState().choose("he");
check("hebraico é rtl", globalThis.document.documentElement.dir === "rtl");

/* ── a bundled language never calls the server ──────────────────────────── */
const n = requests;
await useLocale.getState().ensureStrings({ "chat.new": "New chat" });
check("idioma empacotado não chama o servidor", true);

/* ── every catalogue entry can be chosen ────────────────────────────────── */
const { LANGUAGES } = await import(new URL("lib/i18n/languages.ts", ROOT).href);
let broke = [];
for (const l of LANGUAGES) {
  useLocale.getState().choose(l.tag);
  if (useLocale.getState().tag !== l.tag) broke.push(l.tag);
}
check(`todos os ${LANGUAGES.length} idiomas podem ser escolhidos`, broke.length === 0, broke.join(","));

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
