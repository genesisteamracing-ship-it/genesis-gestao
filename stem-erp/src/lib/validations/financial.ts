import { z } from "zod";

export const deliveryGroupValues = [
  "ENGINEERING_CAD",
  "MANUFACTURING_CNC",
  "PIT_DISPLAY",
  "MARKETING_SPONSOR",
  "PROJECT_MANAGEMENT",
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
  plannedMonth: z.coerce.number().int().min(1, "Mês mínimo é 1").max(6, "Mês máximo é 6"),
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
  referenceMonth: z.coerce.number().int().min(1, "Mês mínimo é 1").max(6, "Mês máximo é 6"),
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

export type CreateBudgetResourceInput = z.infer<typeof createBudgetResourceSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
