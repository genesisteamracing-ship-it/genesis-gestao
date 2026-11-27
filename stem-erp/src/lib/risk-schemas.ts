import { z } from "zod";
import {
  getContingencyPlanLetter,
  MAX_CONTINGENCY_PLANS,
  MIN_CONTINGENCY_PLANS,
  parseContingencyPlans,
} from "./risk-contingency-plans";

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

const baseRiskItemObjectSchema = z.object({
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
  contingencyPlan: z.string().trim().max(6000).optional().default(""),
  contingencyPlans: z
    .array(
      z
        .string()
        .trim()
        .max(1000, "Cada plano deve ter no máximo 1000 caracteres.")
    )
    .max(MAX_CONTINGENCY_PLANS, "Máximo de 10 planos de contingência.")
    .optional(),
  observations: z.string().trim().max(2000).optional().default(""),
  evidenceNotes: z.string().trim().max(2000).optional().default(""),
  evidenceUrl: optionalUrlSchema,
  status: riskLifecycleStatusSchema.default("IDENTIFIED"),
  ownerUserId: z.string().trim().optional().default(""),
});

function applyContingencyValidation<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) {
  return schema.superRefine((data, ctx) => {
    const record = data as {
      entryType?: string;
      contingencyPlans?: string[];
      contingencyPlan?: string;
    };

    if (record.entryType !== "RISK") {
      return;
    }

    const plans =
      record.contingencyPlans !== undefined
        ? record.contingencyPlans
        : parseContingencyPlans(record.contingencyPlan);

    if (plans.length < MIN_CONTINGENCY_PLANS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contingencyPlans"],
        message: "Informe no mínimo 2 planos de contingência (Plano A e Plano B).",
      });
    }

    const requiredCount = Math.max(plans.length, MIN_CONTINGENCY_PLANS);
    for (let index = 0; index < requiredCount; index += 1) {
      const value = (plans[index] ?? "").trim();
      if (value.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contingencyPlans", index],
          message: `O Plano ${getContingencyPlanLetter(index)} é obrigatório (mínimo de 3 caracteres).`,
        });
      }
    }
  });
}

export const createRiskItemSchema = applyContingencyValidation(
  baseRiskItemObjectSchema
);

export const updateRiskItemSchema = applyContingencyValidation(
  baseRiskItemObjectSchema.extend({
    id: z.string().trim().min(1, "Identificador do risco é obrigatório."),
  })
);

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
