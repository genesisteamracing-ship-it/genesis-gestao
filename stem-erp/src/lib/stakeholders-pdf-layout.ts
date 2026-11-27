import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_FREQUENCY_LABELS,
  ENGAGEMENT_LEVEL_LABELS,
  HIERARCHY_TIER_META,
  STAKEHOLDER_GROUP_LABELS,
} from "@/lib/communication-constants";
import { computeHierarchyTier } from "@/lib/communication-hierarchy";
import type {
  CommunicationChannel,
  CommunicationFrequency,
  StakeholderGroup,
  StakeholderWithRelations,
} from "@/types/communication";
import { STATEMENT_PDF_COLORS } from "./financial-statement-pdf-layout";

/**
 * Reutiliza a paleta oficial Azul e Amarelo da Equipe Gênesis (padrão dos PDFs).
 */
export const STAKEHOLDERS_PDF_COLORS = STATEMENT_PDF_COLORS;

export type StakeholderPdfRowKind =
  | "STAKEHOLDER"
  | "GROUP_SUBTOTAL"
  | "FINAL_TOTAL";

export type EngagementTone = "positive" | "negative" | "neutral";

export interface StakeholderPdfRow {
  kind: StakeholderPdfRowKind;
  stakeholderPrimary: string;
  stakeholderSecondary: string;
  contactPrimary: string;
  contactSecondary: string;
  matrixPrimary: string;
  matrixSecondary: string;
  engagementPrimary: string;
  engagementSecondary: string;
  engagementTone: EngagementTone;
  channelPrimary: string;
  channelSecondary: string;
}

export interface StakeholdersPdfData {
  teamDisplayName: string;
  filterLabel: string;
  totalStakeholders: number;
  highPowerCount: number;
  activeGroupCount: number;
  rows: StakeholderPdfRow[];
}

const GROUP_ORDER: Record<StakeholderGroup, number> = {
  SPONSORS: 0,
  SCHOOL_LEADERSHIP: 1,
  TECHNICAL_MENTORS: 2,
  COMPETITION_OFFICIALS: 3,
  PARENTS_GUARDIANS: 4,
  COMMUNITY_FANS: 5,
};

const SHORT_CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  MEETING: "Reunião",
  REPORT_PDF: "Relatório PDF",
};

const SHORT_FREQUENCY_LABELS: Record<CommunicationFrequency, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  MILESTONE_EVENT: "Pós-Marco",
};

function getEngagementTone(
  engagement: StakeholderWithRelations["currentEngagement"]
): EngagementTone {
  if (engagement === "LEADING" || engagement === "SUPPORTIVE") {
    return "positive";
  }
  if (engagement === "RESISTANT") {
    return "negative";
  }
  return "neutral";
}

/**
 * Constrói os dados estruturados do Relatório de Stakeholders em PDF:
 * - Agrupa por Grupo de Stakeholder, ordenado por Nível Hierárquico (Poder x Interesse) e Nome
 * - Insere linha de "Subtotal • <Grupo>" ao final de cada grupo
 * - Insere linha consolidada "T O T A L   D E   S T A K E H O L D E R S" ao final
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

  if (stakeholders.length === 0) {
    return {
      teamDisplayName,
      filterLabel,
      totalStakeholders: 0,
      highPowerCount: 0,
      activeGroupCount: 0,
      rows: [],
    };
  }

  const sorted = [...stakeholders].sort((a, b) => {
    const groupDiff = (GROUP_ORDER[a.group] ?? 99) - (GROUP_ORDER[b.group] ?? 99);
    if (groupDiff !== 0) return groupDiff;

    const rankA = computeHierarchyTier(a.power, a.interest).rankWeight;
    const rankB = computeHierarchyTier(b.power, b.interest).rankWeight;
    if (rankA !== rankB) return rankB - rankA;

    return a.name.localeCompare(b.name, "pt-BR");
  });

  const activeGroups = new Set<StakeholderGroup>();
  let highPowerCount = 0;
  let groupCount = 0;
  let groupHighPower = 0;
  const rows: StakeholderPdfRow[] = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const item = sorted[i];
    activeGroups.add(item.group);
    groupCount += 1;

    if (item.power === "HIGH") {
      highPowerCount += 1;
      groupHighPower += 1;
    }

    const { tier } = computeHierarchyTier(item.power, item.interest);
    const tierMeta = HIERARCHY_TIER_META[tier];

    const secondaryParts: string[] = [];
    if (item.organization) secondaryParts.push(item.organization);
    if (item.roleOrJobTitle) secondaryParts.push(item.roleOrJobTitle);
    if (item.sponsor) {
      secondaryParts.push(`Patrocinador ${item.sponsor.tier}`);
    }

    const contactPrimary = item.email?.trim() || item.phone?.trim() || "—";
    const contactSecondary =
      item.email?.trim() && item.phone?.trim() ? item.phone.trim() : "";

    const powerShort = item.power === "HIGH" ? "Alto" : "Baixo";
    const interestShort = item.interest === "HIGH" ? "Alto" : "Baixo";

    const currentLabel = ENGAGEMENT_LEVEL_LABELS[item.currentEngagement];
    const targetLabel = ENGAGEMENT_LEVEL_LABELS[item.targetEngagement];
    const engagementSecondary =
      item.targetEngagement !== item.currentEngagement
        ? `Meta: ${targetLabel}`
        : "";

    const channelPrimary =
      SHORT_CHANNEL_LABELS[item.preferredChannel] ||
      COMMUNICATION_CHANNEL_LABELS[item.preferredChannel];
    const channelSecondary =
      SHORT_FREQUENCY_LABELS[item.preferredFrequency] ||
      COMMUNICATION_FREQUENCY_LABELS[item.preferredFrequency];

    rows.push({
      kind: "STAKEHOLDER",
      stakeholderPrimary: item.name,
      stakeholderSecondary: secondaryParts.join(" • "),
      contactPrimary,
      contactSecondary,
      matrixPrimary: tierMeta.shortLabel,
      matrixSecondary: `Poder: ${powerShort} • Int.: ${interestShort}`,
      engagementPrimary: currentLabel,
      engagementSecondary,
      engagementTone: getEngagementTone(item.currentEngagement),
      channelPrimary,
      channelSecondary,
    });

    const nextGroup = i + 1 < sorted.length ? sorted[i + 1].group : null;
    if (nextGroup !== item.group) {
      const groupLabel = STAKEHOLDER_GROUP_LABELS[item.group] || item.group;
      rows.push({
        kind: "GROUP_SUBTOTAL",
        stakeholderPrimary: `Subtotal • ${groupLabel}`,
        stakeholderSecondary: "",
        contactPrimary: "",
        contactSecondary: "",
        matrixPrimary: `${groupHighPower} alto poder`,
        matrixSecondary: "",
        engagementPrimary: "",
        engagementSecondary: "",
        engagementTone: "neutral",
        channelPrimary: `${groupCount} ${groupCount === 1 ? "cadastro" : "cadastros"}`,
        channelSecondary: "",
      });
      groupCount = 0;
      groupHighPower = 0;
    }
  }

  rows.push({
    kind: "FINAL_TOTAL",
    stakeholderPrimary: "T O T A L   D E   S T A K E H O L D E R S",
    stakeholderSecondary: "",
    contactPrimary: "",
    contactSecondary: "",
    matrixPrimary: `${highPowerCount} alto poder`,
    matrixSecondary: "",
    engagementPrimary: "",
    engagementSecondary: "",
    engagementTone: "positive",
    channelPrimary: `${sorted.length} ${sorted.length === 1 ? "cadastrado" : "cadastrados"}`,
    channelSecondary: "",
  });

  return {
    teamDisplayName,
    filterLabel,
    totalStakeholders: sorted.length,
    highPowerCount,
    activeGroupCount: activeGroups.size,
    rows,
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

  return `stakeholders-${slug}-${yyyy}-${mm}-${dd}.pdf`;
}
