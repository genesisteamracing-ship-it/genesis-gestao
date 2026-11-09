import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

// Node 20 does not discover TypeScript test files automatically.
const testFiles = readdirSync("src", { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.test\.[cm]?[jt]sx?$/.test(entry.name))
  .map((entry) => join(entry.parentPath, entry.name));

if (testFiles.length === 0) {
  throw new Error("Nenhum arquivo de teste encontrado em src.");
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...process.argv.slice(2), ...testFiles],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
