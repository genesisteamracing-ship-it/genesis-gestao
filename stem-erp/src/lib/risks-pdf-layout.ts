import { DELIVERY_GROUP_SHORT_LABELS } from "@/lib/constants";
import {
  RISK_CONSEQUENCE_LABELS,
  RISK_ENTRY_TYPE_LABELS,
  RISK_PRIORITY_LABELS,
  RISK_PROBABILITY_LABELS,
  RISK_STATUS_LABELS,
} from "@/lib/risk-matrix";
import type { RiskItemDTO } from "@/types/risks";
import {
  STATEMENT_PDF_COLORS,
  type RgbColor,
} from "./financial-statement-pdf-layout";

/**
 * Reutiliza a paleta oficial Azul e Amarelo da Equipe Gênesis (padrão dos PDFs).
 */
export const RISKS_PDF_COLORS = STATEMENT_PDF_COLORS;

export type RiskBadgeTone = "red" | "amber" | "blue" | "green" | "neutral";

export const RISK_PDF_BADGE_STYLES: Record<
  RiskBadgeTone,
  { fill: RgbColor; border: RgbColor; text: RgbColor }
> = {
  red: {
    fill: [254, 242, 242],
    border: [220, 38, 38],
    text: [185, 28, 28],
  },
  amber: {
    fill: [255, 251, 235],
    border: [217, 119, 6],
    text: [180, 83, 9],
  },
  blue: {
    fill: [239, 246, 255],
    border: [29, 95, 214],
    text: [15, 61, 140],
  },
  green: {
    fill: [236, 253, 245],
    border: [5, 150, 105],
    text: [4, 120, 87],
  },
  neutral: {
    fill: [241, 245, 249],
    border: [148, 163, 184],
    text: [71, 85, 105],
  },
};

export interface RiskPdfRow {
  sectorLabel: string;
  probabilityLabel: string;
  probabilityTone: RiskBadgeTone;
  consequenceLabel: string;
  consequenceTone: RiskBadgeTone;
  title: string;
  subtitle: string;
  priorityLabel: string;
  priorityTone: RiskBadgeTone;
  observations: string;
}

export interface RisksPdfData {
  teamDisplayName: string;
  seasonLabel: string;
  totalCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  rows: RiskPdfRow[];
}

const PROBABILITY_TONE_MAP: Record<RiskItemDTO["probability"], RiskBadgeTone> = {
  QUASE_CERTO: "red",
  PROVAVEL: "red",
  POSSIVEL: "amber",
  IMPROVAVEL: "green",
  RARA: "green",
  NONE: "neutral",
};

const CONSEQUENCE_TONE_MAP: Record<RiskItemDTO["consequence"], RiskBadgeTone> = {
  CATASTROFICA: "red",
  GRANDE: "red",
  MODERADA: "amber",
  PEQUENA: "green",
  DESPREZIVEL: "green",
  NONE: "neutral",
};

const PRIORITY_TONE_MAP: Record<RiskItemDTO["priorityLevel"], RiskBadgeTone> = {
  CRITICAL: "red",
  HIGH: "amber",
  MEDIUM: "blue",
  LOW: "green",
  UNASSESSED: "neutral",
};

function resolveObservations(item: RiskItemDTO): string {
  return (
    item.observations?.trim() ||
    item.proactiveStrategy?.trim() ||
    item.contingencyPlan?.trim() ||
    item.evidenceNotes?.trim() ||
    "—"
  );
}

/**
 * Constrói os dados estruturados da Tabela de Riscos & Oportunidades para PDF:
 * - Ordena por prioridade (score decrescente), setor e nome
 * - Preserva exatamente as 6 colunas da tabela da interface
 * - Consolida contadores por severidade (Crítico, Alto, Médio, Baixo)
 */
export function buildRisksPdfData({
  items,
  teamName,
  seasonLabel,
}: {
  items: RiskItemDTO[];
  teamName?: string;
  seasonLabel?: string;
}): RisksPdfData {
  const teamDisplayName = teamName?.trim() || "Equipe Gênesis";
  const resolvedSeason = seasonLabel?.trim() || items[0]?.season || "Temporada Atual";

  if (items.length === 0) {
    return {
      teamDisplayName,
      seasonLabel: resolvedSeason,
      totalCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      rows: [],
    };
  }

  const sorted = [...items].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    const sectorA = DELIVERY_GROUP_SHORT_LABELS[a.sector] ?? a.sector;
    const sectorB = DELIVERY_GROUP_SHORT_LABELS[b.sector] ?? b.sector;
    const sectorDiff = sectorA.localeCompare(sectorB, "pt-BR");
    if (sectorDiff !== 0) return sectorDiff;
    return a.title.localeCompare(b.title, "pt-BR");
  });

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  const rows: RiskPdfRow[] = sorted.map((item) => {
    if (item.priorityLevel === "CRITICAL") criticalCount += 1;
    else if (item.priorityLevel === "HIGH") highCount += 1;
    else if (item.priorityLevel === "MEDIUM") mediumCount += 1;
    else if (item.priorityLevel === "LOW") lowCount += 1;

    const subtitleParts = [
      RISK_ENTRY_TYPE_LABELS[item.entryType],
      RISK_STATUS_LABELS[item.status],
    ];
    if (item.reviewsCount > 0) {
      subtitleParts.push(`${item.reviewsCount} revisão(ões)`);
    }

    return {
      sectorLabel: DELIVERY_GROUP_SHORT_LABELS[item.sector] || item.sector,
      probabilityLabel: RISK_PROBABILITY_LABELS[item.probability],
      probabilityTone: PROBABILITY_TONE_MAP[item.probability],
      consequenceLabel: RISK_CONSEQUENCE_LABELS[item.consequence],
      consequenceTone: CONSEQUENCE_TONE_MAP[item.consequence],
      title: item.title,
      subtitle: subtitleParts.join(" · "),
      priorityLabel: RISK_PRIORITY_LABELS[item.priorityLevel],
      priorityTone: PRIORITY_TONE_MAP[item.priorityLevel],
      observations: resolveObservations(item),
    };
  });

  return {
    teamDisplayName,
    seasonLabel: resolvedSeason,
    totalCount: sorted.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    rows,
  };
}

export function buildRisksPdfFilename(
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

  return `matriz-riscos-${slug}-${yyyy}-${mm}-${dd}.pdf`;
}
