/**
 * Runs the route and store tests.
 *
 *   npm run test
 *
 * Each test is a plain Node script that imports the real TypeScript modules
 * through loader.mjs. No test framework: the project has no room for a
 * dependency that would be used once a week, and these are ten assertions each.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(dirname(here));
const files = readdirSync(here).filter((f) => f.endsWith(".test.mjs")).sort();

const loader = pathToFileURL(join(here, "loader.mjs")).href;
const importFlag =
  `data:text/javascript,import{register}from'node:module';` +
  `import{pathToFileURL}from'node:url';` +
  `register(${JSON.stringify(loader)},${JSON.stringify(pathToFileURL(root + "/").href)});`;

let failed = 0;
for (const file of files) {
  const name = file.replace(".test.mjs", "");
  process.stdout.write(`\n── ${name}\n`);
  const r = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings", "--import", importFlag, join(here, file)],
    { cwd: root, stdio: "inherit" },
  );
  if (r.status !== 0) failed++;
}

process.stdout.write(failed ? `\n${failed} arquivo(s) com falha\n` : "\ntudo passou\n");
process.exit(failed ? 1 : 0);
