import {
  DELIVERY_GROUP_LABELS,
  TRACKING_METHOD_LABELS,
} from "@/lib/constants";
import type { TransactionDTO } from "@/types/financial";

export type RgbColor = readonly [number, number, number];

/**
 * Paleta oficial Azul e Amarelo da Equipe Gênesis no estilo Extrato Bancário.
 */
export const STATEMENT_PDF_COLORS = {
  brandBlue: [29, 95, 214] as RgbColor, // Azul principal Gênesis (#1D5FD6)
  brandNavy: [15, 61, 140] as RgbColor, // Azul marinho profundo (#0F3D8C)
  brandYellow: [245, 208, 26] as RgbColor, // Amarelo ouro vibrante (#F5D01A)
  sectionBarBg: [241, 245, 249] as RgbColor, // Faixa cinza-azulada clara
  rowEvenBg: [255, 255, 255] as RgbColor,
  rowOddBg: [249, 250, 251] as RgbColor,
  dailyBalanceBg: [241, 245, 249] as RgbColor,
  finalBalanceBg: [239, 246, 255] as RgbColor,
  dividerLine: [226, 232, 240] as RgbColor,
  textPrimary: [24, 24, 27] as RgbColor,
  textSecondary: [100, 116, 139] as RgbColor,
  positiveValue: [15, 61, 140] as RgbColor,
  negativeValue: [185, 28, 28] as RgbColor,
  white: [255, 255, 255] as RgbColor,
} as const;

export type StatementRowKind = "TRANSACTION" | "DAILY_BALANCE" | "FINAL_BALANCE";

export interface FinancialStatementRow {
  kind: StatementRowKind;
  dateLabel: string;
  methodLabel: string;
  nfeCode: string;
  historyPrimary: string;
  historySecondary: string;
  amountFormatted: string;
  isNegative: boolean;
}

export interface FinancialStatementData {
  teamDisplayName: string;
  periodLabel: string;
  totalEntriesCents: number;
  totalExitsCents: number;
  finalBalanceCents: number;
  transactionCount: number;
  rows: FinancialStatementRow[];
}

const SHORT_METHOD_LABELS: Record<TransactionDTO["trackingMethod"], string> = {
  NFE: "NF-e",
  RECEIPT: "Recibo",
  SPONSOR_CONTRACT: "Contrato",
  BANK_PIX_STATEMENT: "PIX / Extrato",
};

function toDayKey(rawDate: string | Date): string {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "0000-00-00";
  return date.toISOString().slice(0, 10);
}

function formatDayBR(dayKey: string): string {
  const [year, month, day] = dayKey.split("-");
  if (!year || !month || !day) return dayKey;
  return `${day}/${month}/${year}`;
}

/**
 * Formata centavos no estilo de extrato bancário brasileiro:
 * ex: 15000 positivo -> "150,00 (+)", 45000 negativo -> "450,00 (-)".
 */
export function formatStatementAmount(
  amountCents: number,
  sign: "positive" | "negative"
): string {
  const absReais = Math.abs(amountCents) / 100;
  const formatted = absReais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} (${sign === "positive" ? "+" : "-"})`;
}

export function formatCurrencyBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Constrói os dados estruturados do Extrato Financeiro da Equipe Gênesis:
 * - Ordena cronologicamente por data
 * - Inclui coluna dedicada ao Código da NF-e (`documentRef`)
 * - Insere linhas de "Saldo do dia" ao final de cada data
 * - Insere linha consolidada "S A L D O" ao final do extrato
 */
export function buildFinancialStatementData({
  transactions,
  teamName,
}: {
  transactions: TransactionDTO[];
  teamName?: string;
}): FinancialStatementData {
  const teamDisplayName = teamName?.trim() || "Equipe Gênesis";

  if (transactions.length === 0) {
    return {
      teamDisplayName,
      periodLabel: "Sem lançamentos no período",
      totalEntriesCents: 0,
      totalExitsCents: 0,
      finalBalanceCents: 0,
      transactionCount: 0,
      rows: [],
    };
  }

  // Ordenação cronológica crescente (padrão de extrato bancário)
  const sorted = [...transactions].sort((a, b) => {
    const keyA = toDayKey(a.date);
    const keyB = toDayKey(b.date);
    if (keyA !== keyB) return keyA.localeCompare(keyB);
    return a.id.localeCompare(b.id);
  });

  let runningBalanceCents = 0;
  let totalEntriesCents = 0;
  let totalExitsCents = 0;
  const rows: FinancialStatementRow[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const tx = sorted[i];
    const dayKey = toDayKey(tx.date);
    const dateLabel = formatDayBR(dayKey);
    const isOrigin = tx.type === "ORIGIN";

    if (isOrigin) {
      runningBalanceCents += tx.amountCents;
      totalEntriesCents += tx.amountCents;
    } else {
      runningBalanceCents -= tx.amountCents;
      totalExitsCents += tx.amountCents;
    }

    const sectorLabel = DELIVERY_GROUP_LABELS[tx.deliveryGroup] || tx.deliveryGroup;
    const methodLabel =
      SHORT_METHOD_LABELS[tx.trackingMethod] ||
      TRACKING_METHOD_LABELS[tx.trackingMethod] ||
      tx.trackingMethod;

    const cleanNfeCode = tx.documentRef?.trim() ? tx.documentRef.trim() : "—";

    const secondaryParts = [sectorLabel, tx.categoryName];
    if (tx.budgetResourceCode) {
      secondaryParts.push(tx.budgetResourceCode);
    }

    rows.push({
      kind: "TRANSACTION",
      dateLabel,
      methodLabel,
      nfeCode: cleanNfeCode,
      historyPrimary: tx.description,
      historySecondary: secondaryParts.join(" • "),
      amountFormatted: formatStatementAmount(
        tx.amountCents,
        isOrigin ? "positive" : "negative"
      ),
      isNegative: !isOrigin,
    });

    // Se for o último lançamento do dia, insere linha "Saldo do dia"
    const nextDayKey = i + 1 < sorted.length ? toDayKey(sorted[i + 1].date) : null;
    if (nextDayKey !== dayKey) {
      rows.push({
        kind: "DAILY_BALANCE",
        dateLabel,
        methodLabel: "",
        nfeCode: "",
        historyPrimary: "Saldo do dia",
        historySecondary: "",
        amountFormatted: formatStatementAmount(
          runningBalanceCents,
          runningBalanceCents >= 0 ? "positive" : "negative"
        ),
        isNegative: runningBalanceCents < 0,
      });
    }
  }

  const firstDay = toDayKey(sorted[0].date);
  const lastDay = toDayKey(sorted[sorted.length - 1].date);

  // Linha final consolidada "S A L D O"
  rows.push({
    kind: "FINAL_BALANCE",
    dateLabel: formatDayBR(lastDay),
    methodLabel: "",
    nfeCode: "",
    historyPrimary: "S A L D O",
    historySecondary: "",
    amountFormatted: formatStatementAmount(
      runningBalanceCents,
      runningBalanceCents >= 0 ? "positive" : "negative"
    ),
    isNegative: runningBalanceCents < 0,
  });

  const periodLabel =
    firstDay === lastDay
      ? formatDayBR(firstDay)
      : `${formatDayBR(firstDay)} a ${formatDayBR(lastDay)}`;

  return {
    teamDisplayName,
    periodLabel,
    totalEntriesCents,
    totalExitsCents,
    finalBalanceCents: runningBalanceCents,
    transactionCount: sorted.length,
    rows,
  };
}

export function buildFinancialStatementFilename(
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

  return `extrato-financeiro-${slug}-${yyyy}-${mm}-${dd}.pdf`;
}
