import { STAKEHOLDER_GROUP_LABELS } from "@/lib/communication-constants";
import { resolveStakeholderMatrixQuadrant } from "@/lib/communication-hierarchy";
import type {
  CommunicationChannel,
  CommunicationFrequency,
  EngagementLevel,
  StakeholderGroup,
  StakeholderInterest,
  StakeholderPower,
  StakeholderWithRelations,
} from "@/types/communication";
import {
  STATEMENT_PDF_COLORS,
  type RgbColor,
} from "./financial-statement-pdf-layout";
import type { StakeholderQuadrantKey } from "./stakeholders-pdf-layout";

/**
 * Paleta oficial Azul e Amarelo da Equipe Gênesis (padrão dos PDFs de portfólio).
 */
export const COMMUNICATION_MATRIX_PDF_COLORS = STATEMENT_PDF_COLORS;

export type CommunicationMatrixBadgeTone =
  | "red"
  | "green"
  | "blue"
  | "amber"
  | "navy"
  | "neutral";

export const COMMUNICATION_MATRIX_BADGE_STYLES: Record<
  CommunicationMatrixBadgeTone,
  { fill: RgbColor; border: RgbColor; text: RgbColor }
> = {
  red: {
    fill: [254, 242, 242],
    border: [220, 38, 38],
    text: [185, 28, 28],
  },
  green: {
    fill: [236, 253, 245],
    border: [5, 150, 105],
    text: [4, 120, 87],
  },
  blue: {
    fill: [239, 246, 255],
    border: [29, 95, 214],
    text: [15, 61, 140],
  },
  amber: {
    fill: [255, 251, 235],
    border: [217, 119, 6],
    text: [180, 83, 9],
  },
  navy: {
    fill: [239, 246, 255],
    border: [15, 61, 140],
    text: [15, 61, 140],
  },
  neutral: {
    fill: [241, 245, 249],
    border: [148, 163, 184],
    text: [71, 85, 105],
  },
};

export const SHORT_GROUP_LABELS: Record<StakeholderGroup, string> = {
  SPONSORS: "Patrocinadores",
  SCHOOL_LEADERSHIP: "Direção Escolar",
  PARENTS_GUARDIANS: "Pais e Resp.",
  TECHNICAL_MENTORS: "Mentores / Técnicos",
  COMMUNITY_FANS: "Comunidade",
  COMPETITION_OFFICIALS: "Comissão STEM",
};

export const SHORT_CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  EMAIL: "E-mail Formal",
  WHATSAPP: "WhatsApp",
  MEETING: "Reunião",
  REPORT_PDF: "Relatório PDF",
};

export const SHORT_FREQUENCY_LABELS: Record<CommunicationFrequency, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  MILESTONE_EVENT: "Pós-Marco",
};

export const SHORT_ENGAGEMENT_LABELS: Record<EngagementLevel, string> = {
  UNAWARE: "Desinformado",
  RESISTANT: "Resistente",
  NEUTRAL: "Neutro",
  SUPPORTIVE: "Apoiador",
  LEADING: "Líder Defensor",
};

const CHANNEL_TONE_MAP: Record<CommunicationChannel, CommunicationMatrixBadgeTone> = {
  EMAIL: "blue",
  WHATSAPP: "green",
  MEETING: "navy",
  REPORT_PDF: "amber",
};

const QUADRANT_STRATEGY_META: Record<
  StakeholderQuadrantKey,
  { label: string; tone: CommunicationMatrixBadgeTone; rank: 4 | 3 | 2 | 1 }
> = {
  MANAGE_CLOSELY: { label: "Gerenciar de perto", tone: "red", rank: 4 },
  KEEP_SATISFIED: { label: "Manter satisfeito", tone: "green", rank: 3 },
  KEEP_INFORMED: { label: "Manter informado", tone: "blue", rank: 2 },
  MONITOR: { label: "Monitorar", tone: "amber", rank: 1 },
};

export interface CommunicationMatrixPdfRow {
  stakeholderName: string;
  stakeholderSubtitle: string;
  groupLabel: string;
  strategyLabel: string;
  strategyTone: CommunicationMatrixBadgeTone;
  powerInterestMeta: string;
  channel: CommunicationChannel;
  channelLabel: string;
  channelTone: CommunicationMatrixBadgeTone;
  frequencyLabel: string;
  engagementPrimary: string;
  engagementSecondary: string | null;
  contentApproach: string;
  responsibleLabel: string | null;
}

export interface CommunicationMatrixPdfData {
  teamDisplayName: string;
  filterLabel: string;
  totalRows: number;
  totalStakeholders: number;
  quadrantCounts: Record<StakeholderQuadrantKey, number>;
  channelCounts: Record<CommunicationChannel, number>;
  rows: CommunicationMatrixPdfRow[];
}

export function resolveDefaultCommunicationApproach(
  group: StakeholderGroup,
  power: StakeholderPower,
  interest: StakeholderInterest,
): string {
  if (group === "SPONSORS") {
    return power === "HIGH"
      ? "Relatório de ROI, entregas de contrapartida, resultados técnicos e visibilidade da marca."
      : "Atualizações periódicas de entregas, avanços do projeto e convites para eventos.";
  }
  if (group === "SCHOOL_LEADERSHIP") {
    return power === "HIGH"
      ? "Balanço institucional de marcos, cronograma acadêmico e demandas de infraestrutura."
      : "Resumo de progresso da equipe, participações e resultados das etapas.";
  }
  if (group === "TECHNICAL_MENTORS") {
    return "Validações técnicas de engenharia, manufatura CNC, testes de pista e feedbacks de desempenho.";
  }
  if (group === "COMPETITION_OFFICIALS") {
    return "Conformidade com o regulamento técnico, prazos oficiais, portfólios e inspeções.";
  }
  if (group === "PARENTS_GUARDIANS") {
    return "Agenda de treinos, cronograma de competições, logística e autorizações da equipe.";
  }
  return interest === "HIGH"
    ? "Atualizações sobre marcos da temporada, bastidores técnicos e ações sociais."
    : "Divulgação de marcos principais da temporada e eventos abertos da equipe.";
}

/**
 * Constrói os dados estruturados da Matriz de Comunicação em formato tabular para PDF de portfólio:
 * - Ordena por prioridade estratégica (Poder × Interesse) e nome alfabético
 * - Expande planos de comunicação ativos (ou usa o perfil preferencial do stakeholder)
 * - Consolida contadores por quadrante estratégico e por canal
 */
export function buildCommunicationMatrixPdfData({
  stakeholders,
  teamName,
  groupFilter,
}: {
  stakeholders: StakeholderWithRelations[];
  teamName?: string;
  groupFilter?: StakeholderGroup | "ALL";
}): CommunicationMatrixPdfData {
  const teamDisplayName = teamName?.trim() || "Equipe Gênesis";
  const filterLabel =
    groupFilter && groupFilter !== "ALL"
      ? STAKEHOLDER_GROUP_LABELS[groupFilter]
      : "Todos os Grupos";

  const scoped =
    groupFilter && groupFilter !== "ALL"
      ? stakeholders.filter((item) => item.group === groupFilter)
      : stakeholders;

  const quadrantCounts: Record<StakeholderQuadrantKey, number> = {
    MANAGE_CLOSELY: 0,
    KEEP_SATISFIED: 0,
    KEEP_INFORMED: 0,
    MONITOR: 0,
  };

  const channelCounts: Record<CommunicationChannel, number> = {
    EMAIL: 0,
    WHATSAPP: 0,
    MEETING: 0,
    REPORT_PDF: 0,
  };

  if (scoped.length === 0) {
    return {
      teamDisplayName,
      filterLabel,
      totalRows: 0,
      totalStakeholders: 0,
      quadrantCounts,
      channelCounts,
      rows: [],
    };
  }

  const sorted = [...scoped].sort((a, b) => {
    const quadA = resolveStakeholderMatrixQuadrant(a.power, a.interest).quadrant;
    const quadB = resolveStakeholderMatrixQuadrant(b.power, b.interest).quadrant;
    const rankDiff = QUADRANT_STRATEGY_META[quadB].rank - QUADRANT_STRATEGY_META[quadA].rank;
    if (rankDiff !== 0) return rankDiff;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  const rows: CommunicationMatrixPdfRow[] = [];

  for (const item of sorted) {
    const quadrant = resolveStakeholderMatrixQuadrant(item.power, item.interest).quadrant;
    quadrantCounts[quadrant] += 1;

    const strategyMeta = QUADRANT_STRATEGY_META[quadrant];
    const groupLabel = SHORT_GROUP_LABELS[item.group] || STAKEHOLDER_GROUP_LABELS[item.group] || item.group;
    const subtitleParts: string[] = [];
    if (item.organization?.trim()) subtitleParts.push(item.organization.trim());
    if (item.roleOrJobTitle?.trim()) subtitleParts.push(item.roleOrJobTitle.trim());
    const stakeholderSubtitle = subtitleParts.join(" • ") || groupLabel;

    const powerText = item.power === "HIGH" ? "Alto" : "Baixo";
    const interestText = item.interest === "HIGH" ? "Alto" : "Baixo";
    const powerInterestMeta = `Poder ${powerText} • Inter. ${interestText}`;

    const hasEngagementGap = item.currentEngagement !== item.targetEngagement;
    const engagementPrimary = hasEngagementGap
      ? `Atual: ${SHORT_ENGAGEMENT_LABELS[item.currentEngagement]}`
      : SHORT_ENGAGEMENT_LABELS[item.currentEngagement];
    const engagementSecondary = hasEngagementGap
      ? `Meta: ${SHORT_ENGAGEMENT_LABELS[item.targetEngagement]}`
      : null;

    const fallbackApproach =
      item.notes?.trim() ||
      resolveDefaultCommunicationApproach(item.group, item.power, item.interest);

    const activePlans = (item.plans ?? []).filter((plan) => plan.isActive);

    if (activePlans.length > 0) {
      for (const plan of activePlans) {
        channelCounts[plan.channel] += 1;
        const planContentParts = [
          plan.title?.trim(),
          plan.keyInformation?.trim(),
          plan.customApproach?.trim(),
        ].filter((part): part is string => Boolean(part));

        rows.push({
          stakeholderName: item.name,
          stakeholderSubtitle,
          groupLabel,
          strategyLabel: strategyMeta.label,
          strategyTone: strategyMeta.tone,
          powerInterestMeta,
          channel: plan.channel,
          channelLabel: SHORT_CHANNEL_LABELS[plan.channel],
          channelTone: CHANNEL_TONE_MAP[plan.channel],
          frequencyLabel: SHORT_FREQUENCY_LABELS[plan.frequency],
          engagementPrimary,
          engagementSecondary,
          contentApproach: planContentParts.join(" - ") || fallbackApproach,
          responsibleLabel: plan.responsibleMemberName?.trim() || null,
        });
      }
    } else {
      channelCounts[item.preferredChannel] += 1;
      rows.push({
        stakeholderName: item.name,
        stakeholderSubtitle,
        groupLabel,
        strategyLabel: strategyMeta.label,
        strategyTone: strategyMeta.tone,
        powerInterestMeta,
        channel: item.preferredChannel,
        channelLabel: SHORT_CHANNEL_LABELS[item.preferredChannel],
        channelTone: CHANNEL_TONE_MAP[item.preferredChannel],
        frequencyLabel: SHORT_FREQUENCY_LABELS[item.preferredFrequency],
        engagementPrimary,
        engagementSecondary,
        contentApproach: fallbackApproach,
        responsibleLabel: null,
      });
    }
  }

  return {
    teamDisplayName,
    filterLabel,
    totalRows: rows.length,
    totalStakeholders: sorted.length,
    quadrantCounts,
    channelCounts,
    rows,
  };
}

export function buildCommunicationMatrixPdfFilename(
  teamName?: string,
  date = new Date(),
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

  return `matriz-comunicacao-${slug}-${yyyy}-${mm}-${dd}.pdf`;
}
