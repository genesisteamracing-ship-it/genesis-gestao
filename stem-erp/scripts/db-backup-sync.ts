import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const NEON_PROJECT_ID = "blue-moon-81024305";
export const NEON_PRODUCTION_BRANCH_ID = "br-silent-shadow-b5ehbb06";
export const NEON_BACKUP_BRANCH_NAME = "backup-daily-recovery";
export const MAX_LOCAL_BACKUPS = 30;

export interface DatabaseSnapshotMetadata {
  createdAt: string;
  projectId: string;
  productionBranchId: string;
  backupBranchName: string;
  counts: {
    teams: number;
    users: number;
    categories: number;
    budgetResources: number;
    transactions: number;
    sponsors: number;
    returnActions: number;
    stakeholders: number;
    communicationPlans: number;
    communicationLogs: number;
    wbsNodes: number;
  };
}

export interface DatabaseSnapshotPayload {
  metadata: DatabaseSnapshotMetadata;
  data: {
    teams: unknown[];
    users: unknown[];
    categories: unknown[];
    budgetResources: unknown[];
    transactions: unknown[];
    sponsors: unknown[];
    returnActions: unknown[];
    stakeholders: unknown[];
    communicationPlans: unknown[];
    communicationLogs: unknown[];
    wbsNodes: unknown[];
  };
}

/**
 * Sincroniza a branch filha `backup-daily-recovery` no Neon com o estado atual da branch `production`.
 */
export function syncNeonRecoveryBranch(): { synced: boolean; message: string } {
  try {
    const listOutput = execSync(
      `neon branches list --project-id ${NEON_PROJECT_ID} --output json`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
    );
    const branches = JSON.parse(listOutput) as Array<{ id: string; name: string }>;
    const existing = branches.find((b) => b.name === NEON_BACKUP_BRANCH_NAME);

    if (existing) {
      execSync(
        `neon branches reset ${existing.id} --project-id ${NEON_PROJECT_ID} --parent`,
        { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
      );
      return {
        synced: true,
        message: `Branch filha '${NEON_BACKUP_BRANCH_NAME}' (${existing.id}) atualizada com o snapshot atual de produção.`,
      };
    } else {
      execSync(
        `neon branches create --project-id ${NEON_PROJECT_ID} --name ${NEON_BACKUP_BRANCH_NAME} --parent ${NEON_PRODUCTION_BRANCH_ID} --no-compute --no-secrets --output json`,
        { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }
      );
      return {
        synced: true,
        message: `Branch filha '${NEON_BACKUP_BRANCH_NAME}' criada a partir de produção.`,
      };
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      synced: false,
      message: `Aviso ao sincronizar branch Neon via CLI: ${errMsg}`,
    };
  }
}

/**
 * Exporta todas as tabelas críticas do banco de produção para um arquivo JSON versionado em `prisma/backups/`.
 */
export async function createLocalDatabaseSnapshot(
  backupsDir = path.resolve(process.cwd(), "prisma", "backups")
): Promise<{ filePath: string; metadata: DatabaseSnapshotMetadata }> {
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const [
    teams,
    users,
    categories,
    budgetResources,
    transactions,
    sponsors,
    returnActions,
    stakeholders,
    communicationPlans,
    communicationLogs,
    wbsNodes,
  ] = await Promise.all([
    prisma.team.findMany(),
    prisma.user.findMany(),
    prisma.category.findMany(),
    prisma.budgetResource.findMany(),
    prisma.transaction.findMany(),
    prisma.sponsor.findMany(),
    prisma.returnAction.findMany(),
    prisma.stakeholder.findMany(),
    prisma.communicationPlan.findMany(),
    prisma.communicationLog.findMany(),
    prisma.wbsNode.findMany(),
  ]);

  const metadata: DatabaseSnapshotMetadata = {
    createdAt: new Date().toISOString(),
    projectId: NEON_PROJECT_ID,
    productionBranchId: NEON_PRODUCTION_BRANCH_ID,
    backupBranchName: NEON_BACKUP_BRANCH_NAME,
    counts: {
      teams: teams.length,
      users: users.length,
      categories: categories.length,
      budgetResources: budgetResources.length,
      transactions: transactions.length,
      sponsors: sponsors.length,
      returnActions: returnActions.length,
      stakeholders: stakeholders.length,
      communicationPlans: communicationPlans.length,
      communicationLogs: communicationLogs.length,
      wbsNodes: wbsNodes.length,
    },
  };

  const payload: DatabaseSnapshotPayload = {
    metadata,
    data: {
      teams,
      users,
      categories,
      budgetResources,
      transactions,
      sponsors,
      returnActions,
      stakeholders,
      communicationPlans,
      communicationLogs,
      wbsNodes,
    },
  };

  const safeTimestamp = metadata.createdAt.replace(/[:.]/g, "-");
  const fileName = `snapshot-${safeTimestamp}.json`;
  const filePath = path.join(backupsDir, fileName);
  const latestPath = path.join(backupsDir, "latest-snapshot.json");

  const serialized = JSON.stringify(payload, null, 2);
  fs.writeFileSync(filePath, serialized, "utf-8");
  fs.writeFileSync(latestPath, serialized, "utf-8");

  // Rotaciona backups antigos preservando os últimos MAX_LOCAL_BACKUPS
  const allSnapshots = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith("snapshot-") && f.endsWith(".json"))
    .sort();

  if (allSnapshots.length > MAX_LOCAL_BACKUPS) {
    const toDelete = allSnapshots.slice(0, allSnapshots.length - MAX_LOCAL_BACKUPS);
    for (const oldFile of toDelete) {
      fs.unlinkSync(path.join(backupsDir, oldFile));
    }
  }

  return { filePath, metadata };
}

async function runCli() {
  console.log("🛡️ Iniciando rotina de Backup Diário & Sincronização de Branch de Restauração...");
  const neonSync = syncNeonRecoveryBranch();
  console.log(`☁️  Neon Branch Sync: ${neonSync.message}`);

  const snapshot = await createLocalDatabaseSnapshot();
  console.log(`💾 Snapshot local salvo em: ${snapshot.filePath}`);
  console.log("📊 Contagem de registros protegidos:", snapshot.metadata.counts);
}

if (process.argv[1]?.includes("db-backup-sync")) {
  runCli()
    .catch((err) => {
      console.error("❌ Falha ao executar backup:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
