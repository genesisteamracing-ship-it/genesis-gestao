import { z } from "zod";

export const stakeholderGroupValues = [
  "SPONSORS",
  "SCHOOL_LEADERSHIP",
  "PARENTS_GUARDIANS",
  "TECHNICAL_MENTORS",
  "COMMUNITY_FANS",
  "COMPETITION_OFFICIALS",
] as const;

export const stakeholderPowerValues = ["LOW", "HIGH"] as const;
export const stakeholderInterestValues = ["LOW", "HIGH"] as const;

export const engagementLevelValues = [
  "UNAWARE",
  "RESISTANT",
  "NEUTRAL",
  "SUPPORTIVE",
  "LEADING",
] as const;

export const communicationChannelValues = [
  "WHATSAPP",
  "EMAIL",
  "MEETING",
  "REPORT_PDF",
] as const;

export const communicationFrequencyValues = [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "BIMONTHLY",
  "QUARTERLY",
  "MILESTONE_EVENT",
] as const;

export const feedbackSentimentValues = [
  "POSITIVE",
  "NEUTRAL",
  "CONSTRUCTIVE_CRITICISM",
] as const;

export const createStakeholderSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  organization: z.string().optional().nullable(),
  roleOrJobTitle: z.string().optional().nullable(),
  group: z.enum(stakeholderGroupValues, {
    required_error: "Selecione o grupo do stakeholder",
  }),
  sponsorId: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  power: z.enum(stakeholderPowerValues),
  interest: z.enum(stakeholderInterestValues),
  currentEngagement: z.enum(engagementLevelValues),
  targetEngagement: z.enum(engagementLevelValues),
  preferredChannel: z.enum(communicationChannelValues),
  preferredFrequency: z.enum(communicationFrequencyValues),
  notes: z.string().optional().nullable(),
});

export const updateStakeholderSchema = createStakeholderSchema.partial().extend({
  id: z.string().min(1, "ID obrigatório"),
});

export const createCommunicationPlanSchema = z.object({
  stakeholderId: z.string().min(1, "Selecione o stakeholder"),
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  channel: z.enum(communicationChannelValues, {
    required_error: "Selecione o canal",
  }),
  frequency: z.enum(communicationFrequencyValues, {
    required_error: "Selecione a frequência",
  }),
  customApproach: z.string().optional().nullable(),
  keyInformation: z.string().optional().nullable(),
  responsibleMemberName: z.string().min(2, "Informe o responsável da equipe"),
  nextDispatchDate: z.string().optional().nullable(),
});

export const createCommunicationLogSchema = z.object({
  stakeholderId: z.string().min(1, "Selecione o stakeholder"),
  planId: z.string().optional().nullable(),
  subject: z.string().min(3, "Assunto deve ter no mínimo 3 caracteres"),
  channel: z.enum(communicationChannelValues, {
    required_error: "Selecione o canal",
  }),
  dispatchedByName: z.string().min(2, "Informe quem enviou"),
  contentSummary: z.string().min(5, "Informe o resumo do conteúdo enviado"),
  reportTypeIncluded: z.string().optional().nullable(),
  evidenceLink: z.string().url("Link inválido").optional().or(z.literal("")).nullable(),
  sentAt: z.string().optional().nullable(),
});

export const createFeedbackSchema = z.object({
  communicationLogId: z.string().min(1, "ID do disparo obrigatório"),
  sentiment: z.enum(feedbackSentimentValues, {
    required_error: "Selecione a percepção / sentimento",
  }),
  stakeholderResponse: z.string().min(3, "Descreva a resposta do stakeholder"),
  continuousImprovementAction: z.string().optional().nullable(),
  isAddressed: z.boolean(),
});

export type CreateStakeholderInput = z.infer<typeof createStakeholderSchema>;
export type UpdateStakeholderInput = z.infer<typeof updateStakeholderSchema>;
export type CreateCommunicationPlanInput = z.infer<typeof createCommunicationPlanSchema>;
export type CreateCommunicationLogInput = z.infer<typeof createCommunicationLogSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
