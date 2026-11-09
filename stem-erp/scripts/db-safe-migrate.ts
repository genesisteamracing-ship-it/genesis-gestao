import { execSync } from "node:child_process";
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
  const neonSync = syncNeonRecoveryBranch();
  console.log(`☁️  ${neonSync.message}`);

  const snapshot = await createLocalDatabaseSnapshot();
  console.log(`💾 Snapshot pré-migração salvo em: ${snapshot.filePath}`);

  console.log("🛡️ 2/3 Verificando diferenças de schema de forma não-destrutiva...");
  execSync("npx prisma db push", { stdio: "inherit" });

  console.log("✅ 3/3 Schema sincronizado com segurança (Zero perda de dados)!");
}

if (process.argv[1]?.includes("db-safe-migrate")) {
  runSafeMigrate().catch((err) => {
    console.error("❌ Operação interrompida pelo Guardrail de Banco de Dados:", err);
    process.exit(1);
  });
}
