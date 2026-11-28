import { DeliveryGroup, TaskStatus } from "@prisma/client";
import { z } from "zod";
import { calculateEndDateFromPertSum, parseTaskDate } from "@/lib/task-schedule";

const id = z.string().min(1).max(128);
const revision = z.number().int().nonnegative();
const day = z.string().refine((value) => parseTaskDate(value) !== null, "Informe uma data válida.");
const assignment = z.object({ memberKey: id, role: z.enum(["R", "C", "I"]) }).strict();
const assignments = z.array(assignment).refine(
  (items) => new Set(items.map(({ memberKey, role }) => JSON.stringify([memberKey, role]))).size === items.length,
  "Cada integrante só pode receber o mesmo papel uma vez.",
);

const pertDays = z
  .number()
  .int("Informe um número inteiro de dias.")
  .min(1, "A estimativa mínima é 1 dia.")
  .max(3650, "A estimativa máxima é 3650 dias.")
  .nullable()
  .optional();

const requiredPertDays = z
  .number({ message: "Informe um número inteiro de dias." })
  .int("Informe um número inteiro de dias.")
  .min(1, "A estimativa mínima é 1 dia.")
  .max(3650, "A estimativa máxima é 3650 dias.");

const taskBase = z.object({
  teamId: id,
  title: z.string().trim().min(1, "Informe o título.").max(160),
  description: z.string().trim().max(4000).optional(),
  deliveryGroup: z.nativeEnum(DeliveryGroup),
  startDate: day,
  isAtRisk: z.boolean().optional(),
  isCritical: z.boolean().optional(),
  assignments,
});

const dateRange = (item: { startDate: string; endDate: string }) => item.startDate <= item.endDate;
const invalidRange = { message: "O término deve ser igual ou posterior ao início.", path: ["endDate"] };

function validateBaselineRange(
  item: { baselineStartDate?: string; baselineEndDate?: string },
  ctx: z.RefinementCtx,
) {
  const hasStart = item.baselineStartDate !== undefined;
  const hasEnd = item.baselineEndDate !== undefined;
  if (!hasStart && !hasEnd) return;
  if (!hasStart || !hasEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe tanto o início quanto o término da linha de base.",
      path: ["baselineEndDate"],
    });
    return;
  }
  if (item.baselineStartDate! > item.baselineEndDate!) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O término da linha de base deve ser igual ou posterior ao início.",
      path: ["baselineEndDate"],
    });
  }
}

function validatePertOrder(o: number, m: number, p: number, ctx: z.RefinementCtx) {
  if (o > m) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A estimativa mais provável (M) deve ser maior ou igual à otimista (O).",
      path: ["mostLikelyDays"],
    });
  }
  if (m > p) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A estimativa pessimista (P) deve ser maior ou igual à mais provável (M).",
      path: ["pessimisticDays"],
    });
  }
}

function validatePertEstimates(
  item: {
    optimisticDays?: number | null;
    mostLikelyDays?: number | null;
    pessimisticDays?: number | null;
  },
  ctx: z.RefinementCtx,
) {
  const values = [item.optimisticDays, item.mostLikelyDays, item.pessimisticDays];
  const filledCount = values.filter((v) => v !== null && v !== undefined).length;
  if (filledCount === 0) return;
  if (filledCount < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Preencha as três estimativas PERT (Otimista, Mais provável e Pessimista) ou deixe todas vazias.",
      path: ["optimisticDays"],
    });
    return;
  }
  validatePertOrder(item.optimisticDays!, item.mostLikelyDays!, item.pessimisticDays!, ctx);
}

export const createTaskSchema = taskBase
  .extend({
    endDate: day.optional(),
    optimisticDays: requiredPertDays,
    mostLikelyDays: requiredPertDays,
    pessimisticDays: requiredPertDays,
  })
  .strict()
  .superRefine((item, ctx) => {
    validatePertOrder(item.optimisticDays, item.mostLikelyDays, item.pessimisticDays, ctx);
  })
  .transform((item) => ({
    ...item,
    endDate: calculateEndDateFromPertSum(
      item.startDate,
      item.optimisticDays,
      item.mostLikelyDays,
      item.pessimisticDays,
    )!,
  }));

export const editTaskSchema = taskBase
  .extend({
    id,
    revision,
    status: z.nativeEnum(TaskStatus),
    endDate: day,
    baselineStartDate: day.optional(),
    baselineEndDate: day.optional(),
    optimisticDays: pertDays,
    mostLikelyDays: pertDays,
    pessimisticDays: pertDays,
  })
  .strict()
  .refine(dateRange, invalidRange)
  .superRefine(validateBaselineRange)
  .superRefine(validatePertEstimates)
  .transform((item) => {
    const derivedEnd = calculateEndDateFromPertSum(
      item.startDate,
      item.optimisticDays,
      item.mostLikelyDays,
      item.pessimisticDays,
    );
    return derivedEnd ? { ...item, endDate: derivedEnd } : item;
  });

export const deleteTaskSchema = z.object({ id, teamId: id }).strict();
export const updateMyTaskStatusSchema = z.object({
  teamId: id,
  taskId: id,
  status: z.nativeEnum(TaskStatus),
  revision,
}).strict();
export const rescheduleTaskSchema = z.object({
  teamId: id,
  taskId: id,
  startDate: day,
  endDate: day,
  revision,
}).strict().refine(dateRange, invalidRange);
export const reorderTasksSchema = z.object({
  teamId: id,
  taskIds: z.array(id).min(1).refine(
    (items) => new Set(items).size === items.length,
    "A lista de ordenação não pode repetir tarefas.",
  ),
}).strict();
export const taskEdgeSchema = z.object({ teamId: id, predecessorId: id, successorId: id }).strict()
  .refine((item) => item.predecessorId !== item.successorId, "Uma tarefa não pode depender de si mesma.");

export const riskPathSchema = z.object({
  teamId: id,
  name: z.string().trim().min(1, "Informe o nome do caminho.").max(160),
  reason: z.string().trim().min(1, "Informe o motivo do risco.").max(4000),
  taskIds: z.array(id).min(2, "Escolha ao menos duas tarefas.").refine(
    (items) => new Set(items).size === items.length, "O caminho não pode repetir tarefas.",
  ),
  edit: z.object({ id, revision }).strict().optional(),
}).strict();

const milestoneCriterionSchema = z
  .object({
    id: id.optional(),
    title: z
      .string()
      .trim()
      .min(1, "Informe o critério de aceitação.")
      .max(240, "Critério muito longo (máximo 240 caracteres)."),
  })
  .strict();

export const saveMilestoneSchema = z
  .object({
    teamId: id,
    id: id.optional(),
    revision: revision.optional(),
    title: z.string().trim().min(1, "Informe o título do marco.").max(160),
    description: z.string().trim().max(2000).optional(),
    targetDate: day,
    criteria: z
      .array(milestoneCriterionSchema)
      .min(1, "Adicione ao menos um critério de aceitação.")
      .max(20, "Limite de 20 critérios por marco."),
    taskIds: z
      .array(id)
      .refine(
        (items) => new Set(items).size === items.length,
        "A lista de tarefas vinculadas não pode repetir itens.",
      ),
  })
  .strict()
  .superRefine((item, ctx) => {
    if (item.id !== undefined && item.revision === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Revisão do marco é obrigatória para edição.",
        path: ["revision"],
      });
    }
  });

export const deleteMilestoneSchema = z.object({ teamId: id, id }).strict();

export const updateMilestoneCheckSchema = z
  .object({
    teamId: id,
    milestoneId: id,
    criterionId: id,
    taskId: id,
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type EditTaskInput = z.infer<typeof editTaskSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
export type UpdateMyTaskStatusInput = z.infer<typeof updateMyTaskStatusSchema>;
export type RescheduleTaskInput = z.infer<typeof rescheduleTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
export type EdgeInput = z.infer<typeof taskEdgeSchema>;
export type RiskPathInput = z.infer<typeof riskPathSchema>;
export type SaveMilestoneInput = z.infer<typeof saveMilestoneSchema>;
export type DeleteMilestoneInput = z.infer<typeof deleteMilestoneSchema>;
export type UpdateMilestoneCheckInput = z.infer<typeof updateMilestoneCheckSchema>;
