/**
 * A marca muda de idioma: IA em português e espanhol, KI em alemão e holandês,
 * ИИ em russo, AI onde a sigla inglesa é a que as pessoas usam.
 *
 * Rodava fixo em "IA" — a página de download dizia "Keew IA" em inglês, e o
 * app dizia "IA" para todo mundo, inclusive alemães, que leem KI.
 */
import { readFileSync } from "node:fs";

const ROOT = new URL("../../", import.meta.url);
let pass = 0,
  fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) {
    pass++;
    console.log(`ok   ${name}`);
  } else {
    fail++;
    console.log(`FAIL ${name} ${detail}`);
  }
};

/* Import the real module instead of scraping the file with a regex: the
   catalogue at the bottom of dict.ts is the authority on what exists. */
const { DICTS } = await import(new URL("lib/i18n/dict.ts", ROOT).href);
const locales = Object.keys(DICTS);
check("20 idiomas empacotados", locales.length === 20, String(locales.length));

const values = {};
for (const [loc, d] of Object.entries(DICTS)) values[loc] = d["brand.ia"];
check("todos têm brand.ia", Object.values(values).every(Boolean), JSON.stringify(values));
check("nenhum ficou em inglês por engano", values.en === "AI");

/* ── the values are the real initialism, not a copy of "IA" ────────────── */
const expected = {
  en: "AI", "pt-BR": "IA", es: "IA", fr: "IA", it: "IA",
  de: "KI", nl: "KI", pl: "SI", tr: "YZ", ru: "ИИ", uk: "ШІ",
  ar: "ذ.ا", hi: "एआई", he: "ב.מ",
};
for (const [loc, want] of Object.entries(expected)) {
  check(`${loc} → ${want}`, values[loc] === want, values[loc]);
}
check("não é tudo IA", new Set(Object.values(values)).size > 3, [...new Set(Object.values(values))].join(" "));

/* ── the download page resolves the same letters ───────────────────────── */
const brand = readFileSync(new URL("site/lib/brand.ts", ROOT), "utf8");
check("site: inglês → AI", /en: "AI"/.test(brand));
check("site: alemão → KI", /\bde: "KI"/.test(brand));
check("site: russo → ИИ", /ru: "ИИ"/.test(brand));
check("site: sem cookie cai no inglês", /if \(!locale\) return W/.test(brand));
check("site: aceita pt-BR e pt", /"pt-BR": "IA"/.test(brand) && /\bpt: "IA"/.test(brand));

/* ── the mark is a name, so it never flips ─────────────────────────────── */
const logo = readFileSync(new URL("components/logo.tsx", ROOT), "utf8");
check("marca com dir=ltr", /dir="ltr"/.test(logo));
check("marca lê do dicionário", /t\("brand\.ia"\)/.test(logo));

/* ── the opening screen uses a mark with no plate ──────────────────────── */
const svg = readFileSync(new URL("public/mark.svg", ROOT), "utf8");
check("mark.svg não tem retângulo de fundo", !/<rect/.test(svg));
/* O recorte tem de CONTER o desenho, não caber dentro dele. Numa rodada
   anterior o viewBox foi apertado para 63.6–357 enquanto o path ia de 3 a 418,
   e a marca virou quatro pedaços soltos na página de download. */
const vb = svg.match(/viewBox="([^"]+)"/)?.[1].split(/[\s,]+/).map(Number);
const path = svg.match(/d="([^"]+)"/)?.[1] ?? "";
const nums = (path.match(/-?\d+\.?\d*/g) ?? []).map(Number);
const xs = nums.filter((_, i) => i % 2 === 0);
const ys = nums.filter((_, i) => i % 2 === 1);
check("mark.svg declara viewBox", Boolean(vb && vb.length === 4), svg.slice(0, 80));
/* Pontos de controle de Bézier ficam fora da curva desenhada, então o quadro
   pode ser excedido em poucos por cento sem nada sumir. Cortar de verdade,
   como o 63.6–357 de antes, erra por 30%. */
const tol = vb ? Math.max(vb[2], vb[3]) * 0.06 : 0;
check(
  "mark.svg contém o desenho inteiro (nada cortado)",
  vb && Math.min(...xs) >= vb[0] - tol && Math.max(...xs) <= vb[0] + vb[2] + tol &&
       Math.min(...ys) >= vb[1] - tol && Math.max(...ys) <= vb[1] + vb[3] + tol,
  `viewBox ${vb} · desenho x ${Math.min(...xs)}–${Math.max(...xs)} y ${Math.min(...ys)}–${Math.max(...ys)}`,
);
check(
  "mark.svg não sobra muito (o desenho preenche o quadro)",
  vb && (Math.max(...xs) - Math.min(...xs)) / vb[2] > 0.85,
  `preenche ${(((Math.max(...xs) - Math.min(...xs)) / vb[2]) * 100).toFixed(0)}%`,
);

const manifest = JSON.parse(readFileSync(new URL("public/manifest.webmanifest", ROOT), "utf8"));
const any512 = manifest.icons.find((i) => i.sizes === "512x512" && i.purpose === "any");
check("manifest usa o ícone sem placa", any512?.src === "/icons/app-icon-512.png", JSON.stringify(any512));
check("manifest não abre em modo aplicativo", manifest.display === "browser", manifest.display);
check("manifest tem override para navegador", (manifest.display_override ?? []).includes("browser"));

const sw = readFileSync(new URL("public/sw.js", ROOT), "utf8");
check("sw pede o manifest à rede", /manifest\.webmanifest[\s\S]{0,120}fetch\(request\)/.test(sw));
check("sw mudou de versão (descarta cache antigo)", /keew-v2/.test(sw));

console.log(`\n${pass} passaram, ${fail} falharam`);
if (fail) process.exit(1);
