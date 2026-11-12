"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import {
  createTaskSchema,
  deleteTaskSchema,
  editTaskSchema,
  riskPathSchema,
  taskEdgeSchema,
  updateMyTaskStatusSchema,
} from "@/lib/validations/tasks";
import { getCurrentUserFromSession } from "@/services/auth-service";
import {
  changeDependency,
  deleteTask,
  resolveTaskScope,
  saveRiskPath,
  saveTask,
  TaskError,
  updateTaskStatus,
} from "@/services/task-service";
import type { TaskActionResult } from "@/types/tasks";

type Scope = NonNullable<Awaited<ReturnType<typeof resolveTaskScope>>>;

async function mutate<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  input: unknown,
  operation: (scope: Scope, data: T) => Promise<unknown>,
): Promise<TaskActionResult> {
  const scope = await resolveTaskScope(await getCurrentUserFromSession());
  if (!scope?.canEdit) return { ok: false, message: "Sem permissão para editar tarefas desta equipe." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  try {
    await operation(scope, parsed.data);
    revalidatePath("/tarefas");
    return { ok: true };
  } catch (error) {
    if (error instanceof TaskError) return { ok: false, message: error.message };
    console.error("Falha na operação do módulo Tarefas", error);
    return { ok: false, message: "Não foi possível salvar. Tente novamente." };
  }
}

export async function createTaskAction(input: unknown) {
  return mutate(createTaskSchema, input, saveTask);
}
export async function editTaskAction(input: unknown) {
  return mutate(editTaskSchema, input, saveTask);
}
export async function addTaskDependencyAction(input: unknown) {
  return mutate(taskEdgeSchema, input, (scope, data) => changeDependency(scope, data, true));
}
export async function removeTaskDependencyAction(input: unknown) {
  return mutate(taskEdgeSchema, input, (scope, data) => changeDependency(scope, data, false));
}
export async function deleteTaskAction(input: unknown) {
  return mutate(deleteTaskSchema, input, deleteTask);
}
export async function saveRiskPathAction(input: unknown) {
  return mutate(riskPathSchema, input, saveRiskPath);
}
export async function updateMyTaskStatusAction(input: unknown) {
  return mutate(updateMyTaskStatusSchema, input, updateTaskStatus);
}
