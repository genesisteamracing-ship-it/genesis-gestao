import { DeliveryGroup, TaskStatus } from "@prisma/client";
import { z } from "zod";
import { parseTaskDate } from "@/lib/task-schedule";

const id = z.string().min(1).max(128);
const revision = z.number().int().nonnegative();
const day = z.string().refine((value) => parseTaskDate(value) !== null, "Informe uma data válida.");
const assignment = z.object({ memberKey: id, role: z.enum(["R", "C", "I"]) }).strict();
const assignments = z.array(assignment).refine(
  (items) => new Set(items.map(({ memberKey, role }) => JSON.stringify([memberKey, role]))).size === items.length,
  "Cada integrante só pode receber o mesmo papel uma vez.",
);

const task = z.object({
  teamId: id,
  title: z.string().trim().min(1, "Informe o título.").max(160),
  description: z.string().trim().max(4000).optional(),
  deliveryGroup: z.nativeEnum(DeliveryGroup),
  startDate: day,
  endDate: day,
  assignments,
}).strict();

const dateRange = (item: { startDate: string; endDate: string }) => item.startDate <= item.endDate;
const invalidRange = { message: "O término deve ser igual ou posterior ao início.", path: ["endDate"] };

export const createTaskSchema = task.refine(dateRange, invalidRange);
export const editTaskSchema = task.extend({ id, revision, status: z.nativeEnum(TaskStatus) }).refine(dateRange, invalidRange);
export const deleteTaskSchema = z.object({ id, teamId: id }).strict();
export const updateMyTaskStatusSchema = z.object({
  teamId: id,
  taskId: id,
  status: z.nativeEnum(TaskStatus),
  revision,
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

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type EditTaskInput = z.infer<typeof editTaskSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
export type UpdateMyTaskStatusInput = z.infer<typeof updateMyTaskStatusSchema>;
export type EdgeInput = z.infer<typeof taskEdgeSchema>;
export type RiskPathInput = z.infer<typeof riskPathSchema>;
