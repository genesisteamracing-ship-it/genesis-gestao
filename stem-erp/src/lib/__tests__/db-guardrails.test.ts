import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validateSafePrismaArgs } from "../../../scripts/db-safe-migrate";

describe("Database Safety Guardrails & Zero-Reset Policy", () => {
  it("bloqueia rigorosamente flags destrutivas como --force-reset, --accept-data-loss e migrate reset", () => {
    const forceReset = validateSafePrismaArgs(["db", "push", "--force-reset"]);
    assert.equal(forceReset.allowed, false);
    assert.ok(forceReset.reason?.includes("--force-reset"));

    const acceptDataLoss = validateSafePrismaArgs([
      "db",
      "push",
      "--accept-data-loss",
    ]);
    assert.equal(acceptDataLoss.allowed, false);
    assert.ok(acceptDataLoss.reason?.includes("--accept-data-loss"));

    const migrateReset = validateSafePrismaArgs(["migrate reset"]);
    assert.equal(migrateReset.allowed, false);
  });

  it("permite argumentos seguros de sincronização não-destrutiva", () => {
    const safeCheck = validateSafePrismaArgs(["--skip-generate"]);
    assert.equal(safeCheck.allowed, true);
  });

  it("garante que prisma/seed.ts não possui deleteMany destrutivo contra as tabelas de dados", () => {
    const seedPath = path.resolve(process.cwd(), "prisma", "seed.ts");
    const seedContent = fs.readFileSync(seedPath, "utf-8");

    assert.equal(
      seedContent.includes("transaction.deleteMany"),
      false,
      "prisma/seed.ts jamais deve conter transaction.deleteMany"
    );
    assert.equal(
      seedContent.includes("budgetResource.deleteMany"),
      false,
      "prisma/seed.ts jamais deve conter budgetResource.deleteMany"
    );
    assert.equal(
      seedContent.includes("user.deleteMany"),
      false,
      "prisma/seed.ts jamais deve conter user.deleteMany"
    );
  });
});
