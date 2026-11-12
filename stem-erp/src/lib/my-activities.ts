import type { TaskStatus } from "@prisma/client";
import type { TaskRecord } from "@/types/tasks";

export type DeadlineUrgency =
  | "OVERDUE"
  | "DUE_TODAY"
  | "DUE_SOON"
  | "ON_TRACK"
  | "COMPLETED"
  | "CANCELLED";

export type DeadlineFilter = "ALL" | "OVERDUE" | "THIS_WEEK" | "NEXT_15_DAYS";
export type StatusFilter = "ALL" | TaskStatus;

export type MyActivityItem = {
  task: TaskRecord;
  urgency: DeadlineUrgency;
  daysRemaining: number;
  deadlineLabel: string;
  isOverdue: boolean;
  isOnTimeCompletion: boolean | null;
};

export type UserActivityKpis = {
  totalAssigned: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  cancelledCount: number;
  onTimeCompletedCount: number;
  completionRate: number;
  punctualityRate: number | null;
};

const MS_PER_DAY = 86_400_000;

export function getTodayIsoDate(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const day = String(referenceDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toUtcMidnightMs(isoDate: string): number {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function diffCalendarDays(fromIso: string, toIso: string): number {
  return Math.round((toUtcMidnightMs(toIso) - toUtcMidnightMs(fromIso)) / MS_PER_DAY);
}

export function classifyDeadlineUrgency(
  status: TaskStatus,
  endDate: string,
  todayIso: string,
): DeadlineUrgency {
  if (status === "DONE") return "COMPLETED";
  if (status === "CANCELLED") return "CANCELLED";
  const days = diffCalendarDays(todayIso, endDate);
  if (days < 0) return "OVERDUE";
  if (days === 0) return "DUE_TODAY";
  if (days <= 7) return "DUE_SOON";
  return "ON_TRACK";
}

export function formatDeadlineCountdown(
  urgency: DeadlineUrgency,
  daysRemaining: number,
): string {
  if (urgency === "COMPLETED") return "Concluída";
  if (urgency === "CANCELLED") return "Cancelada";
  if (urgency === "OVERDUE") {
    const absDays = Math.abs(daysRemaining);
    return absDays === 1 ? "Atrasada há 1 dia" : `Atrasada há ${absDays} dias`;
  }
  if (urgency === "DUE_TODAY") return "Vence hoje";
  if (daysRemaining === 1) return "Vence amanhã";
  return `Vence em ${daysRemaining} dias`;
}

export function isUserAssignedToTask(task: TaskRecord, userId: string): boolean {
  return task.roles.some((entry) => entry.role === "R" && entry.person.key === userId);
}

function isTaskCompletedOnTime(task: TaskRecord): boolean | null {
  if (task.status !== "DONE") return null;
  if (!task.completedAt) return true;
  return task.completedAt.slice(0, 10) <= task.endDate;
}

export function buildMyActivityItems(
  tasks: TaskRecord[],
  userId: string,
  todayIso = getTodayIsoDate(),
): MyActivityItem[] {
  return tasks
    .filter((task) => isUserAssignedToTask(task, userId))
    .map((task) => {
      const daysRemaining = diffCalendarDays(todayIso, task.endDate);
      const urgency = classifyDeadlineUrgency(task.status, task.endDate, todayIso);
      return {
        task,
        urgency,
        daysRemaining,
        deadlineLabel: formatDeadlineCountdown(urgency, daysRemaining),
        isOverdue: urgency === "OVERDUE",
        isOnTimeCompletion: isTaskCompletedOnTime(task),
      };
    });
}

function statusSortRank(status: TaskStatus): number {
  if (status === "TODO" || status === "IN_PROGRESS") return 0;
  if (status === "DONE") return 1;
  return 2;
}

export function sortMyActivities(items: MyActivityItem[]): MyActivityItem[] {
  return [...items].sort((a, b) => {
    const rankDiff = statusSortRank(a.task.status) - statusSortRank(b.task.status);
    if (rankDiff !== 0) return rankDiff;
    if (statusSortRank(a.task.status) === 0) {
      if (a.daysRemaining !== b.daysRemaining) return a.daysRemaining - b.daysRemaining;
    } else if (a.task.endDate !== b.task.endDate) {
      return b.task.endDate.localeCompare(a.task.endDate);
    }
    return a.task.title.localeCompare(b.task.title, "pt-BR");
  });
}

export function filterMyActivities(
  items: MyActivityItem[],
  filters: { search: string; status: StatusFilter; deadline: DeadlineFilter },
): MyActivityItem[] {
  const query = filters.search.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.status !== "ALL" && item.task.status !== filters.status) return false;
    const isFinalized = item.task.status === "DONE" || item.task.status === "CANCELLED";
    if (filters.deadline === "OVERDUE" && !item.isOverdue) return false;
    if (filters.deadline === "THIS_WEEK" && (isFinalized || item.daysRemaining < 0 || item.daysRemaining > 7)) {
      return false;
    }
    if (filters.deadline === "NEXT_15_DAYS" && (isFinalized || item.daysRemaining < 0 || item.daysRemaining > 15)) {
      return false;
    }
    if (query) {
      const matchesTitle = item.task.title.toLowerCase().includes(query);
      const matchesDescription = (item.task.description ?? "").toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) return false;
    }
    return true;
  });
}

export function calculateUserActivityKpis(items: MyActivityItem[]): UserActivityKpis {
  let completedCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  let cancelledCount = 0;
  let onTimeCompletedCount = 0;

  for (const item of items) {
    if (item.task.status === "DONE") {
      completedCount++;
      if (item.isOnTimeCompletion) onTimeCompletedCount++;
    } else if (item.task.status === "CANCELLED") {
      cancelledCount++;
    } else {
      pendingCount++;
      if (item.isOverdue) overdueCount++;
    }
  }

  const totalAssigned = items.length;
  const activeBase = totalAssigned - cancelledCount;
  const completionRate = activeBase > 0 ? Math.round((completedCount / activeBase) * 100) : 0;
  const punctualityRate = completedCount > 0 ? Math.round((onTimeCompletedCount / completedCount) * 100) : null;

  return {
    totalAssigned,
    completedCount,
    pendingCount,
    overdueCount,
    cancelledCount,
    onTimeCompletedCount,
    completionRate,
    punctualityRate,
  };
}
