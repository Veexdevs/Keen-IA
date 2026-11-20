/* The auth routes, against a fake GoTrue and a fake Supabase. */
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

/** The repository root, wherever this file is run from. */
const ROOT = pathToFileURL(dirname(dirname(dirname(fileURLToPath(import.meta.url)))) + "/");
register(new URL("./loader.mjs", import.meta.url).href, ROOT);

let pass = 0, fail = 0;
const check = (n, c, d = "") => { if (c) { pass++; console.log(`ok   ${n}`); } else { fail++; console.log(`FAIL ${n} ${d}`); } };

let calls = [];
globalThis.fetch = async (url, init) => {
  const body = init?.body ? JSON.parse(init.body) : {};
  calls.push({ url: String(url), body, headers: init?.headers ?? {} });
  const u = String(url);

  if (u.endsWith("/auth/v1/admin/users") && init?.method === "POST") {
    if (body.email === "existe@exemplo.com") {
      return new Response(JSON.stringify({ message: "User already registered" }), { status: 422 });
    }
    if (body.password === "curta") {
      return new Response(JSON.stringify({ message: "Password should be at least 6 characters" }), { status: 422 });
    }
    return new Response(JSON.stringify({ id: "u1", email: body.email, email_confirmed_at: new Date().toISOString() }), { status: 200 });
  }

  if (u.includes("/auth/v1/token")) {
    if (body.password === "errada") {
      return new Response(JSON.stringify({ error: "invalid_grant", error_description: "Invalid login credentials" }), { status: 400 });
    }
    return new Response(JSON.stringify({
      access_token: "a", refresh_token: "r", expires_in: 3600, token_type: "bearer",
      user: { id: "u1", email: body.email },
    }), { status: 200 });
  }
  return new Response("{}", { status: 200 });
};

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-key";

const signup = await import(new URL("app/api/auth/signup/route.ts", ROOT).href);
const signin = await import(new URL("app/api/auth/signin/route.ts", ROOT).href);

const post = (h, body, headers = {}) =>
  h.POST(new Request("http://x/api/auth", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1", ...headers },
    body: JSON.stringify(body),
  }));

let r = await post(signup, { email: "Novo@Exemplo.com", password: "segredo123", name: "Ana" });
let d = await r.json();
check("cadastro cria conta", r.status === 200, `${r.status}`);
check("e-mail normalizado", calls.at(-1).body.email === "novo@exemplo.com", calls.at(-1).body.email);
check("e-mail já confirmado", calls.at(-1).body.email_confirm === true);
check("nome vai no metadata", calls.at(-1).body.user_metadata?.full_name === "Ana");
check("usa a service key", String(calls.at(-1).headers.Authorization).includes("fake-service-key"));

r = await post(signup, { email: "nao-vale", password: "segredo123" });
check("e-mail inválido → 400", r.status === 400 && (await r.json()).error === "invalid-email");
r = await post(signup, { email: "a@b.com", password: "123" });
check("senha curta → 400", r.status === 400 && (await r.json()).error === "weak-password");
r = await post(signup, { email: "existe@exemplo.com", password: "segredo123" });
check("conta existente → 409", r.status === 409 && (await r.json()).error === "exists");
r = await post(signup, { email: "x@y.com", password: "curta" });
check("GoTrue recusa senha → 400", r.status === 400);

r = await post(signin, { email: "Novo@Exemplo.com", password: "segredo123" });
d = await r.json();
check("login devolve sessão", r.status === 200 && d.session?.access_token === "a");
check("login normaliza e-mail", calls.at(-1).body.email === "novo@exemplo.com");
r = await post(signin, { email: "a@b.com", password: "errada" });
check("senha errada → 401", r.status === 401 && (await r.json()).error === "wrong-credentials");

/* rate limit */
let blocked = 0;
for (let i = 0; i < 25; i++) {
  const res = await post(signin, { email: "a@b.com", password: "x" }, { "x-forwarded-for": "9.9.9.9" });
  if (res.status === 429) blocked++;
}
check("limitador de login entra em ação", blocked > 0, `${blocked}`);
const other = await post(signup, { email: "a@b.com", password: "x" }, { "x-forwarded-for": "8.8.8.8" });
check("limite é por endereço", other.status !== 429);

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
