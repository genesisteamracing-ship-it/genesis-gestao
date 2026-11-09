import { Prisma, type WbsNode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { planWbsDefaults } from "@/lib/wbs-default-structure";

const orderBy = [{ sortOrder: "asc" }, { code: "asc" }] satisfies Prisma.WbsNodeOrderByWithRelationInput[];

export async function loadWbsWithDefaults(teamId: string, canInitialize: boolean): Promise<WbsNode[]> {
  if (!canInitialize) {
    const nodes = await prisma.wbsNode.findMany({ where: { teamId }, orderBy });
    const timestamp = new Date(0);
    return [...nodes, ...planWbsDefaults(teamId, nodes).map((node): WbsNode => ({
      ...node,
      description: null,
      ownerId: null,
      ownerName: null,
      status: "PLANNED",
      estimatedCostCents: 0,
      estimatedHours: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    }))];
  }

  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const nodes = await tx.wbsNode.findMany({ where: { teamId }, orderBy });
        const missing = planWbsDefaults(teamId, nodes);
        if (!missing.length) return nodes;
        await tx.wbsNode.createMany({ data: missing });
        return tx.wbsNode.findMany({ where: { teamId }, orderBy });
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      const canRetry = error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002");
      if (!canRetry || attempt >= 2) throw error;
    }
  }
}
