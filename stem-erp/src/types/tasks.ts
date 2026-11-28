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
  baselineStartDate?: string | null;
  baselineEndDate?: string | null;
  isAtRisk?: boolean;
  isCritical?: boolean;
  optimisticDays?: number | null;
  mostLikelyDays?: number | null;
  pessimisticDays?: number | null;
  status: TaskStatus;
  completedAt: string | null;
  cancelledAt: string | null;
  revision: number;
  canManage?: boolean;
  roles: { person: TaskPerson; role: TaskRole }[];
};
export type TaskEdge = { predecessorId: string; successorId: string };
export type MilestoneCheckStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MilestoneCriterionRecord = {
  id: string;
  title: string;
  sortOrder: number;
};
export type MilestoneCriterionCheckRecord = {
  criterionId: string;
  taskId: string;
  status: MilestoneCheckStatus;
  notes: string | null;
  checkedByName: string | null;
  checkedAt: string | null;
};
export type TaskMilestoneRecord = {
  id: string;
  title: string;
  description: string | null;
  targetDate: string;
  revision: number;
  criteria: MilestoneCriterionRecord[];
  taskIds: string[];
  checks: MilestoneCriterionCheckRecord[];
};
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
  currentUserId: string;
  canEdit: boolean;
  members: TaskPerson[];
  tasks: TaskRecord[];
  edges: TaskEdge[];
  paths: TaskRisk[];
  milestones: TaskMilestoneRecord[];
};
export type TaskActionResult = { ok: true } | { ok: false; message: string };

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
  CANCELLED: "Cancelada",
};
