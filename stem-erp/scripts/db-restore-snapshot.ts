import fs from "node:fs";
import path from "node:path";
import {
  PrismaClient,
  type Team,
  type User,
  type Category,
  type BudgetResource,
  type Transaction,
  type Sponsor,
  type ReturnAction,
  type Stakeholder,
  type CommunicationPlan,
  type CommunicationLog,
  type WbsNode,
} from "@prisma/client";
import type { DatabaseSnapshotPayload } from "./db-backup-sync";

const prisma = new PrismaClient();

export async function restoreDatabaseFromSnapshotFile(
  snapshotPath = path.resolve(process.cwd(), "prisma", "backups", "latest-snapshot.json")
): Promise<{ restoredCounts: Record<string, number> }> {
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Arquivo de snapshot não encontrado em: ${snapshotPath}`);
  }

  const raw = fs.readFileSync(snapshotPath, "utf-8");
  const payload = JSON.parse(raw) as DatabaseSnapshotPayload;

  const teams = (payload.data.teams ?? []) as Team[];
  const users = (payload.data.users ?? []) as User[];
  const categories = (payload.data.categories ?? []) as Category[];
  const budgetResources = (payload.data.budgetResources ?? []) as BudgetResource[];
  const transactions = (payload.data.transactions ?? []) as Transaction[];
  const sponsors = (payload.data.sponsors ?? []) as Sponsor[];
  const returnActions = (payload.data.returnActions ?? []) as ReturnAction[];
  const stakeholders = (payload.data.stakeholders ?? []) as Stakeholder[];
  const plans = (payload.data.communicationPlans ?? []) as CommunicationPlan[];
  const logs = (payload.data.communicationLogs ?? []) as CommunicationLog[];
  const wbsNodes = (payload.data.wbsNodes ?? []) as WbsNode[];

  for (const t of teams) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: { ...t },
      create: { ...t },
    });
  }

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { ...u },
      create: { ...u },
    });
  }

  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: { ...c },
      create: { ...c },
    });
  }

  for (const b of budgetResources) {
    await prisma.budgetResource.upsert({
      where: { id: b.id },
      update: { ...b },
      create: { ...b },
    });
  }

  for (const tx of transactions) {
    await prisma.transaction.upsert({
      where: { id: tx.id },
      update: { ...tx },
      create: { ...tx },
    });
  }

  for (const s of sponsors) {
    await prisma.sponsor.upsert({
      where: { id: s.id },
      update: { ...s },
      create: { ...s },
    });
  }

  for (const a of returnActions) {
    await prisma.returnAction.upsert({
      where: { id: a.id },
      update: { ...a },
      create: { ...a },
    });
  }

  // Primeiro insere stakeholders sem parentStakeholderId para respeitar auto-relacionamento
  for (const st of stakeholders) {
    await prisma.stakeholder.upsert({
      where: { id: st.id },
      update: { ...st, parentStakeholderId: null },
      create: { ...st, parentStakeholderId: null },
    });
  }
  for (const st of stakeholders) {
    if (st.parentStakeholderId) {
      await prisma.stakeholder.update({
        where: { id: st.id },
        data: { parentStakeholderId: st.parentStakeholderId },
      });
    }
  }

  for (const p of plans) {
    await prisma.communicationPlan.upsert({
      where: { id: p.id },
      update: { ...p },
      create: { ...p },
    });
  }

  for (const l of logs) {
    await prisma.communicationLog.upsert({
      where: { id: l.id },
      update: { ...l },
      create: { ...l },
    });
  }

  // Insere WbsNodes ordenados por depth para respeitar parentId
  const sortedWbs = [...wbsNodes].sort((a, b) => a.depth - b.depth);
  for (const node of sortedWbs) {
    await prisma.wbsNode.upsert({
      where: { id: node.id },
      update: { ...node },
      create: { ...node },
    });
  }

  return {
    restoredCounts: {
      teams: teams.length,
      users: users.length,
      categories: categories.length,
      budgetResources: budgetResources.length,
      transactions: transactions.length,
      sponsors: sponsors.length,
      returnActions: returnActions.length,
      stakeholders: stakeholders.length,
      communicationPlans: plans.length,
      communicationLogs: logs.length,
      wbsNodes: wbsNodes.length,
    },
  };
}

if (process.argv[1]?.includes("db-restore-snapshot")) {
  const targetFile = process.argv[2];
  restoreDatabaseFromSnapshotFile(targetFile)
    .then((res) => {
      console.log("✅ Restauração concluída com sucesso (sem perda de dados existentes):", res.restoredCounts);
    })
    .catch((err) => {
      console.error("❌ Erro na restauração:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
