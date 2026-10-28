import type {
  CommunicationChannel,
  CommunicationFrequency,
  EngagementLevel,
  FeedbackSentiment,
  StakeholderGroup,
  StakeholderInterest,
  StakeholderPower,
} from "@/types/communication";

export const STAKEHOLDER_GROUP_LABELS: Record<StakeholderGroup, string> = {
  SPONSORS: "Patrocinadores Corporativos",
  SCHOOL_LEADERSHIP: "Direção & Coordenação Escolar",
  PARENTS_GUARDIANS: "Pais & Responsáveis",
  TECHNICAL_MENTORS: "Mentores & Especialistas",
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
