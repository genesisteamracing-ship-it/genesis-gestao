import { DeliveryGroup, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DELIVERY_GROUP_LABELS, PROJECT_MONTHS, PROJECT_MONTH_LABELS } from "@/lib/constants";
import type {
  CreateBudgetResourceInput,
  CreateTransactionInput,
} from "@/lib/validations/financial";
import type {
  BudgetResourceDTO,
  CashFlowMonthPoint,
  CashFlowSummaryDTO,
  CategoryDTO,
  DashboardKPIsDTO,
  DashboardMetricsDTO,
  DeliveryGroupScheduleRow,
  ScheduleAlertStatus,
  TransactionDTO,
} from "@/types/financial";

const ALL_DELIVERY_GROUPS: DeliveryGroup[] = [
  DeliveryGroup.ENGINEERING_CAD,
  DeliveryGroup.MANUFACTURING_CNC,
  DeliveryGroup.PIT_DISPLAY,
  DeliveryGroup.MARKETING_SPONSOR,
  DeliveryGroup.PROJECT_MANAGEMENT,
];

/**
 * Função utilitária pura: Cálculo do Fluxo de Caixa na Linha do Tempo (Meses 1 a 6)
 */
export function calculateCashFlowTimeline(
  transactions: Pick<TransactionDTO, "referenceMonth" | "type" | "amountCents">[]
): CashFlowSummaryDTO {
  let accumulatedBalanceCents = 0;
  let totalOriginsCents = 0;
  let totalApplicationsCents = 0;

  const months: CashFlowMonthPoint[] = PROJECT_MONTHS.map((month) => {
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
      monthLabel: PROJECT_MONTH_LABELS[month] ?? `Mês ${month}`,
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
 * Função utilitária pura: Cálculo do Cronograma Físico-Financeiro por DeliveryGroup e Mês
 */
export function calculatePhysicalFinancialSchedule(
  budgetResources: Pick<
    BudgetResourceDTO,
    "deliveryGroup" | "plannedMonth" | "plannedAmountCents"
  >[],
  transactions: Pick<
    TransactionDTO,
    "deliveryGroup" | "referenceMonth" | "type" | "amountCents"
  >[]
): DeliveryGroupScheduleRow[] {
  return ALL_DELIVERY_GROUPS.map((deliveryGroup) => {
    const months = PROJECT_MONTHS.map((month) => {
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
 * Gera código sequencial ORC-XXX com base nos registros existentes
 */
async function generateNextBudgetCode(): Promise<string> {
  const existingCodes = await prisma.budgetResource.findMany({
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

export async function createBudgetResourceService(input: CreateBudgetResourceInput) {
  const code = await generateNextBudgetCode();

  return prisma.budgetResource.create({
    data: {
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

export async function createTransactionService(input: CreateTransactionInput) {
  const cleanBudgetResourceId =
    input.budgetResourceId && input.budgetResourceId !== "NONE"
      ? input.budgetResourceId
      : null;

  const cleanDocRef =
    input.documentRef && input.documentRef.trim().length > 0
      ? input.documentRef.trim()
      : null;

  // Regra de Permuta (BARTER_PARTNERSHIP): gera automaticamente 1 ORIGIN (Patrocínio In-loco) e 1 APPLICATION (Custo do Recurso)
  if (input.isBarterCounterpart) {
    return prisma.$transaction(async (tx) => {
      const originEntry = await tx.transaction.create({
        data: {
          date: input.date,
          referenceMonth: input.referenceMonth,
          type: TransactionType.ORIGIN,
          deliveryGroup: input.deliveryGroup,
          categoryId: input.categoryId,
          budgetResourceId: cleanBudgetResourceId,
          description: `[PERMUTA - ORIGEM] ${input.description.trim()}`,
          trackingMethod: input.trackingMethod,
          documentRef: cleanDocRef,
          amountCents: input.amountCents,
        },
      });

      const applicationEntry = await tx.transaction.create({
        data: {
          date: input.date,
          referenceMonth: input.referenceMonth,
          type: TransactionType.APPLICATION,
          deliveryGroup: input.deliveryGroup,
          categoryId: input.categoryId,
          budgetResourceId: cleanBudgetResourceId,
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
      date: input.date,
      referenceMonth: input.referenceMonth,
      type: input.type,
      deliveryGroup: input.deliveryGroup,
      categoryId: input.categoryId,
      budgetResourceId: cleanBudgetResourceId,
      description: input.description.trim(),
      trackingMethod: input.trackingMethod,
      documentRef: cleanDocRef,
      amountCents: input.amountCents,
    },
  });

  return { transaction };
}

export async function getDashboardMetricsService(): Promise<DashboardMetricsDTO> {
  const [rawCategories, rawBudgetResources, rawTransactions] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ deliveryGroup: "asc" }, { name: "asc" }],
    }),
    prisma.budgetResource.findMany({
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
      include: {
        category: true,
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
  ]);

  const categories: CategoryDTO[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    deliveryGroup: c.deliveryGroup,
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
    createdAt: t.createdAt.toISOString(),
  }));

  const cashFlow = calculateCashFlowTimeline(transactions);
  const schedule = calculatePhysicalFinancialSchedule(budgetResources, transactions);

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
    kpis,
    cashFlow,
    schedule,
    categories,
    budgetResources,
    transactions,
  };
}
