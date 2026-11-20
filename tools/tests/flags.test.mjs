import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

/** The repository root, wherever this file is run from. */
const ROOT = pathToFileURL(dirname(dirname(dirname(fileURLToPath(import.meta.url)))) + "/");
register(new URL("./loader.mjs", import.meta.url).href, ROOT);
const { LANGUAGE_BY_TAG } = await import(new URL("lib/i18n/languages.ts", ROOT).href);
const ar = LANGUAGE_BY_TAG.get("ar|ar-SA|ar-EG");
const he = LANGUAGE_BY_TAG.get("he|he-IL|iw");
console.log("árabe  →", ar.native, "· bandeira:", ar.flag, "(esperado: sa)");
console.log("hebraico →", he.native, "· bandeira:", he.flag, "(esperado: il)");
const ok = ar.flag === "sa" && he.flag === "il";
console.log(ok ? "CORRETO: cada um com a sua bandeira" : "INVERTIDO");
process.exit(ok ? 0 : 1);
