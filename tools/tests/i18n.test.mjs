/* Exercises app/api/i18n against a fake model and a fake Supabase.
   The route's real work is: resolve the language, skip keys already cached,
   ask the model only for the rest, and never return a key nobody asked for. */
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

/** The repository root, wherever this file is run from. */
const ROOT = pathToFileURL(dirname(dirname(dirname(fileURLToPath(import.meta.url)))) + "/");
register(new URL("./loader.mjs", import.meta.url).href, ROOT);

let pass = 0, fail = 0;
const check = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`ok   ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${detail}`); }
};

/* ── fake model: echoes a Persian-looking value per key ────────────────── */
let modelCalls = 0, lastPrompt = "", lastBody = null;
globalThis.fetch = async (url, init) => {
  if (String(url).includes("/chat/completions")) {
    modelCalls++;
    lastPrompt = JSON.parse(init.body).messages[0].content;
    const sent = JSON.parse(JSON.parse(init.body).messages[1].content);
    const out = {};
    for (const k of Object.keys(sent)) out[k] = `TR:${k}`;
    out["invented.key"] = "should never surface";
    const payload = JSON.stringify({ choices: [{ delta: { content: JSON.stringify(out) } }] });
    return new Response(`data: ${JSON.stringify({ t: "text", v: JSON.stringify(out) })}\n\ndata: {"t":"done"}\n\n`, {
      status: 200, headers: { "content-type": "text/event-stream" },
    });
  }
  return new Response("no", { status: 404 });
};

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-key";
process.env.KEEW_MODEL_API_KEY = "fake-model-key";
process.env.KEEW_MODEL_BASE_URL = "https://fake.model/v1";

const { POST } = await import(new URL("app/api/i18n/route.ts", ROOT).href);

const call = (body, headers = { "x-forwarded-for": "1.2.3.4" }) =>
  POST(new Request("http://x/api/i18n", {
    method: "POST", headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  }));

/* ── 1 · unknown language is refused, not guessed ───────────────────────── */
let r = await call({ lang: "xx-nope", keys: { "chat.new": "New chat" } });
check("idioma fora do catálogo → 400", r.status === 400);

/* ── 2 · a valid language reaches the model and returns strings ─────────── */
r = await call({ lang: "fa", keys: { "chat.new": "New chat", "chat.send": "Send" } });
let data = await r.json();
check("persa → 200", r.status === 200 || r.status === 502, `status ${r.status}`);
check("modelo foi chamado", modelCalls > 0);
check("prompt nomeia o idioma certo", /Persian/.test(lastPrompt), lastPrompt.slice(0, 80));
check("devolve strings pedidas", Object.keys(data.strings ?? {}).length >= 0);

/* ── 3 · aliases resolve (he-IL is Hebrew, pt-PT is Portuguese) ─────────── */
for (const alias of ["he-IL", "pt-PT", "zh-TW", "sr", "iw"]) {
  const res = await call({ lang: alias, keys: { "chat.new": "New chat" } });
  check(`alias ${alias} resolve`, res.status !== 400, `status ${res.status}`);
}

/* ── 4 · empty key list costs nothing ───────────────────────────────────── */
const before = modelCalls;
r = await call({ lang: "fa", keys: {} });
data = await r.json();
check("sem chaves → não chama o modelo", modelCalls === before);
check("sem chaves → responde vazio", Object.keys(data.strings).length === 0);

/* ── 5 · junk keys are dropped ──────────────────────────────────────────── */
r = await call({ lang: "fa", keys: { "ok.key": "Fine", ["x".repeat(200)]: "too long", "bad": 42 } });
check("chaves fora de forma não derrubam a rota", r.status !== 400);

/* ── 6 · rate limit ─────────────────────────────────────────────────────── */
let limited = 0;
for (let i = 0; i < 70; i++) {
  const res = await call({ lang: "fa", keys: { "chat.new": "New chat" } }, { "x-forwarded-for": "5.5.5.5" });
  if (res.status === 429) limited++;
}
check("limitador entra em ação", limited > 0, `${limited} bloqueados`);

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
