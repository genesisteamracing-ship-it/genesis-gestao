import {
  ENGAGEMENT_LEVEL_LABELS,
  STAKEHOLDER_GROUP_LABELS,
} from "@/lib/communication-constants";
import type {
  StakeholderGroup,
  StakeholderWithRelations,
} from "@/types/communication";
import {
  STATEMENT_PDF_COLORS,
  type RgbColor,
} from "./financial-statement-pdf-layout";

/**
 * Paleta oficial Azul e Amarelo da Equipe Gênesis para cabeçalho e rodapé.
 */
export const STAKEHOLDERS_PDF_COLORS = STATEMENT_PDF_COLORS;

export type StakeholderQuadrantKey =
  | "KEEP_SATISFIED"
  | "MANAGE_CLOSELY"
  | "MONITOR"
  | "KEEP_INFORMED";

export type StakeholderRelationKind =
  | "NEGATIVE"
  | "POSITIVE"
  | "POTENTIAL_PARTNERSHIP";

export interface QuadrantVisualConfig {
  key: StakeholderQuadrantKey;
  title: string;
  bgColor: RgbColor;
  titlePosition: "top-left" | "bottom-left" | "bottom-right";
}

/**
 * Cores e posicionamentos fiéis ao modelo de Matriz Poder × Interesse.
 */
export const STAKEHOLDER_QUADRANT_CONFIG: Record<
  StakeholderQuadrantKey,
  QuadrantVisualConfig
> = {
  KEEP_SATISFIED: {
    key: "KEEP_SATISFIED",
    title: "Manter satisfeito",
    bgColor: [174, 219, 131], // Verde suave
    titlePosition: "top-left",
  },
  MANAGE_CLOSELY: {
    key: "MANAGE_CLOSELY",
    title: "Gerenciar de perto e envolver",
    bgColor: [249, 132, 132], // Vermelho / coral suave
    titlePosition: "top-left",
  },
  MONITOR: {
    key: "MONITOR",
    title: "Monitorar",
    bgColor: [253, 249, 156], // Amarelo claro
    titlePosition: "bottom-left",
  },
  KEEP_INFORMED: {
    key: "KEEP_INFORMED",
    title: "Manter informado",
    bgColor: [103, 213, 250], // Azul celeste
    titlePosition: "bottom-right",
  },
};

export const STAKEHOLDER_RELATION_COLORS: Record<
  StakeholderRelationKind,
  RgbColor
> = {
  NEGATIVE: [245, 180, 10], // Raio amarelo/ouro
  POSITIVE: [220, 38, 38], // Coração vermelho
  POTENTIAL_PARTNERSHIP: [13, 130, 146], // Ícone verde-azulado (teal)
};

export interface StakeholderMatrixCard {
  id: string;
  name: string;
  subtitle: string;
  groupLabel: string;
  relation: StakeholderRelationKind;
  engagementLabel: string;
  quadrant: StakeholderQuadrantKey;
}

export interface StakeholdersPdfData {
  teamDisplayName: string;
  filterLabel: string;
  totalStakeholders: number;
  relationCounts: {
    positive: number;
    negative: number;
    potential: number;
  };
  quadrants: Record<StakeholderQuadrantKey, StakeholderMatrixCard[]>;
}

export function resolveStakeholderQuadrant(
  power: StakeholderWithRelations["power"],
  interest: StakeholderWithRelations["interest"]
): StakeholderQuadrantKey {
  if (power === "HIGH" && interest === "HIGH") return "MANAGE_CLOSELY";
  if (power === "HIGH" && interest === "LOW") return "KEEP_SATISFIED";
  if (power === "LOW" && interest === "HIGH") return "KEEP_INFORMED";
  return "MONITOR";
}

export function resolveStakeholderRelation(
  engagement: StakeholderWithRelations["currentEngagement"]
): StakeholderRelationKind {
  if (engagement === "RESISTANT") return "NEGATIVE";
  if (engagement === "SUPPORTIVE" || engagement === "LEADING") {
    return "POSITIVE";
  }
  return "POTENTIAL_PARTNERSHIP";
}

/**
 * Constrói os dados estruturados da Matriz Poder × Interesse para exportação em PDF.
 */
export function buildStakeholdersPdfData({
  stakeholders,
  teamName,
  groupFilter,
}: {
  stakeholders: StakeholderWithRelations[];
  teamName?: string;
  groupFilter?: StakeholderGroup | "ALL";
}): StakeholdersPdfData {
  const teamDisplayName = teamName?.trim() || "Equipe Gênesis";
  const filterLabel =
    groupFilter && groupFilter !== "ALL"
      ? STAKEHOLDER_GROUP_LABELS[groupFilter]
      : "Todos os Grupos";

  const quadrants: Record<StakeholderQuadrantKey, StakeholderMatrixCard[]> = {
    KEEP_SATISFIED: [],
    MANAGE_CLOSELY: [],
    MONITOR: [],
    KEEP_INFORMED: [],
  };

  if (stakeholders.length === 0) {
    return {
      teamDisplayName,
      filterLabel,
      totalStakeholders: 0,
      relationCounts: { positive: 0, negative: 0, potential: 0 },
      quadrants,
    };
  }

  const sorted = [...stakeholders].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );

  let positive = 0;
  let negative = 0;
  let potential = 0;

  for (const item of sorted) {
    const quadrant = resolveStakeholderQuadrant(item.power, item.interest);
    const relation = resolveStakeholderRelation(item.currentEngagement);

    if (relation === "POSITIVE") positive += 1;
    else if (relation === "NEGATIVE") negative += 1;
    else potential += 1;

    const groupLabel = STAKEHOLDER_GROUP_LABELS[item.group] || item.group;
    const subtitleParts: string[] = [];
    if (item.organization?.trim()) subtitleParts.push(item.organization.trim());
    if (item.roleOrJobTitle?.trim()) {
      subtitleParts.push(item.roleOrJobTitle.trim());
    }

    quadrants[quadrant].push({
      id: item.id,
      name: item.name,
      subtitle: subtitleParts.join(" • ") || groupLabel,
      groupLabel,
      relation,
      engagementLabel: ENGAGEMENT_LEVEL_LABELS[item.currentEngagement],
      quadrant,
    });
  }

  return {
    teamDisplayName,
    filterLabel,
    totalStakeholders: sorted.length,
    relationCounts: { positive, negative, potential },
    quadrants,
  };
}

export function buildStakeholdersPdfFilename(
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

  return `matriz-stakeholders-${slug}-${yyyy}-${mm}-${dd}.pdf`;
}
