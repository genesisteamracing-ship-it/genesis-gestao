import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

if (process.env.CI === "true" || process.env.RENDER === "true") {
  process.exit(0);
}

const repoRoot = resolve(process.cwd(), "..");
if (!existsSync(resolve(repoRoot, ".git"))) {
  process.exit(0);
}

const isWin = process.platform === "win32";
const huskyBin = resolve(
  process.cwd(),
  "node_modules",
  ".bin",
  isWin ? "husky.cmd" : "husky"
);

if (!existsSync(huskyBin)) {
  process.exit(0);
}

const result = spawnSync(huskyBin, ["stem-erp/.husky"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: isWin,
});

process.exit(result.status ?? 0);
