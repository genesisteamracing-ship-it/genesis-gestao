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

export interface QuadrantVisualConfig {
  key: StakeholderQuadrantKey;
  title: string;
  /** Cor de preenchimento translúcida (tint suave sobre branco) */
  bgColor: RgbColor;
  /** Borda sutil harmonizada com o quadrante */
  borderColor: RgbColor;
  /** Filete lateral discreto dos cards internos */
  accentColor: RgbColor;
  titlePosition: "top-left" | "bottom-left" | "bottom-right";
}

/**
 * Paleta translúcida e corporativa dos 4 quadrantes da Matriz Poder × Interesse.
 */
export const STAKEHOLDER_QUADRANT_CONFIG: Record<
  StakeholderQuadrantKey,
  QuadrantVisualConfig
> = {
  KEEP_SATISFIED: {
    key: "KEEP_SATISFIED",
    title: "Manter satisfeito",
    bgColor: [226, 243, 211], // Verde translúcido (~35% sobre branco)
    borderColor: [164, 209, 126],
    accentColor: [96, 158, 56],
    titlePosition: "top-left",
  },
  MANAGE_CLOSELY: {
    key: "MANAGE_CLOSELY",
    title: "Gerenciar de perto e envolver",
    bgColor: [253, 224, 224], // Coral/vermelho translúcido (~35% sobre branco)
    borderColor: [242, 150, 150],
    accentColor: [204, 68, 68],
    titlePosition: "top-left",
  },
  MONITOR: {
    key: "MONITOR",
    title: "Monitorar",
    bgColor: [254, 251, 214], // Amarelo translúcido (~35% sobre branco)
    borderColor: [232, 214, 114],
    accentColor: [194, 154, 24],
    titlePosition: "bottom-left",
  },
  KEEP_INFORMED: {
    key: "KEEP_INFORMED",
    title: "Manter informado",
    bgColor: [215, 243, 253], // Azul celeste translúcido (~35% sobre branco)
    borderColor: [122, 206, 240],
    accentColor: [29, 95, 214],
    titlePosition: "bottom-right",
  },
};

export interface StakeholderMatrixCard {
  id: string;
  name: string;
  subtitle: string;
  groupLabel: string;
  engagementLabel: string;
  quadrant: StakeholderQuadrantKey;
}

export interface StakeholdersPdfData {
  teamDisplayName: string;
  filterLabel: string;
  totalStakeholders: number;
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
      quadrants,
    };
  }

  const sorted = [...stakeholders].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );

  for (const item of sorted) {
    const quadrant = resolveStakeholderQuadrant(item.power, item.interest);
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
      engagementLabel: ENGAGEMENT_LEVEL_LABELS[item.currentEngagement],
      quadrant,
    });
  }

  return {
    teamDisplayName,
    filterLabel,
    totalStakeholders: sorted.length,
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
