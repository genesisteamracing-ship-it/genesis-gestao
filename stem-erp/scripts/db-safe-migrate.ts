import { execFileSync } from "node:child_process";
import path from "node:path";
import { createLocalDatabaseSnapshot, syncNeonRecoveryBranch } from "./db-backup-sync";

export const FORBIDDEN_PRISMA_FLAGS = [
  "--force-reset",
  "--accept-data-loss",
  "migrate reset",
  "db execute",
] as const;

export function validateSafePrismaArgs(args: readonly string[]): {
  allowed: boolean;
  reason?: string;
} {
  const joined = args.join(" ").toLowerCase();
  for (const forbidden of FORBIDDEN_PRISMA_FLAGS) {
    if (joined.includes(forbidden.toLowerCase())) {
      return {
        allowed: false,
        reason: `BLOQUEIO DE SEGURANÇA (GUARDRAIL): O parâmetro/comando '${forbidden}' é estritamente proibido para proteger os dados de produção contra perda ou reset.`,
      };
    }
  }
  return { allowed: true };
}

async function runSafeMigrate() {
  const extraArgs = process.argv.slice(2);
  const validation = validateSafePrismaArgs(extraArgs);

  if (!validation.allowed) {
    console.error(`❌ ${validation.reason}`);
    process.exit(1);
  }

  console.log("🛡️ 1/3 Criando snapshot local e sincronizando branch de backup antes de atualizar o schema...");
  const localTest = extraArgs.length === 1 && extraArgs[0] === "--local-test";
  if (extraArgs.length && !localTest) throw new Error("Argumento de sincronização desconhecido.");
  if (localTest) {
    for (const value of [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED]) {
      const url = value ? URL.parse(value) : null;
      if (!url || !["postgres:", "postgresql:"].includes(url.protocol) ||
          !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/tasks_test") {
        throw new Error("O teste exige um banco PostgreSQL local chamado tasks_test.");
      }
    }
  } else {
    const neonSync = syncNeonRecoveryBranch();
    if (!neonSync.synced) throw new Error(neonSync.message);
    console.log(`☁️  ${neonSync.message}`);
  }

  const snapshot = await createLocalDatabaseSnapshot(
    localTest ? path.resolve("prisma", "backups", "tasks-test") : undefined,
    localTest,
  );
  console.log(`💾 Snapshot pré-migração salvo em: ${snapshot.filePath}`);

  console.log("🛡️ 2/3 Verificando diferenças de schema de forma não-destrutiva...");
  execFileSync(process.execPath, [path.resolve("node_modules/prisma/build/index.js"), "db", "push", "--skip-generate"], { stdio: "inherit" });

  console.log("✅ 3/3 Schema sincronizado com segurança (Zero perda de dados)!");
}

if (process.argv[1]?.includes("db-safe-migrate")) {
  runSafeMigrate().catch((err) => {
    console.error("❌ Operação interrompida pelo Guardrail de Banco de Dados:", err);
    process.exit(1);
  });
}
