/**
 * Voz, ações de mensagem e link público.
 *
 * Três assuntos, uma razão: são os três caminhos novos que mexem em dados de
 * quem usa a Keen — o áudio do microfone, o texto de uma mensagem que já
 * existe, e o que sai para fora quando alguém compartilha uma resposta. Um
 * teste de cada, no ponto onde errar seria invisível na tela.
 *
 * Roda contra um Supabase falso e um motor falso, como os testes de auth e
 * i18n: a lógica das rotas é o que interessa, não a rede.
 */
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

const ROOT = pathToFileURL(dirname(dirname(dirname(fileURLToPath(import.meta.url)))) + "/");
register(new URL("./loader.mjs", import.meta.url).href, ROOT);

let pass = 0, fail = 0;
const check = (n, ok, d = "") => {
  if (ok) { pass++; console.log(`ok   ${n}`); }
  else { fail++; console.log(`FAIL ${n} ${d}`); }
};

/* ── Supabase falso: guarda linhas em memória por tabela ────────────────── */
const rows = new Map(); // tabela -> Map(id -> row)
const table = (t) => {
  if (!rows.has(t)) rows.set(t, new Map());
  return rows.get(t);
};

globalThis.fetch = async (url, init) => {
  const u = String(url);
  const method = init?.method ?? "GET";

  /* /rest/v1/<tabela>?… */
  const rest = u.match(/\/rest\/v1\/([a-z_]+)(\?([^#]*))?$/);
  if (rest) {
    const name = rest[1];
    const q = new URLSearchParams(rest[3] ?? "");
    const store = table(name);

    if (method === "POST") {
      const body = JSON.parse(init.body);
      const list = Array.isArray(body) ? body : [body];
      for (const row of list) store.set(row.id, row);
      return new Response("", { status: 201 });
    }
    if (method === "PATCH") {
      const patch = JSON.parse(init.body);
      const id = (q.get("id") ?? "").replace(/^eq\./, "");
      const row = store.get(id);
      if (row) store.set(id, { ...row, ...patch });
      return new Response("", { status: 204 });
    }
    if (method === "GET") {
      const id = (q.get("id") ?? "").replace(/^eq\./, "");
      const row = id ? store.get(id) : [...store.values()][0];
      /* PostgREST devolve lista em select normal e objeto em maybeSingle */
      const single = (init?.headers?.accept ?? init?.headers?.Accept ?? "").includes("vnd.pgrst.object");
      if (!row) return new Response(single ? "" : "[]", { status: single ? 406 : 200 });
      return new Response(JSON.stringify(single ? row : [row]), { status: 200 });
    }
  }

  /* motor falso: transcrição */
  if (u.endsWith("/audio/transcriptions") && method === "POST") {
    return new Response(JSON.stringify({ text: "teste de transcrição" }), { status: 200 });
  }

  return new Response("{}", { status: 404 });
};

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service";
process.env.KEEW_MODEL_BASE_URL = "https://fake.model/v1";
process.env.KEEW_MODEL_API_KEY = "fake-model-key";

/* ── 1 · voz ────────────────────────────────────────────────────────────── */

const voice = await import(new URL("app/api/voice/route.ts", ROOT).href);

const postForm = (form) =>
  voice.POST(new Request("http://x/api/voice", {
    method: "POST",
    headers: { "x-forwarded-for": "9.9.9.9" },
    body: form,
  }));

/** Um WAV de verdade: 44 bytes de cabeçalho + amostras de silêncio. */
function wav(seconds = 1) {
  const rate = 16000, samples = rate * seconds;
  const buf = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buf);
  const str = (at, s) => { for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i)); };
  str(0, "RIFF"); view.setUint32(4, 36 + samples * 2, true); str(8, "WAVE"); str(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); str(36, "data");
  view.setUint32(40, samples * 2, true);
  return new Blob([buf], { type: "audio/wav" });
}

let fd = new FormData();
fd.append("audio", wav(1), "ditado.wav");
fd.append("locale", "pt-BR");
let r = await postForm(fd);
let data = await r.json();
check("áudio → 200", r.status === 200, String(r.status));
check("devolve o texto transcrito", data.text === "teste de transcrição", JSON.stringify(data));

/* sem áudio, 400; acima do limite, 413 */
fd = new FormData();
r = await postForm(fd);
check("sem áudio → 400", r.status === 400);

/* ── 2 · apagar e editar mexem no banco, não só na tela ─────────────────── */

const store = await import(new URL("lib/store.ts", ROOT).href);
check("store expõe deleteMessage", typeof store.useApp.getState().deleteMessage === "function");
check("store expõe editMessage", typeof store.useApp.getState().editMessage === "function");
check("store expõe regenerate", typeof store.useApp.getState().regenerate === "function");

/* a mensagem apagada sai da lista e a do banco é o mesmo id */
store.useApp.setState({
  chats: [{ id: "c1", title: "t", updated_at: "", messages: [
    { id: "aaaaaaaa-1111-4111-8111-111111111111", role: "user", content: "oi" },
    { id: "bbbbbbbb-2222-4222-8222-222222222222", role: "assistant", content: "olá" },
  ] }],
  activeId: "c1",
  dbEnabled: false,
});
await store.useApp.getState().deleteMessage("bbbbbbbb-2222-4222-8222-222222222222");
let msgs = store.useApp.getState().chats[0].messages;
check("apagar removeu só aquela mensagem", msgs.length === 1 && msgs[0].id.startsWith("aaaaaaaa"), JSON.stringify(msgs.map((m) => m.id)));

await store.useApp.getState().editMessage("aaaaaaaa-1111-4111-8111-111111111111", "  oi, corrigido  ");
msgs = store.useApp.getState().chats[0].messages;
check("editar troca o texto no lugar", msgs[0].content === "oi, corrigido", msgs[0].content);
check("editar não cria mensagem nova", msgs.length === 1, String(msgs.length));

/* regenerar não pode duplicar o pedido do usuário */
let asked = null;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).endsWith("/api/chat")) {
    asked = JSON.parse(init.body).messages;
    return new Response(
      `data: ${JSON.stringify({ t: "text", v: "outra resposta" })}\n\ndata: {"t":"done"}\n\n`,
      { status: 200, headers: { "content-type": "text/event-stream" } },
    );
  }
  return realFetch(url, init);
};

store.useApp.setState({
  chats: [{ id: "c1", title: "t", updated_at: "", messages: [
    { id: "aaaaaaaa-1111-4111-8111-111111111111", role: "user", content: "qual a capital?" },
    { id: "bbbbbbbb-2222-4222-8222-222222222222", role: "assistant", content: "resposta velha" },
  ] }],
  activeId: "c1",
  dbEnabled: false,
  streaming: false,
});
await store.useApp.getState().regenerate();
msgs = store.useApp.getState().chats[0].messages;
check("regerar troca a resposta em vez de empilhar", msgs.length === 2, JSON.stringify(msgs.map((m) => m.role)));
check("regerar manteve o pedido do usuário uma vez", asked?.filter((m) => m.role === "user").length === 1, JSON.stringify(asked));
check("regerar trouxe o texto novo", msgs[1].content === "outra resposta", msgs[1].content);
check("regerar não deixou a resposta antiga", !msgs.some((m) => m.content === "resposta velha"));
globalThis.fetch = realFetch;

/* ── 3 · o link público mostra a resposta, e só ela ─────────────────────── */

const share = await import(new URL("app/api/share/route.ts", ROOT).href);
const libShare = await import(new URL("lib/share.ts", ROOT).href);

r = await share.POST(new Request("http://x/api/share", {
  method: "POST",
  headers: { "content-type": "application/json", "x-forwarded-for": "7.7.7.7", origin: "https://keen.example" },
  body: JSON.stringify({ text: "A resposta que vai ao link", lang: "pt-BR", title: "Pergunta" }),
}));
data = await r.json();
check("compartilhar → 200", r.status === 200, String(r.status));
check("devolve um id curto", typeof data.id === "string" && data.id.length >= 8, data.id);
check("o link é a página da resposta", /^https:\/\/keen\.example\/s\/[a-z2-9]+$/.test(data.url ?? ""), data.url);

const stored = [...table("shared_answers").values()][0];
check("guarda o texto", stored?.text === "A resposta que vai ao link", stored?.text);
check("não guarda o id da mensagem", !("message_id" in (stored ?? {})), JSON.stringify(Object.keys(stored ?? {})));
check("não guarda quem compartilhou", !("user_id" in (stored ?? {})) && !("email" in (stored ?? {})), JSON.stringify(Object.keys(stored ?? {})));

/* a leitura pública encontra pelo id, e nada mais */
const found = await libShare.readShared(data.id);
check("a página acha a resposta pelo id", found?.text === "A resposta que vai ao link", JSON.stringify(found));
check("id inexistente devolve nada", (await libShare.readShared("naoexiste99")) === null);
check("id fora do formato nem consulta", (await libShare.readShared("../../../etc/passwd")) === null);

/* texto vazio é recusado: não se publica uma página em branco */
r = await share.POST(new Request("http://x/api/share", {
  method: "POST",
  headers: { "content-type": "application/json", "x-forwarded-for": "8.8.8.8" },
  body: JSON.stringify({ text: "   " }),
}));
check("compartilhar texto vazio → 400", r.status === 400, String(r.status));

/* ── 4 · a página pública não vaza o resto da conversa ──────────────────── */
import { readFileSync } from "node:fs";
const page = readFileSync(new URL("app/s/[id]/page.tsx", ROOT), "utf8");
check("a página pública lê só a resposta", page.includes("readShared") && !page.includes("messages"));
check("a página pública fica fora do índice", /robots:\s*\{\s*index:\s*false/.test(page));

const view = readFileSync(new URL("components/shared-view.tsx", ROOT), "utf8");
check("a página não mostra o email de ninguém", !view.includes("email"));

/* ── 5 · as ações aparecem no celular, onde não existe hover ─────────────── */
const msg = readFileSync(new URL("components/message.tsx", ROOT), "utf8");
check("ações não dependem de hover para aparecer", !/opacity-0[^"]*group-hover/.test(msg), "escondidas atrás de :hover");
check("alvo de toque maior no celular", /h-7 w-7[^`]*sm:h-6 sm:w-6/.test(msg), "24px em todo lugar");

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
