"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasModuleAccess } from "@/lib/permissions";
import { calculateRiskPriority } from "@/lib/risk-matrix";
import {
  createRiskItemSchema,
  registerRiskReviewSchema,
  updateRiskItemSchema,
} from "@/lib/risk-schemas";
import { requireAuthUser } from "@/services/auth-service";
import { resolveActiveTeam } from "@/services/financial-service";
import type {
  RiskItemDTO,
  RiskModuleDataDTO,
  RiskReviewDTO,
} from "@/types/risks";

export interface RiskActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

function mapRiskItemToDTO(
  row: {
    id: string;
    teamId: string;
    season: string;
    entryType: RiskItemDTO["entryType"];
    title: string;
    description: string | null;
    sector: RiskItemDTO["sector"];
    probability: RiskItemDTO["probability"];
    consequence: RiskItemDTO["consequence"];
    priorityScore: number;
    priorityLevel: RiskItemDTO["priorityLevel"];
    proactiveStrategy: string | null;
    contingencyPlan: string | null;
    observations: string | null;
    evidenceNotes: string | null;
    evidenceUrl: string | null;
    status: RiskItemDTO["status"];
    ownerName: string | null;
    ownerUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: { reviews: number };
  }
): RiskItemDTO {
  return {
    id: row.id,
    teamId: row.teamId,
    season: row.season,
    entryType: row.entryType,
    title: row.title,
    description: row.description,
    sector: row.sector,
    probability: row.probability,
    consequence: row.consequence,
    priorityScore: row.priorityScore,
    priorityLevel: row.priorityLevel,
    proactiveStrategy: row.proactiveStrategy,
    contingencyPlan: row.contingencyPlan,
    observations: row.observations,
    evidenceNotes: row.evidenceNotes,
    evidenceUrl: row.evidenceUrl,
    status: row.status,
    ownerName: row.ownerName,
    ownerUserId: row.ownerUserId,
    reviewsCount: row._count.reviews,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function resolveRiskContext(requireWrite: boolean) {
  const user = await requireAuthUser();
  if (!hasModuleAccess(user.permissions, "risks")) {
    throw new Error("Sem permissão para acessar o módulo de Gestão de Riscos.");
  }
  if (requireWrite && user.role === UserRole.AUDITOR) {
    throw new Error("Perfil Auditor possui acesso somente leitura.");
  }
  const { activeTeam } = await resolveActiveTeam(user);
  return { user, teamId: activeTeam.id };
}

export async function getRiskModuleData(
  season: string
): Promise<RiskActionResult<RiskModuleDataDTO>> {
  try {
    const { user, teamId } = await resolveRiskContext(false);
    const activeSeason = season.trim() || "2025/2026";

    const [rows, members] = await Promise.all([
      prisma.riskItem.findMany({
        where: { teamId, season: activeSeason },
        include: { _count: { select: { reviews: true } } },
        orderBy: [{ priorityScore: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.user.findMany({
        where: { teamId, isActive: true },
        select: { id: true, name: true, deliveryGroup: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      success: true,
      message: "Dados carregados com sucesso.",
      data: {
        items: rows.map(mapRiskItemToDTO),
        members,
        canEdit: user.role !== UserRole.AUDITOR,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os riscos.",
    };
  }
}

export async function createRiskItem(
  input: unknown
): Promise<RiskActionResult<RiskItemDTO>> {
  try {
    const { user, teamId } = await resolveRiskContext(true);
    const parsed = createRiskItemSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }

    const data = parsed.data;
    const { score, level } = calculateRiskPriority(
      data.probability,
      data.consequence
    );

    let ownerName: string | null = null;
    let ownerUserId: string | null = null;
    if (data.ownerUserId) {
      const owner = await prisma.user.findFirst({
        where: { id: data.ownerUserId, teamId, isActive: true },
        select: { id: true, name: true },
      });
      if (owner) {
        ownerUserId = owner.id;
        ownerName = owner.name;
      }
    }

    const created = await prisma.riskItem.create({
      data: {
        teamId,
        season: data.season,
        entryType: data.entryType,
        title: data.title,
        description: data.description || null,
        sector: data.sector,
        probability: data.probability,
        consequence: data.consequence,
        priorityScore: score,
        priorityLevel: level,
        proactiveStrategy: data.proactiveStrategy || null,
        contingencyPlan: data.contingencyPlan || null,
        observations: data.observations || null,
        evidenceNotes: data.evidenceNotes || null,
        evidenceUrl: data.evidenceUrl || null,
        status: data.status,
        ownerUserId,
        ownerName,
        createdByUserId: user.id,
      },
      include: { _count: { select: { reviews: true } } },
    });

    revalidatePath("/riscos");
    return {
      success: true,
      message: "Registro salvo com sucesso.",
      data: mapRiskItemToDTO(created),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao criar registro.",
    };
  }
}

export async function updateRiskItem(
  input: unknown
): Promise<RiskActionResult<RiskItemDTO>> {
  try {
    const { teamId } = await resolveRiskContext(true);
    const parsed = updateRiskItemSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }

    const data = parsed.data;
    const existing = await prisma.riskItem.findFirst({
      where: { id: data.id, teamId },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        message: "Registro não encontrado para esta equipe.",
      };
    }

    const { score, level } = calculateRiskPriority(
      data.probability,
      data.consequence
    );

    let ownerName: string | null = null;
    let ownerUserId: string | null = null;
    if (data.ownerUserId) {
      const owner = await prisma.user.findFirst({
        where: { id: data.ownerUserId, teamId, isActive: true },
        select: { id: true, name: true },
      });
      if (owner) {
        ownerUserId = owner.id;
        ownerName = owner.name;
      }
    }

    const updated = await prisma.riskItem.update({
      where: { id: existing.id },
      data: {
        entryType: data.entryType,
        title: data.title,
        description: data.description || null,
        sector: data.sector,
        probability: data.probability,
        consequence: data.consequence,
        priorityScore: score,
        priorityLevel: level,
        proactiveStrategy: data.proactiveStrategy || null,
        contingencyPlan: data.contingencyPlan || null,
        observations: data.observations || null,
        evidenceNotes: data.evidenceNotes || null,
        evidenceUrl: data.evidenceUrl || null,
        status: data.status,
        ownerUserId,
        ownerName,
      },
      include: { _count: { select: { reviews: true } } },
    });

    revalidatePath("/riscos");
    return {
      success: true,
      message: "Registro atualizado com sucesso.",
      data: mapRiskItemToDTO(updated),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao atualizar registro.",
    };
  }
}

export async function deleteRiskItem(
  riskItemId: string
): Promise<RiskActionResult> {
  try {
    const { teamId } = await resolveRiskContext(true);
    const existing = await prisma.riskItem.findFirst({
      where: { id: riskItemId, teamId },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        message: "Registro não encontrado para esta equipe.",
      };
    }

    await prisma.riskItem.delete({ where: { id: existing.id } });
    revalidatePath("/riscos");
    return { success: true, message: "Registro excluído com sucesso." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao excluir registro.",
    };
  }
}

export async function registerRiskReview(
  input: unknown
): Promise<RiskActionResult<{ item: RiskItemDTO; review: RiskReviewDTO }>> {
  try {
    const { user, teamId } = await resolveRiskContext(true);
    const parsed = registerRiskReviewSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }

    const data = parsed.data;
    const existing = await prisma.riskItem.findFirst({
      where: { id: data.riskItemId, teamId },
    });

    if (!existing) {
      return {
        success: false,
        message: "Registro não encontrado para esta equipe.",
      };
    }

    const { score, level } = calculateRiskPriority(
      data.newProbability,
      data.newConsequence
    );

    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.riskReview.create({
        data: {
          riskItemId: existing.id,
          teamId,
          previousProbability: existing.probability,
          newProbability: data.newProbability,
          previousConsequence: existing.consequence,
          newConsequence: data.newConsequence,
          previousStatus: existing.status,
          newStatus: data.newStatus,
          notes: data.notes,
          evidenceNotes: data.evidenceNotes || null,
          evidenceUrl: data.evidenceUrl || null,
          reviewerName: user.name,
          reviewerUserId: user.id,
        },
      });

      const updatedItem = await tx.riskItem.update({
        where: { id: existing.id },
        data: {
          probability: data.newProbability,
          consequence: data.newConsequence,
          priorityScore: score,
          priorityLevel: level,
          status: data.newStatus,
          ...(data.evidenceNotes
            ? { evidenceNotes: data.evidenceNotes }
            : {}),
          ...(data.evidenceUrl ? { evidenceUrl: data.evidenceUrl } : {}),
        },
        include: { _count: { select: { reviews: true } } },
      });

      return { item: updatedItem, review };
    });

    revalidatePath("/riscos");
    return {
      success: true,
      message: "Revisão registrada com sucesso.",
      data: {
        item: mapRiskItemToDTO(result.item),
        review: {
          id: result.review.id,
          riskItemId: result.review.riskItemId,
          previousProbability: result.review.previousProbability,
          newProbability: result.review.newProbability,
          previousConsequence: result.review.previousConsequence,
          newConsequence: result.review.newConsequence,
          previousStatus: result.review.previousStatus,
          newStatus: result.review.newStatus,
          notes: result.review.notes,
          evidenceNotes: result.review.evidenceNotes,
          evidenceUrl: result.review.evidenceUrl,
          reviewerName: result.review.reviewerName,
          reviewedAt: result.review.reviewedAt.toISOString(),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erro ao registrar revisão.",
    };
  }
}

export async function getRiskReviews(
  riskItemId: string
): Promise<RiskActionResult<RiskReviewDTO[]>> {
  try {
    const { teamId } = await resolveRiskContext(false);
    const rows = await prisma.riskReview.findMany({
      where: { riskItemId, teamId },
      orderBy: { reviewedAt: "desc" },
    });

    return {
      success: true,
      message: "Histórico carregado.",
      data: rows.map((r) => ({
        id: r.id,
        riskItemId: r.riskItemId,
        previousProbability: r.previousProbability,
        newProbability: r.newProbability,
        previousConsequence: r.previousConsequence,
        newConsequence: r.newConsequence,
        previousStatus: r.previousStatus,
        newStatus: r.newStatus,
        notes: r.notes,
        evidenceNotes: r.evidenceNotes,
        evidenceUrl: r.evidenceUrl,
        reviewerName: r.reviewerName,
        reviewedAt: r.reviewedAt.toISOString(),
      })),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao carregar histórico de revisões.",
    };
  }
}
