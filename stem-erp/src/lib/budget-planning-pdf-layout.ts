import {
  ACQUISITION_STRATEGY_LABELS,
  DELIVERY_GROUP_LABELS,
} from "@/lib/constants";
import type { BudgetResourceDTO } from "@/types/financial";
import {
  formatCurrencyBRL,
  STATEMENT_PDF_COLORS,
} from "./financial-statement-pdf-layout";

/**
 * Reutiliza a paleta oficial Azul e Amarelo da Equipe Gênesis do Livro Caixa.
 */
export const BUDGET_PDF_COLORS = STATEMENT_PDF_COLORS;

export type BudgetPdfRowKind = "RESOURCE" | "GROUP_SUBTOTAL" | "FINAL_TOTAL";

export interface BudgetPlanningRow {
  kind: BudgetPdfRowKind;
  code: string;
  monthLabel: string;
  strategyLabel: string;
  resourcePrimary: string;
  resourceSecondary: string;
  plannedFormatted: string;
  realizedFormatted: string;
  isExceeded: boolean;
}

export interface BudgetPlanningData {
  teamDisplayName: string;
  scopeLabel: string;
  totalPlannedCents: number;
  totalRealizedCents: number;
  varianceCents: number;
  executionPercent: number;
  resourceCount: number;
  rows: BudgetPlanningRow[];
}

const DELIVERY_GROUP_ORDER: Record<BudgetResourceDTO["deliveryGroup"], number> = {
  ENGINEERING_CAD: 0,
  MANUFACTURING_CNC: 1,
  PIT_DISPLAY: 2,
  MARKETING_SPONSOR: 3,
  PROJECT_MANAGEMENT: 4,
  SOCIAL_PROJECT: 5,
};

const SHORT_STRATEGY_LABELS: Record<
  BudgetResourceDTO["acquisitionStrategy"],
  string
> = {
  DIRECT_PURCHASE: "Compra Direta",
  FINANCIAL_SPONSOR: "Patrocínio",
  BARTER_PARTNERSHIP: "Permuta",
  OWN_FUNDS_RAFFLE: "Rec. Próprios",
};

function resolveMonthLabel(
  month: number,
  monthLabels?: Record<number, string>
): string {
  return monthLabels?.[month] ?? `Mês ${month}`;
}

/**
 * Constrói os dados estruturados do Relatório de Planejamento Orçamentário da Equipe Gênesis:
 * - Agrupa por Grupo de Entrega (Setor), ordenado por mês planejado e código
 * - Insere linha de "Subtotal • <Setor>" ao final de cada grupo
 * - Insere linha consolidada "T O T A L   O R Ç A D O" ao final do documento
 */
export function buildBudgetPlanningData({
  resources,
  teamName,
  seasonLabel,
  monthLabels,
}: {
  resources: BudgetResourceDTO[];
  teamName?: string;
  seasonLabel?: string;
  monthLabels?: Record<number, string>;
}): BudgetPlanningData {
  const teamDisplayName = teamName?.trim() || "Equipe Gênesis";

  if (resources.length === 0) {
    return {
      teamDisplayName,
      scopeLabel: seasonLabel?.trim() || "Sem recursos planejados",
      totalPlannedCents: 0,
      totalRealizedCents: 0,
      varianceCents: 0,
      executionPercent: 0,
      resourceCount: 0,
      rows: [],
    };
  }

  const sorted = [...resources].sort((a, b) => {
    const groupDiff =
      (DELIVERY_GROUP_ORDER[a.deliveryGroup] ?? 99) -
      (DELIVERY_GROUP_ORDER[b.deliveryGroup] ?? 99);
    if (groupDiff !== 0) return groupDiff;
    if (a.plannedMonth !== b.plannedMonth) {
      return a.plannedMonth - b.plannedMonth;
    }
    return a.code.localeCompare(b.code, "pt-BR");
  });

  let totalPlannedCents = 0;
  let totalRealizedCents = 0;
  let groupPlannedCents = 0;
  let groupRealizedCents = 0;
  let minMonth = Number.POSITIVE_INFINITY;
  let maxMonth = Number.NEGATIVE_INFINITY;
  const rows: BudgetPlanningRow[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const item = sorted[i];
    totalPlannedCents += item.plannedAmountCents;
    totalRealizedCents += item.realizedAmountCents;
    groupPlannedCents += item.plannedAmountCents;
    groupRealizedCents += item.realizedAmountCents;

    if (item.plannedMonth < minMonth) minMonth = item.plannedMonth;
    if (item.plannedMonth > maxMonth) maxMonth = item.plannedMonth;

    const sectorLabel =
      DELIVERY_GROUP_LABELS[item.deliveryGroup] || item.deliveryGroup;
    const strategyLabel =
      SHORT_STRATEGY_LABELS[item.acquisitionStrategy] ||
      ACQUISITION_STRATEGY_LABELS[item.acquisitionStrategy] ||
      item.acquisitionStrategy;

    const secondaryParts = [
      sectorLabel,
      item.categoryName,
      `Resp.: ${item.allocatedTo}`,
      `${item.utilizationForecast}% uso`,
    ];

    rows.push({
      kind: "RESOURCE",
      code: item.code,
      monthLabel: resolveMonthLabel(item.plannedMonth, monthLabels),
      strategyLabel,
      resourcePrimary: item.resourceName,
      resourceSecondary: secondaryParts.join(" • "),
      plannedFormatted: formatCurrencyBRL(item.plannedAmountCents),
      realizedFormatted: formatCurrencyBRL(item.realizedAmountCents),
      isExceeded: item.realizedAmountCents > item.plannedAmountCents,
    });

    const nextGroup =
      i + 1 < sorted.length ? sorted[i + 1].deliveryGroup : null;
    if (nextGroup !== item.deliveryGroup) {
      rows.push({
        kind: "GROUP_SUBTOTAL",
        code: "",
        monthLabel: "",
        strategyLabel: "",
        resourcePrimary: `Subtotal • ${sectorLabel}`,
        resourceSecondary: "",
        plannedFormatted: formatCurrencyBRL(groupPlannedCents),
        realizedFormatted: formatCurrencyBRL(groupRealizedCents),
        isExceeded: groupRealizedCents > groupPlannedCents,
      });
      groupPlannedCents = 0;
      groupRealizedCents = 0;
    }
  }

  rows.push({
    kind: "FINAL_TOTAL",
    code: "",
    monthLabel: "",
    strategyLabel: "",
    resourcePrimary: "T O T A L   O R Ç A D O",
    resourceSecondary: "",
    plannedFormatted: formatCurrencyBRL(totalPlannedCents),
    realizedFormatted: formatCurrencyBRL(totalRealizedCents),
    isExceeded: totalRealizedCents > totalPlannedCents,
  });

  const derivedPeriod =
    minMonth === maxMonth
      ? resolveMonthLabel(minMonth, monthLabels)
      : `${resolveMonthLabel(minMonth, monthLabels)} a ${resolveMonthLabel(maxMonth, monthLabels)}`;

  const scopeLabel = seasonLabel?.trim() || derivedPeriod;
  const varianceCents = totalPlannedCents - totalRealizedCents;
  const executionPercent =
    totalPlannedCents > 0
      ? Math.round((totalRealizedCents / totalPlannedCents) * 100)
      : 0;

  return {
    teamDisplayName,
    scopeLabel,
    totalPlannedCents,
    totalRealizedCents,
    varianceCents,
    executionPercent,
    resourceCount: sorted.length,
    rows,
  };
}

export function buildBudgetPlanningFilename(
  teamName?: string,
  date = new Date()
): string {
  const slug =
    (teamName || "equipe-genesis")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "equipe-genesis";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `orcamento-planejamento-${slug}-${yyyy}-${mm}-${dd}.pdf`;
}
