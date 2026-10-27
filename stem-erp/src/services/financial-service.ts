import {
  DeliveryGroup,
  ReturnActionCategory,
  SponsorTier,
  TrackingMethod,
  TransactionType,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import {
  buildLegacySeason,
  buildSeasonMonths,
  formatSeasonDateBR,
  getSeasonMonthIndex,
} from "@/lib/season";
import type {
  CreateBudgetResourceInput,
  CreateCategoryInput,
  CreateReturnActionInput,
  CreateSponsorInput,
  CreateTransactionInput,
  DeleteBudgetResourceInput,
  DeleteReturnActionInput,
  DeleteSponsorInput,
  DeleteTransactionInput,
  UpdateBudgetResourceInput,
  UpdateSponsorInput,
  UpdateTransactionInput,
} from "@/lib/validations/financial";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type {
  ActiveTeamSummaryDTO,
  BudgetResourceDTO,
  CashFlowMonthPoint,
  CashFlowSummaryDTO,
  CategoryDTO,
  DashboardKPIsDTO,
  DashboardMetricsDTO,
  DeliveryGroupScheduleRow,
  ReturnActionDTO,
  ScheduleAlertStatus,
  SeasonMonthDTO,
  SponsorDTO,
  SponsorRoiSummaryDTO,
  TeamMemberOptionDTO,
  TransactionDTO,
} from "@/types/financial";

const ALL_DELIVERY_GROUPS: DeliveryGroup[] = [
  DeliveryGroup.ENGINEERING_CAD,
  DeliveryGroup.MANUFACTURING_CNC,
  DeliveryGroup.PIT_DISPLAY,
  DeliveryGroup.MARKETING_SPONSOR,
  DeliveryGroup.PROJECT_MANAGEMENT,
  DeliveryGroup.SOCIAL_PROJECT,
];

/**
 * Resolve o ID da equipe ativa para o usuário autenticado.
 * - Integrante de Equipe (Equipe Gênesis, Equipe Alpha): vê estritamente sua própria equipe (user.teamId).
 *   Dentro da sua equipe, todos os 5 setores (Engenharia, Manufatura, Pit Display, Marketing, Gestão) se veem!
 * - SUPER_ADMIN: vê a equipe ativa selecionada ou a primeira equipe ativa do banco.
 */
/** Resolve a temporada da equipe, com fallback legado (spec §6) */
function resolveTeamSeasonRange(t: {
  season: string | null;
  seasonStartDate: Date | null;
  seasonEndDate: Date | null;
  createdAt: Date;
}): { label: string; start: Date; end: Date } {
  if (t.season && t.seasonStartDate && t.seasonEndDate) {
    return { label: t.season, start: t.seasonStartDate, end: t.seasonEndDate };
  }
  const legacy = buildLegacySeason(t.createdAt);
  return { label: "Temporada atual", start: legacy.start, end: legacy.end };
}

async function loadTeamSeasonRange(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      season: true,
      seasonStartDate: true,
      seasonEndDate: true,
      createdAt: true,
    },
  });

  if (!team) {
    throw new Error("Equipe não encontrada.");
  }

  return resolveTeamSeasonRange(team);
}

/** RN5/RN6: deriva o mês do fluxo de caixa a partir da data; rejeita datas fora da temporada */
async function deriveReferenceMonthFromDate(
  teamId: string,
  date: Date
): Promise<number> {
  const { start, end } = await loadTeamSeasonRange(teamId);
  const index = getSeasonMonthIndex(start, end, date);

  if (index === null) {
    throw new Error(
      `A data deve estar dentro da temporada (${formatSeasonDateBR(start)} a ${formatSeasonDateBR(end)}).`
    );
  }

  return index;
}

/** RN7: o mês planejado deve existir na temporada */
async function assertPlannedMonthInSeason(teamId: string, plannedMonth: number) {
  const { start, end } = await loadTeamSeasonRange(teamId);
  const total = buildSeasonMonths(start, end).length;

  if (plannedMonth < 1 || plannedMonth > total) {
    throw new Error(
      `O mês planejado deve estar dentro da temporada (1 a ${total}).`
    );
  }
}

export async function resolveActiveTeam(
  user?: AuthenticatedUserDTO | null
): Promise<{
  activeTeam: ActiveTeamSummaryDTO;
  availableTeams: ActiveTeamSummaryDTO[];
}> {
  const rawTeams = await prisma.team.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      schoolOrOrg: true,
      season: true,
      seasonStartDate: true,
      seasonEndDate: true,
      createdAt: true,
    },
  });

  if (rawTeams.length === 0) {
    throw new Error("Nenhuma equipe ativa encontrada no banco de dados.");
  }

  const allTeams: ActiveTeamSummaryDTO[] = rawTeams.map((t) => {
    const { label, start, end } = resolveTeamSeasonRange(t);

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      schoolOrOrg: t.schoolOrOrg,
      season: {
        label,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    };
  });

  const matchedTeam =
    allTeams.find((t) => t.id === user?.teamId) ?? allTeams[0];

  const availableTeams =
    !user || user.role === UserRole.SUPER_ADMIN ? allTeams : [matchedTeam];

  return {
    activeTeam: matchedTeam,
    availableTeams,
  };
}

/** Meses da temporada (derivados do intervalo início → fim) */
export function getSeasonMonthsFromTeam(
  team: Pick<ActiveTeamSummaryDTO, "season">
): SeasonMonthDTO[] {
  return buildSeasonMonths(
    new Date(team.season.startDate),
    new Date(team.season.endDate)
  );
}

/**
 * Função utilitária pura: Cálculo do Fluxo de Caixa na Linha do Tempo (meses da temporada)
 */
export function calculateCashFlowTimeline(
  transactions: Pick<TransactionDTO, "referenceMonth" | "type" | "amountCents">[],
  seasonMonths: SeasonMonthDTO[]
): CashFlowSummaryDTO {
  let accumulatedBalanceCents = 0;
  let totalOriginsCents = 0;
  let totalApplicationsCents = 0;

  const months: CashFlowMonthPoint[] = seasonMonths.map(({ index: month, label }) => {
    const originsCents = transactions
      .filter((tx) => tx.referenceMonth === month && tx.type === TransactionType.ORIGIN)
      .reduce((acc, tx) => acc + tx.amountCents, 0);

    const applicationsCents = transactions
      .filter((tx) => tx.referenceMonth === month && tx.type === TransactionType.APPLICATION)
      .reduce((acc, tx) => acc + tx.amountCents, 0);

    const netBalanceCents = originsCents - applicationsCents;
    accumulatedBalanceCents += netBalanceCents;

    totalOriginsCents += originsCents;
    totalApplicationsCents += applicationsCents;

    return {
      month,
      monthLabel: label,
      originsCents,
      applicationsCents,
      netBalanceCents,
      accumulatedBalanceCents,
    };
  });

  return {
    months,
    totalOriginsCents,
    totalApplicationsCents,
    totalNetBalanceCents: totalOriginsCents - totalApplicationsCents,
    finalAccumulatedBalanceCents: accumulatedBalanceCents,
  };
}

/**
 * Função utilitária pura: Cálculo do Cronograma Físico-Financeiro pelos Setores Internos da Equipe
 */
export function calculatePhysicalFinancialSchedule(
  budgetResources: Pick<
    BudgetResourceDTO,
    "deliveryGroup" | "plannedMonth" | "plannedAmountCents"
  >[],
  transactions: Pick<
    TransactionDTO,
    "deliveryGroup" | "referenceMonth" | "type" | "amountCents"
  >[],
  seasonMonths: SeasonMonthDTO[]
): DeliveryGroupScheduleRow[] {
  return ALL_DELIVERY_GROUPS.map((deliveryGroup) => {
    const months = seasonMonths.map(({ index: month }) => {
      const plannedCents = budgetResources
        .filter(
          (item) => item.deliveryGroup === deliveryGroup && item.plannedMonth === month
        )
        .reduce((acc, item) => acc + item.plannedAmountCents, 0);

      const realizedCents = transactions
        .filter(
          (tx) =>
            tx.deliveryGroup === deliveryGroup &&
            tx.referenceMonth === month &&
            tx.type === TransactionType.APPLICATION
        )
        .reduce((acc, tx) => acc + tx.amountCents, 0);

      return {
        month,
        plannedCents,
        realizedCents,
      };
    });

    const totalPlannedCents = months.reduce((acc, m) => acc + m.plannedCents, 0);
    const totalRealizedCents = months.reduce((acc, m) => acc + m.realizedCents, 0);
    const varianceCents = totalPlannedCents - totalRealizedCents;

    const executionPercentage =
      totalPlannedCents > 0
        ? Math.round((totalRealizedCents / totalPlannedCents) * 100)
        : totalRealizedCents > 0
        ? 100
        : 0;

    let status: ScheduleAlertStatus = "OK";
    let statusLabel = "Dentro do Orçamento";

    if (varianceCents < 0) {
      status = "DESTRUCTIVE";
      statusLabel = "Orçamento Estourado";
    } else if (executionPercentage >= 90 && totalPlannedCents > 0) {
      status = "WARNING";
      statusLabel = "Limite Próximo";
    }

    return {
      deliveryGroup,
      label: DELIVERY_GROUP_LABELS[deliveryGroup],
      months,
      totalPlannedCents,
      totalRealizedCents,
      varianceCents,
      executionPercentage,
      status,
      statusLabel,
    };
  });
}

/**
 * Gera código sequencial ORC-XXX isolado por Equipe (teamId)
 */
async function generateNextBudgetCode(teamId: string): Promise<string> {
  const existingCodes = await prisma.budgetResource.findMany({
    where: { teamId },
    select: { code: true },
  });

  let maxNum = 0;
  for (const item of existingCodes) {
    const match = /^ORC-(\d+)$/i.exec(item.code);
    if (match) {
      const num = Number.parseInt(match[1], 10);
      if (!Number.isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `ORC-${String(nextNum).padStart(3, "0")}`;
}

export async function createBudgetResourceService(
  teamId: string,
  input: CreateBudgetResourceInput
) {
  const category = await prisma.category.findFirst({
    where: {
      id: input.categoryId,
      teamId,
    },
  });

  if (!category) {
    throw new Error("A categoria selecionada não pertence à sua equipe.");
  }

  const code = await generateNextBudgetCode(teamId);
  await assertPlannedMonthInSeason(teamId, input.plannedMonth);
  return prisma.budgetResource.create({
    data: {
      teamId,
      code,
      deliveryGroup: input.deliveryGroup,
      categoryId: input.categoryId,
      resourceName: input.resourceName.trim(),
      acquisitionStrategy: input.acquisitionStrategy,
      allocatedTo: input.allocatedTo.trim(),
      plannedMonth: input.plannedMonth,
      utilizationForecast: input.utilizationForecast,
      plannedAmountCents: input.plannedAmountCents,
    },
  });
}

export async function createTransactionService(
  teamId: string,
  input: CreateTransactionInput
) {
  const category = await prisma.category.findFirst({
    where: {
      id: input.categoryId,
      teamId,
    },
  });

  if (!category) {
    throw new Error("A categoria selecionada não pertence à sua equipe.");
  }

  const cleanBudgetResourceId =
    input.budgetResourceId && input.budgetResourceId !== "NONE"
      ? input.budgetResourceId
      : null;

  if (cleanBudgetResourceId) {
    const resource = await prisma.budgetResource.findFirst({
      where: {
        id: cleanBudgetResourceId,
        teamId,
      },
    });
    if (!resource) {
      throw new Error("O recurso orçamentário selecionado não pertence à sua equipe.");
    }
  }

  const cleanDocRef =
    input.documentRef && input.documentRef.trim().length > 0
      ? input.documentRef.trim()
      : null;

  const cleanSponsorId =
    input.sponsorId && input.sponsorId !== "NONE" && input.sponsorId.trim().length > 0
      ? input.sponsorId
      : null;

  if (input.trackingMethod === TrackingMethod.SPONSOR_CONTRACT && !cleanSponsorId) {
    throw new Error("Selecione a empresa patrocinadora para contratos de patrocínio.");
  }

  if (cleanSponsorId) {
    const sponsor = await prisma.sponsor.findFirst({
      where: {
        id: cleanSponsorId,
        teamId,
      },
    });
    if (!sponsor) {
      throw new Error("A empresa patrocinadora selecionada não pertence à sua equipe.");
    }
  }

  const referenceMonth = await deriveReferenceMonthFromDate(teamId, input.date);

  if (input.isBarterCounterpart) {
    return prisma.$transaction(async (tx) => {
      const originEntry = await tx.transaction.create({
        data: {
          teamId,
          date: input.date,
          referenceMonth,
          type: TransactionType.ORIGIN,
          deliveryGroup: input.deliveryGroup,
          categoryId: input.categoryId,
          budgetResourceId: cleanBudgetResourceId,
          sponsorId: cleanSponsorId,
          description: `[PERMUTA - ORIGEM] ${input.description.trim()}`,
          trackingMethod: input.trackingMethod,
          documentRef: cleanDocRef,
          amountCents: input.amountCents,
        },
      });

      const applicationEntry = await tx.transaction.create({
        data: {
          teamId,
          date: input.date,
          referenceMonth,
          type: TransactionType.APPLICATION,
          deliveryGroup: input.deliveryGroup,
          categoryId: input.categoryId,
          budgetResourceId: cleanBudgetResourceId,
          sponsorId: cleanSponsorId,
          description: `[PERMUTA - APLICAÇÃO] ${input.description.trim()}`,
          trackingMethod: input.trackingMethod,
          documentRef: cleanDocRef,
          amountCents: input.amountCents,
        },
      });

      return { originEntry, applicationEntry };
    });
  }

  const transaction = await prisma.transaction.create({
    data: {
      teamId,
      date: input.date,
      referenceMonth,
      type: input.type,
      deliveryGroup: input.deliveryGroup,
      categoryId: input.categoryId,
      budgetResourceId: cleanBudgetResourceId,
      sponsorId: cleanSponsorId,
      description: input.description.trim(),
      trackingMethod: input.trackingMethod,
      documentRef: cleanDocRef,
      amountCents: input.amountCents,
    },
  });

  return { transaction };
}

export async function updateBudgetResourceService(
  teamId: string,
  input: UpdateBudgetResourceInput
) {
  const existing = await prisma.budgetResource.findFirst({
    where: { id: input.id, teamId },
  });

  if (!existing) {
    throw new Error("Recurso orçamentário não encontrado ou não pertence à sua equipe.");
  }

  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, teamId },
  });

  if (!category) {
    throw new Error("A categoria selecionada não pertence à sua equipe.");
  }

  await assertPlannedMonthInSeason(teamId, input.plannedMonth);

  return prisma.budgetResource.update({
    where: { id: input.id },
    data: {
      deliveryGroup: input.deliveryGroup,
      categoryId: input.categoryId,
      resourceName: input.resourceName.trim(),
      acquisitionStrategy: input.acquisitionStrategy,
      allocatedTo: input.allocatedTo.trim(),
      plannedMonth: input.plannedMonth,
      utilizationForecast: input.utilizationForecast,
      plannedAmountCents: input.plannedAmountCents,
    },
  });
}

export async function deleteBudgetResourceService(
  teamId: string,
  input: DeleteBudgetResourceInput
) {
  const existing = await prisma.budgetResource.findFirst({
    where: { id: input.id, teamId },
  });

  if (!existing) {
    throw new Error("Recurso orçamentário não encontrado ou não pertence à sua equipe.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: { budgetResourceId: input.id },
      data: { budgetResourceId: null },
    });

    return tx.budgetResource.delete({
      where: { id: input.id },
    });
  });
}

export async function updateTransactionService(
  teamId: string,
  input: UpdateTransactionInput
) {
  const existing = await prisma.transaction.findFirst({
    where: { id: input.id, teamId },
  });

  if (!existing) {
    throw new Error("Transação não encontrada ou não pertence à sua equipe.");
  }

  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, teamId },
  });

  if (!category) {
    throw new Error("A categoria selecionada não pertence à sua equipe.");
  }

  const cleanBudgetResourceId =
    input.budgetResourceId && input.budgetResourceId !== "NONE"
      ? input.budgetResourceId
      : null;

  if (cleanBudgetResourceId) {
    const resource = await prisma.budgetResource.findFirst({
      where: { id: cleanBudgetResourceId, teamId },
    });
    if (!resource) {
      throw new Error("O recurso orçamentário selecionado não pertence à sua equipe.");
    }
  }

  const cleanDocRef =
    input.documentRef && input.documentRef.trim().length > 0
      ? input.documentRef.trim()
      : null;

  const cleanSponsorId =
    input.sponsorId && input.sponsorId !== "NONE" && input.sponsorId.trim().length > 0
      ? input.sponsorId
      : null;

  if (input.trackingMethod === TrackingMethod.SPONSOR_CONTRACT && !cleanSponsorId) {
    throw new Error("Selecione a empresa patrocinadora para contratos de patrocínio.");
  }

  if (cleanSponsorId) {
    const sponsor = await prisma.sponsor.findFirst({
      where: {
        id: cleanSponsorId,
        teamId,
      },
    });
    if (!sponsor) {
      throw new Error("A empresa patrocinadora selecionada não pertence à sua equipe.");
    }
  }

  const referenceMonth = await deriveReferenceMonthFromDate(teamId, input.date);

  return prisma.transaction.update({
    where: { id: input.id },
    data: {
      date: input.date,
      referenceMonth,
      type: input.type,
      deliveryGroup: input.deliveryGroup,
      categoryId: input.categoryId,
      budgetResourceId: cleanBudgetResourceId,
      sponsorId: cleanSponsorId,
      description: input.description.trim(),
      trackingMethod: input.trackingMethod,
      documentRef: cleanDocRef,
      amountCents: input.amountCents,
    },
  });
}

export async function deleteTransactionService(
  teamId: string,
  input: DeleteTransactionInput
) {
  const existing = await prisma.transaction.findFirst({
    where: { id: input.id, teamId },
  });

  if (!existing) {
    throw new Error("Transação não encontrada ou não pertence à sua equipe.");
  }

  return prisma.transaction.delete({
    where: { id: input.id },
  });
}

export async function createCategoryService(
  teamId: string,
  input: CreateCategoryInput
): Promise<CategoryDTO> {
  const cleanName = input.name.trim();

  const existing = await prisma.category.findFirst({
    where: {
      teamId,
      name: {
        equals: cleanName,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new Error("Já existe uma categoria com este nome na equipe.");
  }

  const created = await prisma.category.create({
    data: {
      teamId,
      name: cleanName,
      deliveryGroup: input.deliveryGroup,
    },
  });

  return {
    id: created.id,
    name: created.name,
    deliveryGroup: created.deliveryGroup,
  };
}

export async function createSponsorService(
  teamId: string,
  input: CreateSponsorInput
): Promise<SponsorDTO> {
  const cleanName = input.name.trim();

  const existing = await prisma.sponsor.findFirst({
    where: {
      teamId,
      name: {
        equals: cleanName,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new Error("Já existe uma empresa com este nome na equipe.");
  }

  const created = await prisma.sponsor.create({
    data: {
      teamId,
      name: cleanName,
      tier: input.tier,
      contactName: input.contactName?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });

  return {
    id: created.id,
    name: created.name,
    tier: created.tier,
    contactName: created.contactName,
    notes: created.notes,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function updateSponsorService(
  teamId: string,
  input: UpdateSponsorInput
): Promise<SponsorDTO> {
  const existing = await prisma.sponsor.findFirst({
    where: { id: input.id, teamId },
  });

  if (!existing) {
    throw new Error("Empresa não encontrada na equipe.");
  }

  const cleanName = input.name.trim();
  const nameCollision = await prisma.sponsor.findFirst({
    where: {
      teamId,
      id: { not: input.id },
      name: { equals: cleanName, mode: "insensitive" },
    },
  });

  if (nameCollision) {
    throw new Error("Já existe outra empresa com este nome na equipe.");
  }

  const updated = await prisma.sponsor.update({
    where: { id: input.id },
    data: {
      name: cleanName,
      tier: input.tier,
      contactName: input.contactName?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    tier: updated.tier,
    contactName: updated.contactName,
    notes: updated.notes,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function deleteSponsorService(
  teamId: string,
  input: DeleteSponsorInput
) {
  const existing = await prisma.sponsor.findFirst({
    where: { id: input.id, teamId },
  });

  if (!existing) {
    throw new Error("Empresa não encontrada na equipe.");
  }

  return prisma.sponsor.delete({
    where: { id: input.id },
  });
}

export async function createReturnActionService(
  teamId: string,
  input: CreateReturnActionInput
): Promise<ReturnActionDTO> {
  const sponsor = await prisma.sponsor.findFirst({
    where: { id: input.sponsorId, teamId },
  });

  if (!sponsor) {
    throw new Error("Empresa patrocinadora não encontrada na equipe.");
  }

  const created = await prisma.returnAction.create({
    data: {
      teamId,
      sponsorId: input.sponsorId,
      date: input.date,
      title: input.title.trim(),
      category: input.category,
      reachCount: input.reachCount ?? null,
      returnCents: input.returnCents,
      description: input.description?.trim() || null,
    },
  });

  return {
    id: created.id,
    sponsorId: created.sponsorId,
    sponsorName: sponsor.name,
    sponsorTier: sponsor.tier,
    date: created.date.toISOString(),
    title: created.title,
    category: created.category,
    reachCount: created.reachCount,
    returnCents: created.returnCents,
    description: created.description,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function deleteReturnActionService(
  teamId: string,
  input: DeleteReturnActionInput
) {
  const existing = await prisma.returnAction.findFirst({
    where: { id: input.id, teamId },
  });

  if (!existing) {
    throw new Error("Ação de retorno não encontrada na equipe.");
  }

  return prisma.returnAction.delete({
    where: { id: input.id },
  });
}

const FALLBACK_SYSTEM_USER: AuthenticatedUserDTO = {
  id: "system",
  sessionId: "system",
  name: "SuperAdmin Genesis",
  email: "superadmin@genesisracing.com",
  role: UserRole.SUPER_ADMIN,
  teamId: null,
  teamName: "Equipe Gênesis",
  deliveryGroup: DeliveryGroup.PROJECT_MANAGEMENT,
  jobTitle: "Team Principal & SuperAdmin",
};

export async function getDashboardMetricsService(
  currentUser?: AuthenticatedUserDTO | null
): Promise<DashboardMetricsDTO> {
  const effectiveUser = currentUser ?? FALLBACK_SYSTEM_USER;
  const { activeTeam, availableTeams } = await resolveActiveTeam(effectiveUser);

  // Isolamento Multi-Equipe: filtra estritamente pelo teamId da Equipe ativa!
  // Dentro da equipe, todos os 5 setores (Engenharia, Manufatura, Pit Display, Marketing, Gestão) se veem.
  const whereTeam = { teamId: activeTeam.id };

  const [
    rawCategories,
    rawBudgetResources,
    rawTransactions,
    rawMembers,
    rawSponsors,
    rawReturnActions,
  ] = await Promise.all([
    prisma.category.findMany({
      where: whereTeam,
      orderBy: [{ deliveryGroup: "asc" }, { name: "asc" }],
    }),
    prisma.budgetResource.findMany({
      where: whereTeam,
      include: {
        category: true,
        transactions: {
          where: { type: TransactionType.APPLICATION },
          select: { amountCents: true },
        },
      },
      orderBy: [{ plannedMonth: "asc" }, { code: "asc" }],
    }),
    prisma.transaction.findMany({
      where: whereTeam,
      include: {
        category: true,
        sponsor: {
          select: {
            id: true,
            name: true,
            tier: true,
          },
        },
        budgetResource: {
          select: {
            code: true,
            resourceName: true,
            acquisitionStrategy: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        OR: [{ teamId: activeTeam.id }, { role: UserRole.SUPER_ADMIN }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        deliveryGroup: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.sponsor.findMany({
      where: whereTeam,
      include: {
        transactions: {
          select: { amountCents: true },
        },
        returnActions: {
          select: { returnCents: true },
        },
      },
      orderBy: [{ tier: "desc" }, { name: "asc" }],
    }),
    prisma.returnAction.findMany({
      where: whereTeam,
      include: {
        sponsor: {
          select: {
            id: true,
            name: true,
            tier: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const categories: CategoryDTO[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    deliveryGroup: c.deliveryGroup,
  }));

  const teamMembers: TeamMemberOptionDTO[] = rawMembers.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    jobTitle: m.jobTitle,
    deliveryGroup: m.deliveryGroup,
  }));

  const budgetResources: BudgetResourceDTO[] = rawBudgetResources.map((b) => {
    const realizedAmountCents = b.transactions.reduce((acc, t) => acc + t.amountCents, 0);
    return {
      id: b.id,
      code: b.code,
      deliveryGroup: b.deliveryGroup,
      categoryId: b.categoryId,
      categoryName: b.category.name,
      resourceName: b.resourceName,
      acquisitionStrategy: b.acquisitionStrategy,
      allocatedTo: b.allocatedTo,
      plannedMonth: b.plannedMonth,
      utilizationForecast: b.utilizationForecast,
      plannedAmountCents: b.plannedAmountCents,
      realizedAmountCents,
      transactionsCount: b.transactions.length,
      createdAt: b.createdAt.toISOString(),
    };
  });

  const transactions: TransactionDTO[] = rawTransactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    referenceMonth: t.referenceMonth,
    type: t.type,
    deliveryGroup: t.deliveryGroup,
    categoryId: t.categoryId,
    categoryName: t.category.name,
    budgetResourceId: t.budgetResourceId,
    budgetResourceCode: t.budgetResource?.code ?? null,
    budgetResourceName: t.budgetResource?.resourceName ?? null,
    acquisitionStrategy: t.budgetResource?.acquisitionStrategy ?? null,
    description: t.description,
    trackingMethod: t.trackingMethod,
    documentRef: t.documentRef,
    amountCents: t.amountCents,
    sponsorId: t.sponsor?.id ?? null,
    sponsorName: t.sponsor?.name ?? null,
    sponsorTier: t.sponsor?.tier ?? null,
    createdAt: t.createdAt.toISOString(),
  }));

  const sponsors: SponsorDTO[] = rawSponsors.map((s) => ({
    id: s.id,
    name: s.name,
    tier: s.tier,
    contactName: s.contactName,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
  }));

  const sponsorRoiSummaries: SponsorRoiSummaryDTO[] = rawSponsors.map((s) => {
    const investedCents = s.transactions.reduce((acc, t) => acc + t.amountCents, 0);
    const deliveredReturnCents = s.returnActions.reduce(
      (acc, r) => acc + r.returnCents,
      0
    );
    const netReturnCents = deliveredReturnCents - investedCents;
    const roiPercent =
      investedCents > 0
        ? Math.round((netReturnCents / investedCents) * 100)
        : deliveredReturnCents > 0
        ? 100
        : 0;

    const returnMultiple =
      investedCents > 0
        ? `${(deliveredReturnCents / investedCents).toFixed(2)}x`
        : "0.00x";

    return {
      id: s.id,
      name: s.name,
      tier: s.tier,
      contactName: s.contactName,
      notes: s.notes,
      investedCents,
      deliveredReturnCents,
      netReturnCents,
      roiPercent,
      returnMultiple,
      transactionsCount: s.transactions.length,
      actionsCount: s.returnActions.length,
    };
  });

  const returnActions: ReturnActionDTO[] = rawReturnActions.map((r) => ({
    id: r.id,
    sponsorId: r.sponsorId,
    sponsorName: r.sponsor.name,
    sponsorTier: r.sponsor.tier,
    date: r.date.toISOString(),
    title: r.title,
    category: r.category,
    reachCount: r.reachCount,
    returnCents: r.returnCents,
    description: r.description,
    createdAt: r.createdAt.toISOString(),
  }));

  const seasonMonths = getSeasonMonthsFromTeam(activeTeam);
  const cashFlow = calculateCashFlowTimeline(transactions, seasonMonths);
  const schedule = calculatePhysicalFinancialSchedule(
    budgetResources,
    transactions,
    seasonMonths
  );

  const totalPlannedBudgetCents = budgetResources.reduce(
    (acc, b) => acc + b.plannedAmountCents,
    0
  );

  const kpis: DashboardKPIsDTO = {
    totalPlannedBudgetCents,
    totalOriginsCents: cashFlow.totalOriginsCents,
    totalApplicationsCents: cashFlow.totalApplicationsCents,
    currentCashBalanceCents: cashFlow.totalNetBalanceCents,
    totalResourcesCount: budgetResources.length,
    totalTransactionsCount: transactions.length,
  };

  return {
    currentUser: {
      ...effectiveUser,
      teamId: activeTeam.id,
      teamName: activeTeam.name,
    },
    activeTeam,
    availableTeams,
    kpis,
    cashFlow,
    schedule,
    categories,
    teamMembers,
    seasonMonths,
    budgetResources,
    transactions,
    sponsors,
    sponsorRoiSummaries,
    returnActions,
  };
}
