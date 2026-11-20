/**
 * A resolve hook so the Next route handlers and the client stores can be run
 * in plain Node, without a bundler.
 *
 * Node does not know two things the app relies on:
 *
 *   "next/server"  → the package's own entry, which is a CommonJS file
 *   "@/lib/x"      → the project root, and a ".ts" file with no extension
 *
 * Two rules cover both, plus relative imports without an extension, which the
 * app writes everywhere because a bundler fills them in.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";
import fs from "node:fs";

/** The repository root: this file lives in <root>/tools/tests/. */
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

function withExtension(base) {
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier === "next/server") {
    return next(pathToFileURL(`${ROOT}/node_modules/next/server.js`).href, context);
  }

  if (specifier.startsWith("@/")) {
    const hit = withExtension(`${ROOT}/${specifier.slice(2)}`);
    if (hit) return next(pathToFileURL(hit).href, context);
  }

  /* "./languages" → "./languages.ts" */
  if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier) && context.parentURL) {
    const hit = withExtension(new URL(specifier, context.parentURL).pathname);
    if (hit) return next(pathToFileURL(hit).href, context);
  }

  return next(specifier, context);
}
