import { z } from "zod";

export const riskEntryTypeSchema = z.enum(["RISK", "OPPORTUNITY"]);

export const riskProbabilitySchema = z.enum([
  "QUASE_CERTO",
  "PROVAVEL",
  "POSSIVEL",
  "IMPROVAVEL",
  "RARA",
  "NONE",
]);

export const riskConsequenceSchema = z.enum([
  "CATASTROFICA",
  "GRANDE",
  "MODERADA",
  "PEQUENA",
  "DESPREZIVEL",
  "NONE",
]);

export const riskLifecycleStatusSchema = z.enum([
  "IDENTIFIED",
  "MONITORING",
  "MITIGATED",
  "OCCURRED",
  "CLOSED",
]);

export const deliveryGroupSchema = z.enum([
  "ENGINEERING_CAD",
  "MANUFACTURING_CNC",
  "PIT_DISPLAY",
  "MARKETING_SPONSOR",
  "PROJECT_MANAGEMENT",
  "SOCIAL_PROJECT",
]);

const optionalUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^https?:\/\/.+/i.test(value),
    "Informe uma URL válida iniciada por http:// ou https://"
  )
  .optional()
  .default("");

export const createRiskItemSchema = z.object({
  season: z.string().trim().min(1, "Temporada é obrigatória."),
  entryType: riskEntryTypeSchema.default("RISK"),
  title: z
    .string()
    .trim()
    .min(3, "Informe um título com pelo menos 3 caracteres.")
    .max(160, "Título deve ter no máximo 160 caracteres."),
  description: z.string().trim().max(2000).optional().default(""),
  sector: deliveryGroupSchema,
  probability: riskProbabilitySchema.default("NONE"),
  consequence: riskConsequenceSchema.default("NONE"),
  proactiveStrategy: z.string().trim().max(2000).optional().default(""),
  contingencyPlan: z.string().trim().max(2000).optional().default(""),
  observations: z.string().trim().max(2000).optional().default(""),
  evidenceNotes: z.string().trim().max(2000).optional().default(""),
  evidenceUrl: optionalUrlSchema,
  status: riskLifecycleStatusSchema.default("IDENTIFIED"),
  ownerUserId: z.string().trim().optional().default(""),
});

export const updateRiskItemSchema = createRiskItemSchema.extend({
  id: z.string().trim().min(1, "Identificador do risco é obrigatório."),
});

export const registerRiskReviewSchema = z.object({
  riskItemId: z.string().trim().min(1, "Identificador do risco é obrigatório."),
  newProbability: riskProbabilitySchema,
  newConsequence: riskConsequenceSchema,
  newStatus: riskLifecycleStatusSchema,
  notes: z
    .string()
    .trim()
    .min(3, "Descreva a revisão com pelo menos 3 caracteres.")
    .max(1000, "Notas da revisão devem ter no máximo 1000 caracteres."),
  evidenceNotes: z.string().trim().max(2000).optional().default(""),
  evidenceUrl: optionalUrlSchema,
});

export type CreateRiskItemInput = z.infer<typeof createRiskItemSchema>;
export type UpdateRiskItemInput = z.infer<typeof updateRiskItemSchema>;
export type RegisterRiskReviewInput = z.infer<typeof registerRiskReviewSchema>;
