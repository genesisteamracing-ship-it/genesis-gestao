import { z } from "zod";

export const deliveryGroupValues = [
  "ENGINEERING_CAD",
  "MANUFACTURING_CNC",
  "PIT_DISPLAY",
  "MARKETING_SPONSOR",
  "PROJECT_MANAGEMENT",
  "SOCIAL_PROJECT",
] as const;

export const acquisitionStrategyValues = [
  "DIRECT_PURCHASE",
  "FINANCIAL_SPONSOR",
  "BARTER_PARTNERSHIP",
  "OWN_FUNDS_RAFFLE",
] as const;

export const transactionTypeValues = ["ORIGIN", "APPLICATION"] as const;

export const trackingMethodValues = [
  "NFE",
  "RECEIPT",
  "SPONSOR_CONTRACT",
  "BANK_PIX_STATEMENT",
] as const;

export const sponsorTierValues = [
  "BRONZE",
  "SILVER",
  "GOLD",
  "DIAMOND",
] as const;

export const returnActionCategoryValues = [
  "CAR_UNIFORM_BRANDING",
  "SOCIAL_MEDIA",
  "PIT_DISPLAY_EVENT",
  "PRESS_PORTFOLIO",
  "SOCIAL_WORKSHOP",
  "OTHER_ACTIVATION",
] as const;

export const createBudgetResourceSchema = z.object({
  deliveryGroup: z.enum(deliveryGroupValues, {
    required_error: "Selecione um grupo de entrega",
  }),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  resourceName: z.string().min(3, "Mínimo de 3 caracteres"),
  acquisitionStrategy: z.enum(acquisitionStrategyValues, {
    required_error: "Selecione uma estratégia de aquisição",
  }),
  allocatedTo: z.string().min(2, "Informe o responsável"),
  plannedMonth: z.coerce
    .number()
    .int()
    .min(1, "Selecione o mês planejado")
    .max(24, "Mês fora da temporada"),
  utilizationForecast: z.coerce
    .number()
    .int()
    .min(1, "Mínimo de 1%")
    .max(100, "Máximo de 100%"),
  plannedAmountCents: z.coerce
    .number()
    .int()
    .nonnegative("O valor não pode ser negativo"),
});

export const createTransactionSchema = z.object({
  date: z.coerce.date({
    required_error: "Informe a data do fato gerador",
    invalid_type_error: "Data inválida",
  }),
  type: z.enum(transactionTypeValues, {
    required_error: "Selecione o tipo de lançamento",
  }),
  deliveryGroup: z.enum(deliveryGroupValues, {
    required_error: "Selecione um grupo de entrega",
  }),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  budgetResourceId: z.string().optional().nullable(),
  description: z.string().min(3, "Descreva a transação (mín. 3 caracteres)"),
  trackingMethod: z.enum(trackingMethodValues, {
    required_error: "Selecione o método comprobatório",
  }),
  documentRef: z.string().optional(),
  sponsorId: z.string().optional().nullable(),
  amountCents: z.coerce.number().int().positive("O valor deve ser maior que zero"),
  isBarterCounterpart: z.boolean().optional().default(false),
});

export const updateBudgetResourceSchema = createBudgetResourceSchema.extend({
  id: z.string().min(1, "ID do recurso é obrigatório"),
});

export const deleteBudgetResourceSchema = z.object({
  id: z.string().min(1, "ID do recurso é obrigatório"),
});

export const updateTransactionSchema = createTransactionSchema
  .omit({ isBarterCounterpart: true })
  .extend({
    id: z.string().min(1, "ID da transação é obrigatório"),
  });

export const deleteTransactionSchema = z.object({
  id: z.string().min(1, "ID da transação é obrigatório"),
});

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome da categoria deve ter ao menos 2 caracteres")
    .max(80, "Nome muito longo"),
  deliveryGroup: z.enum(deliveryGroupValues, {
    required_error: "Selecione um setor / grupo de entrega",
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateBudgetResourceInput = z.infer<typeof createBudgetResourceSchema>;
export type UpdateBudgetResourceInput = z.infer<typeof updateBudgetResourceSchema>;
export type DeleteBudgetResourceInput = z.infer<typeof deleteBudgetResourceSchema>;

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type DeleteTransactionInput = z.infer<typeof deleteTransactionSchema>;

export const createSponsorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome da empresa deve ter ao menos 2 caracteres")
    .max(100, "Nome da empresa muito longo"),
  tier: z.enum(sponsorTierValues, {
    required_error: "Selecione a cota de patrocínio",
  }),
  contactName: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const updateSponsorSchema = createSponsorSchema.extend({
  id: z.string().min(1, "ID da empresa é obrigatório"),
});

export const deleteSponsorSchema = z.object({
  id: z.string().min(1, "ID da empresa é obrigatório"),
});

export const createReturnActionSchema = z.object({
  sponsorId: z.string().min(1, "Selecione a empresa patrocinadora"),
  date: z.coerce.date({
    required_error: "Informe a data da ação",
    invalid_type_error: "Data inválida",
  }),
  title: z
    .string()
    .trim()
    .min(3, "O título da ação deve ter ao menos 3 caracteres")
    .max(150, "Título muito longo"),
  category: z.enum(returnActionCategoryValues, {
    required_error: "Selecione a categoria da ação",
  }),
  reachCount: z.coerce.number().int().nonnegative().optional().nullable(),
  returnCents: z.coerce
    .number()
    .int()
    .positive("O valor de retorno deve ser maior que zero"),
  description: z.string().trim().max(500).optional().nullable(),
});

export const deleteReturnActionSchema = z.object({
  id: z.string().min(1, "ID da ação é obrigatório"),
});

export type CreateSponsorInput = z.infer<typeof createSponsorSchema>;
export type UpdateSponsorInput = z.infer<typeof updateSponsorSchema>;
export type DeleteSponsorInput = z.infer<typeof deleteSponsorSchema>;

export type CreateReturnActionInput = z.infer<typeof createReturnActionSchema>;
export type DeleteReturnActionInput = z.infer<typeof deleteReturnActionSchema>;
