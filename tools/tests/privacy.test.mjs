/**
 * O email só pode aparecer na aba Conta.
 *
 * Antes ele vazava em três lugares que ninguém abre para mexer em conta: a
 * tela de abertura (pela saudação), o rodapé do menu lateral e o painel de
 * perfil. Isto trava isso.
 */
import { readFileSync } from "node:fs";

const ROOT = new URL("../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");

let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) { pass++; console.log(`ok   ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${detail}`); }
};

/* ── a saudação usa o nome, nunca o endereço ───────────────────────────── */
const chat = read("components/chat.tsx");
const linhaNome = chat.split("\n").find((l) => l.includes("const displayName")) ?? "";
check("displayName não corta o email", !linhaNome.includes("email"), linhaNome.trim());

const welcome = read("components/welcome.tsx");
check("saudação usa welcome.greeting", welcome.includes('t("welcome.greeting"'));
check("nome em accent", /welcome\.greeting[\s\S]{0,160}text-accent/.test(welcome));

/* ── o menu lateral não mostra o endereço ──────────────────────────────── */
const sidebar = read("components/sidebar.tsx");
check("sidebar sem user.email", !sidebar.includes("user.email"));
check("sidebar recebe só nome e avatar", /user: \{ name: string; avatar: string \}/.test(sidebar));

/* ── o painel de perfil não mostra o endereço ──────────────────────────── */
const modals = read("components/modals.tsx");
check("ProfileModal sem o campo de email", !modals.includes('t("profile.email")'));

/* ── a aba Conta mostra, e é o único lugar ─────────────────────────────── */
const settings = read("components/settings.tsx");
const conta = settings.slice(settings.indexOf("function AccountTab"));
check("aba Conta mostra o email", conta.includes("{user.email}"));

/* ── as abas existem e as três futuras estão desligadas ────────────────── */
const tabs = read("components/tabs.tsx");
for (const nome of ["Chat", "Projetos", "Code", "Designer"]) {
  check(`aba ${nome}`, tabs.includes(`"${nome}"`));
}
check("só o Chat está ativo", /const soon = id !== "chat"/.test(tabs) && tabs.includes("disabled={soon}"));

/* ── o composer segue a referência ─────────────────────────────────────── */
const composer = read("components/composer.tsx");
check("composer em pílula", /rounded-full border bg-\[var\(--drawer-card\)\]/.test(composer));
check("botão de enviar redondo e sempre azul", /rounded-full bg-accent text-white transition-all disabled:opacity-90/.test(composer));
/* O botão do microfone deixou de ser decorativo: ele grava. A asserção
   acompanha isso — o que importa não é o nome do ícone, é o ditado existir. */
check("tem o botão de ditado", composer.includes("IconMic") && composer.includes("startRecording"));
check("o ditado manda para a rota de voz", read("lib/voice.ts").includes('"/api/voice"'));

console.log(`\n${pass} passaram, ${fail} falharam`);
if (fail) process.exit(1);
