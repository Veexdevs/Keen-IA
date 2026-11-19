#!/usr/bin/env node
/**
 * Keew IA — o caminho curto até um instalador.
 *
 * Um site não gera .exe, .apk ou .ipa sozinho. Este script não finge que gera:
 * ele diz o que cada alvo precisa e dispara o que dá para disparar daqui.
 *
 *   node tools/installers.mjs            → status de cada alvo
 *   node tools/installers.mjs --trigger  → dispara o workflow no GitHub
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const REPO = "Veexdevs/Keew-IA";

const TARGETS = [
  {
    name: "Android",
    artefact: ".apk",
    runner: "ubuntu-latest (Java 21 + Android SDK)",
    local: process.platform === "linux" && Boolean(which("java")),
    note: "serviço do GitHub Actions baixa o SDK e compila",
  },
  {
    name: "iOS",
    artefact: ".ipa",
    runner: "macos-latest (Xcode)",
    local: process.platform === "darwin",
    note: "sem assinatura; instalar no iPhone exige AltStore/Sideloadly",
  },
  {
    name: "Windows",
    artefact: ".exe",
    runner: "windows-latest",
    local: process.platform === "win32",
    note: "instalador NSIS + versão portátil",
  },
  {
    name: "Linux",
    artefact: "AppImage / .deb",
    runner: "ubuntu-latest",
    local: process.platform === "linux",
    note: "electron-builder empacota aqui mesmo, com o Electron baixado",
  },
  {
    name: "Web (PWA)",
    artefact: "instalável no navegador",
    runner: "nenhum",
    local: true,
    note: "Android/Chrome e iOS/Safari: Menu → Instalar app",
  },
];

function which(bin) {
  try {
    execFileSync("sh", ["-c", `command -v ${bin}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const trigger = process.argv.includes("--trigger");

console.log("\nKeew IA — instaladores\n");
for (const t of TARGETS) {
  const mark = t.local ? "✓" : "·";
  console.log(`  ${mark} ${t.name.padEnd(9)} ${t.artefact.padEnd(22)} ${t.runner}`);
  console.log(`    ${t.note}\n`);
}

if (trigger) {
  if (!which("gh")) {
    console.error("O GitHub CLI (gh) não está instalado. Rode o workflow pela aba Actions.");
    process.exit(1);
  }
  try {
    execFileSync("gh", ["workflow", "run", "installers.yml", "--repo", REPO], {
      stdio: "inherit",
    });
    console.log("\nDisparado. Acompanhe: gh run watch --repo " + REPO);
    console.log("Os arquivos saem no release: gh release view installers --repo " + REPO);
  } catch {
    console.error("Não deu para disparar. Abra Actions → Instaladores → Run workflow.");
    process.exit(1);
  }
} else {
  console.log("Para gerar todos:  node tools/installers.mjs --trigger");
  console.log("(ou Actions → Instaladores → Run workflow)\n");
}

if (!existsSync("desktop/package.json")) {
  console.error("desktop/package.json ausente — o empacotador de desktop não está no lugar.");
  process.exit(1);
}
