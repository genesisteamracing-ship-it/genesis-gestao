import type { DeliveryGroup, TaskStatus, TaskAssignmentRole } from "@prisma/client";

export type TaskPerson = { key: string; name: string; available: boolean };
export type TaskRole = "A" | TaskAssignmentRole;
export type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  deliveryGroup: DeliveryGroup;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  revision: number;
  roles: { person: TaskPerson; role: TaskRole }[];
};
export type TaskEdge = { predecessorId: string; successorId: string };
export type TaskRisk = {
  id: string;
  name: string;
  reason: string;
  taskIds: string[];
  missing: TaskEdge[];
  revision: number;
};
export type TaskWorkspace = {
  teamId: string;
  canEdit: boolean;
  members: TaskPerson[];
  tasks: TaskRecord[];
  edges: TaskEdge[];
  paths: TaskRisk[];
};
export type TaskActionResult = { ok: true } | { ok: false; message: string };

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
};
