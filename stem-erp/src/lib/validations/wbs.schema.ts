import { z } from "zod";

export const deliveryGroupSchema = z.enum([
  "ENGINEERING_CAD",
  "MANUFACTURING_CNC",
  "PIT_DISPLAY",
  "MARKETING_SPONSOR",
  "PROJECT_MANAGEMENT",
  "SOCIAL_PROJECT",
]);

export const wbsNodeStatusSchema = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "AUDITED",
]);

export const createWbsNodeSchema = z.object({
  teamId: z.string().min(1, "A equipe é obrigatória"),
  parentId: z.string().nullable().optional(),
  code: z
    .string()
    .min(1, "O código EAP é obrigatório")
    .regex(
      /^[0-9]+(\.[0-9]+)*$/,
      "Formato de código EAP inválido. Use números separados por ponto (ex: 1.0, 1.2, 1.2.3)"
    ),
  title: z
    .string()
    .min(3, "O nome do entregável deve conter pelo menos 3 caracteres")
    .max(120, "O nome do entregável não deve exceder 120 caracteres"),
  description: z
    .string()
    .max(500, "A descrição não deve exceder 500 caracteres")
    .optional()
    .nullable(),
  discipline: deliveryGroupSchema,
  ownerId: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  status: wbsNodeStatusSchema.default("PLANNED"),
  estimatedCostCents: z.coerce
    .number()
    .int("O custo estimado deve ser um número inteiro em centavos")
    .nonnegative("O custo estimado não pode ser negativo")
    .default(0),
  estimatedHours: z.coerce
    .number()
    .int("As horas estimadas devem ser um número inteiro")
    .nonnegative("As horas estimadas não podem ser negativas")
    .default(0),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateWbsNodeSchema = z.object({
  id: z.string().min(1, "ID do nó é obrigatório"),
  code: z
    .string()
    .min(1, "O código EAP é obrigatório")
    .regex(
      /^[0-9]+(\.[0-9]+)*$/,
      "Formato de código EAP inválido. Use números separados por ponto (ex: 1.0, 1.2, 1.2.3)"
    )
    .optional(),
  title: z
    .string()
    .min(3, "O nome do entregável deve conter pelo menos 3 caracteres")
    .max(120, "O nome do entregável não deve exceder 120 caracteres")
    .optional(),
  description: z
    .string()
    .max(500, "A descrição não deve exceder 500 caracteres")
    .optional()
    .nullable(),
  discipline: deliveryGroupSchema.optional(),
  ownerId: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  status: wbsNodeStatusSchema.optional(),
  estimatedCostCents: z.coerce
    .number()
    .int("O custo estimado deve ser um número inteiro em centavos")
    .nonnegative("O custo estimado não pode ser negativo")
    .optional(),
  estimatedHours: z.coerce
    .number()
    .int("As horas estimadas devem ser um número inteiro")
    .nonnegative("As horas estimadas não podem ser negativas")
    .optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const deleteWbsNodeSchema = z.object({
  id: z.string().min(1, "ID do entregável é obrigatório"),
  teamId: z.string().min(1, "ID da equipe é obrigatório"),
});

export type CreateWbsNodeInput = z.infer<typeof createWbsNodeSchema>;
export type CreateWbsNodeFormInput = z.input<typeof createWbsNodeSchema>;
export type UpdateWbsNodeInput = z.infer<typeof updateWbsNodeSchema>;
export type DeleteWbsNodeInput = z.infer<typeof deleteWbsNodeSchema>;
