import type {
  CommunicationChannel,
  CommunicationFrequency,
  EngagementLevel,
  FeedbackSentiment,
  HierarchyTier,
  StakeholderGroup,
  StakeholderInterest,
  StakeholderPower,
} from "@/types/communication";

export const STAKEHOLDER_GROUP_LABELS: Record<StakeholderGroup, string> = {
  SPONSORS: "Patrocinadores Corporativos",
  SCHOOL_LEADERSHIP: "Direção & Coordenação Escolar",
  PARENTS_GUARDIANS: "Pais & Responsáveis",
  TECHNICAL_MENTORS: "Mentores e técnicos",
  COMMUNITY_FANS: "Comunidade & Apoiadores",
  COMPETITION_OFFICIALS: "Comissão & Jurados STEM",
};

export const STAKEHOLDER_POWER_LABELS: Record<StakeholderPower, string> = {
  LOW: "Baixo Poder",
  HIGH: "Alto Poder",
};

export const STAKEHOLDER_INTEREST_LABELS: Record<StakeholderInterest, string> = {
  LOW: "Baixo Interesse",
  HIGH: "Alto Interesse",
};

export const ENGAGEMENT_LEVEL_LABELS: Record<EngagementLevel, string> = {
  UNAWARE: "Desinformado",
  RESISTANT: "Resistente",
  NEUTRAL: "Neutro",
  SUPPORTIVE: "Apoiador Ativo",
  LEADING: "Líder Defensor",
};

export const COMMUNICATION_CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  WHATSAPP: "WhatsApp Oficial",
  EMAIL: "E-mail Formal",
  MEETING: "Reunião / Alinhamento",
  REPORT_PDF: "Relatório Impresso / PDF",
};

export const COMMUNICATION_FREQUENCY_LABELS: Record<CommunicationFrequency, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  MILESTONE_EVENT: "Pós-Marco / Evento Crítico",
};

export const FEEDBACK_SENTIMENT_LABELS: Record<FeedbackSentiment, string> = {
  POSITIVE: "Positivo / Elogio",
  NEUTRAL: "Neutro / Informativo",
  CONSTRUCTIVE_CRITICISM: "Crítica Construtiva / Atenção",
};

export const HIERARCHY_TIER_META: Record<
  HierarchyTier,
  {
    rankWeight: 4 | 3 | 2 | 1;
    badgeLabel: string;
    shortLabel: string;
    description: string;
    tone: "purple" | "primary" | "success" | "amber";
  }
> = {
  TIER_1_STRATEGIC: {
    rankWeight: 4,
    badgeLabel: "Nível 1 · Alto Poder & Alto Interesse",
    shortLabel: "Nível 1 · Estratégico",
    description: "Decisores chave e alta direção do parceiro (Gerenciar de Perto)",
    tone: "purple",
  },
  TIER_2_INSTITUTIONAL: {
    rankWeight: 3,
    badgeLabel: "Nível 2 · Alto Poder & Baixo Interesse",
    shortLabel: "Nível 2 · Institucional",
    description: "Autoridades regulatórias e conselhos (Manter Satisfeito)",
    tone: "primary",
  },
  TIER_3_TACTICAL: {
    rankWeight: 2,
    badgeLabel: "Nível 3 · Baixo Poder & Alto Interesse",
    shortLabel: "Nível 3 · Tático / Técnico",
    description: "Corpo técnico, coordenação e mentores (Manter Informado)",
    tone: "success",
  },
  TIER_4_OPERATIONAL: {
    rankWeight: 1,
    badgeLabel: "Nível 4 · Baixo Poder & Baixo Interesse",
    shortLabel: "Nível 4 · Base / Operacional",
    description: "Docentes, apoiadores e multiplicadores (Monitorar)",
    tone: "amber",
  },
};
