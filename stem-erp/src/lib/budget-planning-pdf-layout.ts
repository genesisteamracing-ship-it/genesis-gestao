import {
  ACQUISITION_STRATEGY_LABELS,
  DELIVERY_GROUP_LABELS,
} from "@/lib/constants";
import type { AppLocale } from "@/lib/i18n/locale-types";
import { translateUiText } from "@/lib/i18n/translations";
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
}

export interface BudgetPlanningData {
  teamDisplayName: string;
  scopeLabel: string;
  totalPlannedCents: number;
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

const SHORT_STRATEGY_LABELS_EN: Record<
  BudgetResourceDTO["acquisitionStrategy"],
  string
> = {
  DIRECT_PURCHASE: "Direct Purchase",
  FINANCIAL_SPONSOR: "Sponsorship",
  BARTER_PARTNERSHIP: "Barter",
  OWN_FUNDS_RAFFLE: "Own Funds",
};

function resolveMonthLabel(
  month: number,
  monthLabels?: Record<number, string>,
  locale: AppLocale = "pt-BR"
): string {
  const raw = monthLabels?.[month] ?? `Mês ${month}`;
  return locale === "en-US" ? translateUiText(raw, locale) : raw;
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
  locale = "pt-BR",
}: {
  resources: BudgetResourceDTO[];
  teamName?: string;
  seasonLabel?: string;
  monthLabels?: Record<number, string>;
  locale?: AppLocale;
}): BudgetPlanningData {
  const isEn = locale === "en-US";
  const teamDisplayName = teamName?.trim() || "Equipe Gênesis";

  if (resources.length === 0) {
    return {
      teamDisplayName,
      scopeLabel:
        seasonLabel?.trim() ||
        (isEn ? "No planned resources" : "Sem recursos planejados"),
      totalPlannedCents: 0,
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
  let groupPlannedCents = 0;
  let minMonth = Number.POSITIVE_INFINITY;
  let maxMonth = Number.NEGATIVE_INFINITY;
  const rows: BudgetPlanningRow[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const item = sorted[i];
    totalPlannedCents += item.plannedAmountCents;
    groupPlannedCents += item.plannedAmountCents;

    if (item.plannedMonth < minMonth) minMonth = item.plannedMonth;
    if (item.plannedMonth > maxMonth) maxMonth = item.plannedMonth;

    const rawSectorLabel =
      DELIVERY_GROUP_LABELS[item.deliveryGroup] || item.deliveryGroup;
    const sectorLabel = isEn
      ? translateUiText(rawSectorLabel, locale)
      : rawSectorLabel;
    const strategyLabel = isEn
      ? SHORT_STRATEGY_LABELS_EN[item.acquisitionStrategy] ||
        translateUiText(
          ACQUISITION_STRATEGY_LABELS[item.acquisitionStrategy] ||
            item.acquisitionStrategy,
          locale
        )
      : SHORT_STRATEGY_LABELS[item.acquisitionStrategy] ||
        ACQUISITION_STRATEGY_LABELS[item.acquisitionStrategy] ||
        item.acquisitionStrategy;

    const allocatedLabel = isEn
      ? translateUiText(item.allocatedTo, locale)
      : item.allocatedTo;

    const secondaryParts = [
      sectorLabel,
      item.categoryName,
      `${isEn ? "Owner" : "Resp."}: ${allocatedLabel}`,
      `${item.utilizationForecast}% ${isEn ? "usage" : "uso"}`,
    ];

    rows.push({
      kind: "RESOURCE",
      code: item.code,
      monthLabel: resolveMonthLabel(item.plannedMonth, monthLabels, locale),
      strategyLabel,
      resourcePrimary: item.resourceName,
      resourceSecondary: secondaryParts.join(" • "),
      plannedFormatted: formatCurrencyBRL(item.plannedAmountCents),
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
      });
      groupPlannedCents = 0;
    }
  }

  rows.push({
    kind: "FINAL_TOTAL",
    code: "",
    monthLabel: "",
    strategyLabel: "",
    resourcePrimary: isEn
      ? "T O T A L   B U D G E T"
      : "T O T A L   O R Ç A D O",
    resourceSecondary: "",
    plannedFormatted: formatCurrencyBRL(totalPlannedCents),
  });

  const derivedPeriod =
    minMonth === maxMonth
      ? resolveMonthLabel(minMonth, monthLabels, locale)
      : `${resolveMonthLabel(minMonth, monthLabels, locale)} ${isEn ? "to" : "a"} ${resolveMonthLabel(maxMonth, monthLabels, locale)}`;

  const scopeLabel = seasonLabel?.trim()
    ? isEn
      ? translateUiText(seasonLabel.trim(), locale)
      : seasonLabel.trim()
    : derivedPeriod;

  return {
    teamDisplayName,
    scopeLabel,
    totalPlannedCents,
    resourceCount: sorted.length,
    rows,
  };
}

export function buildBudgetPlanningFilename(
  teamName?: string,
  date = new Date(),
  locale: AppLocale = "pt-BR"
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
  const prefix =
    locale === "en-US" ? "budget-planning" : "orcamento-planejamento";

  return `${prefix}-${slug}-${yyyy}-${mm}-${dd}.pdf`;
}
