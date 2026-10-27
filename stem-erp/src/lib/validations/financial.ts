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
