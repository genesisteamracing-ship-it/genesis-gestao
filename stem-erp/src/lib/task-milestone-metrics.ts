import { dayLabel, formatTaskDate, parseTaskDate, taskDay } from "@/lib/task-schedule";
import type {
  MilestoneCheckStatus,
  MilestoneCriterionCheckRecord,
  TaskMilestoneRecord,
  TaskRecord,
} from "@/types/tasks";

const DAY_MS = 86_400_000;

export type MilestoneTaskVerdict = "APPROVED" | "REJECTED" | "PENDING";

export type GanttMilestoneOverallStatus =
  | "NO_TASKS"
  | "APPROVED"
  | "REJECTED"
  | "OVERDUE"
  | "PENDING";

export const MILESTONE_CHECK_STATUS_LABELS: Record<MilestoneCheckStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Reprovado",
};

export const MILESTONE_TASK_VERDICT_LABELS: Record<MilestoneTaskVerdict, string> = {
  APPROVED: "Aprovada",
  REJECTED: "Reprovada",
  PENDING: "Pendente",
};

export const MILESTONE_OVERALL_STATUS_LABELS: Record<GanttMilestoneOverallStatus, string> = {
  NO_TASKS: "Sem tarefas vinculadas",
  APPROVED: "Critérios aprovados",
  REJECTED: "Com reprovações",
  OVERDUE: "Prazo vencido",
  PENDING: "Em verificação",
};

export type MilestoneTaskEvaluation = {
  verdict: MilestoneTaskVerdict;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  totalCriteria: number;
  checksByCriterionId: Record<string, MilestoneCriterionCheckRecord | undefined>;
};

export type MilestoneSummary = {
  totalTasks: number;
  approvedTasks: number;
  rejectedTasks: number;
  pendingTasks: number;
  progressPercent: number;
  status: GanttMilestoneOverallStatus;
};

export type MilestoneWeekRange = {
  startIso: string;
  endIso: string;
  label: string;
};

export function evaluateMilestoneTask(
  milestone: TaskMilestoneRecord,
  taskId: string,
): MilestoneTaskEvaluation {
  const checksByCriterionId: Record<string, MilestoneCriterionCheckRecord | undefined> = {};

  for (const check of milestone.checks) {
    if (check.taskId === taskId) {
      checksByCriterionId[check.criterionId] = check;
    }
  }

  let approvedCount = 0;
  let rejectedCount = 0;
  let pendingCount = 0;

  for (const criterion of milestone.criteria) {
    const status = checksByCriterionId[criterion.id]?.status ?? "PENDING";
    if (status === "APPROVED") approvedCount += 1;
    else if (status === "REJECTED") rejectedCount += 1;
    else pendingCount += 1;
  }

  const totalCriteria = milestone.criteria.length;
  let verdict: MilestoneTaskVerdict = "PENDING";
  if (totalCriteria > 0 && approvedCount === totalCriteria) {
    verdict = "APPROVED";
  } else if (rejectedCount > 0) {
    verdict = "REJECTED";
  }

  return {
    verdict,
    approvedCount,
    rejectedCount,
    pendingCount,
    totalCriteria,
    checksByCriterionId,
  };
}

export function evaluateMilestoneSummary(
  milestone: TaskMilestoneRecord,
  todayIso: string,
): MilestoneSummary {
  const totalTasks = milestone.taskIds.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      approvedTasks: 0,
      rejectedTasks: 0,
      pendingTasks: 0,
      progressPercent: 0,
      status: "NO_TASKS",
    };
  }

  let approvedTasks = 0;
  let rejectedTasks = 0;
  let pendingTasks = 0;

  for (const taskId of milestone.taskIds) {
    const evaluation = evaluateMilestoneTask(milestone, taskId);
    if (evaluation.verdict === "APPROVED") approvedTasks += 1;
    else if (evaluation.verdict === "REJECTED") rejectedTasks += 1;
    else pendingTasks += 1;
  }

  const progressPercent = Math.round((approvedTasks / totalTasks) * 100);

  let status: GanttMilestoneOverallStatus;
  if (approvedTasks === totalTasks) {
    status = "APPROVED";
  } else if (rejectedTasks > 0) {
    status = "REJECTED";
  } else if (todayIso > milestone.targetDate) {
    status = "OVERDUE";
  } else {
    status = "PENDING";
  }

  return {
    totalTasks,
    approvedTasks,
    rejectedTasks,
    pendingTasks,
    progressPercent,
    status,
  };
}

export function getMilestoneWeekRange(isoDate: string): MilestoneWeekRange {
  if (!parseTaskDate(isoDate)) {
    return { startIso: isoDate, endIso: isoDate, label: isoDate };
  }
  const day = taskDay(isoDate);
  const utcDay = new Date(day * DAY_MS).getUTCDay();
  const offsetFromMonday = (utcDay + 6) % 7;
  const mondayDay = day - offsetFromMonday;
  const sundayDay = mondayDay + 6;
  const startIso = dayLabel(mondayDay);
  const endIso = dayLabel(sundayDay);

  return {
    startIso,
    endIso,
    label: `Sem. ${formatTaskDate(startIso).slice(0, 5)} – ${formatTaskDate(endIso).slice(0, 5)}`,
  };
}

export function suggestMilestoneTaskIds(
  tasks: readonly Pick<TaskRecord, "id" | "endDate" | "status">[],
  targetDate: string,
): string[] {
  if (!parseTaskDate(targetDate)) return [];
  return tasks
    .filter((task) => task.status !== "CANCELLED" && task.endDate <= targetDate)
    .map((task) => task.id);
}
