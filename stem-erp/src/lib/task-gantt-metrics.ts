import { taskDay } from "@/lib/task-schedule";
import type { TaskEdge, TaskRecord } from "@/types/tasks";

export type TaskScheduleSignal = "ON_TRACK" | "AT_RISK" | "DELAYED" | "COMPLETED" | "CANCELLED";

export type MilestoneStatus = "ON_TRACK" | "AT_RISK" | "DELAYED" | "COMPLETED" | "EMPTY";

export type GanttTaskMetrics = {
  shortId: string;
  signal: TaskScheduleSignal;
  signalLabel: string;
  isCritical: boolean;
  deviationDays: number;
};

export type GanttSummary = {
  progressPercent: number;
  criticalCount: number;
  deviationDays: number;
  milestoneStatus: MilestoneStatus;
  milestoneLabel: string;
};

export const TASK_SCHEDULE_SIGNAL_LABELS: Record<TaskScheduleSignal, string> = {
  ON_TRACK: "Em dia",
  AT_RISK: "Atenção",
  DELAYED: "Atrasada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  ON_TRACK: "No prazo",
  AT_RISK: "Sob atenção",
  DELAYED: "Em atraso",
  COMPLETED: "Concluído",
  EMPTY: "Sem atividades",
};

export type GanttMetricTaskInput = Pick<
  TaskRecord,
  "id" | "startDate" | "endDate" | "status"
> & {
  baselineStartDate?: string | null;
  baselineEndDate?: string | null;
  isAtRisk?: boolean;
  isCritical?: boolean;
};

export function getTodayIsoLocal(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converte índice 0-based em identificador curto de planilha:
 * 0 -> "A", 25 -> "Z", 26 -> "AA", 27 -> "AB", ...
 */
export function formatTaskShortId(index: number): string {
  let n = Math.max(0, Math.floor(index));
  let result = "";
  while (true) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
    if (n < 0) break;
  }
  return result;
}

export function resolveBaselineDates(task: GanttMetricTaskInput): {
  baselineStartDate: string;
  baselineEndDate: string;
} {
  return {
    baselineStartDate: task.baselineStartDate || task.startDate,
    baselineEndDate: task.baselineEndDate || task.endDate,
  };
}

export function evaluateTaskScheduleSignal(
  task: GanttMetricTaskInput,
  todayIso: string,
): TaskScheduleSignal {
  if (task.status === "CANCELLED") return "CANCELLED";
  if (task.status === "DONE") return "COMPLETED";

  const { baselineStartDate, baselineEndDate } = resolveBaselineDates(task);
  if (task.endDate > baselineEndDate || todayIso > baselineEndDate) {
    return "DELAYED";
  }

  if (task.isAtRisk) {
    return "AT_RISK";
  }

  const todayDay = taskDay(todayIso);
  const baseStartDay = taskDay(baselineStartDate);
  const baseEndDay = taskDay(baselineEndDate);
  const daysRemaining = baseEndDay - todayDay;

  if (daysRemaining <= 2) {
    return "AT_RISK";
  }

  const totalDuration = Math.max(1, baseEndDay - baseStartDay + 1);
  if (todayDay >= baseStartDay) {
    const elapsedDays = todayDay - baseStartDay + 1;
    if (elapsedDays / totalDuration >= 0.8) {
      return "AT_RISK";
    }
  }

  return "ON_TRACK";
}

export function computeTaskDeviationDays(
  task: GanttMetricTaskInput,
  todayIso: string,
): number {
  if (task.status === "CANCELLED") return 0;
  const { baselineEndDate } = resolveBaselineDates(task);
  const baseEndDay = taskDay(baselineEndDate);
  const endDay = taskDay(task.endDate);
  if (task.status === "DONE") {
    return endDay - baseEndDay;
  }
  const todayDay = taskDay(todayIso);
  const effectiveEnd = todayDay > baseEndDay ? Math.max(endDay, todayDay) : endDay;
  return effectiveEnd - baseEndDay;
}

/**
 * Calcula o conjunto de IDs das atividades críticas combinando:
 * 1) CPM clássico (Forward/Backward Pass com folga total === 0 sobre tarefas ativas)
 * 2) Marcação manual explícita (`task.isCritical === true`)
 */
export function computeCriticalPathIds(
  tasks: readonly GanttMetricTaskInput[],
  edges: readonly TaskEdge[],
): Set<string> {
  const active = tasks.filter((task) => task.status !== "CANCELLED");
  const critical = new Set<string>();
  if (active.length === 0) return critical;

  const byId = new Map(active.map((task) => [task.id, task]));
  const preds = new Map<string, string[]>();
  const succs = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const task of active) {
    preds.set(task.id, []);
    succs.set(task.id, []);
    inDegree.set(task.id, 0);
    if (task.isCritical) critical.add(task.id);
  }

  for (const edge of edges) {
    if (!byId.has(edge.predecessorId) || !byId.has(edge.successorId)) continue;
    if (edge.predecessorId === edge.successorId) continue;
    preds.get(edge.successorId)!.push(edge.predecessorId);
    succs.get(edge.predecessorId)!.push(edge.successorId);
    inDegree.set(edge.successorId, (inDegree.get(edge.successorId) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(id);
  }

  const topo: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    topo.push(id);
    for (const next of succs.get(id) ?? []) {
      const nextDegree = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, nextDegree);
      if (nextDegree === 0) queue.push(next);
    }
  }

  // Fallback seguro caso existam ciclos inesperados no input
  if (topo.length < active.length) {
    const seen = new Set(topo);
    for (const task of active) {
      if (!seen.has(task.id)) topo.push(task.id);
    }
  }

  const duration = new Map<string, number>();
  const earlyStart = new Map<string, number>();
  const earlyFinish = new Map<string, number>();

  for (const id of topo) {
    const task = byId.get(id)!;
    const start = taskDay(task.startDate);
    const end = taskDay(task.endDate);
    const dur = Math.max(1, end - start + 1);
    duration.set(id, dur);

    let es = start;
    for (const predId of preds.get(id) ?? []) {
      const predEf = earlyFinish.get(predId);
      if (predEf !== undefined) {
        es = Math.max(es, predEf + 1);
      }
    }
    earlyStart.set(id, es);
    earlyFinish.set(id, es + dur - 1);
  }

  let projectFinish = -Infinity;
  for (const ef of earlyFinish.values()) {
    if (ef > projectFinish) projectFinish = ef;
  }

  const lateFinish = new Map<string, number>();
  const lateStart = new Map<string, number>();

  for (let i = topo.length - 1; i >= 0; i--) {
    const id = topo[i];
    const nextList = succs.get(id) ?? [];
    let lf = projectFinish;
    if (nextList.length > 0) {
      lf = Math.min(...nextList.map((succId) => (lateStart.get(succId) ?? projectFinish + 1) - 1));
    }
    const dur = duration.get(id) ?? 1;
    lateFinish.set(id, lf);
    lateStart.set(id, lf - dur + 1);
  }

  for (const id of topo) {
    const es = earlyStart.get(id) ?? 0;
    const ls = lateStart.get(id) ?? 0;
    if (ls - es <= 0) {
      critical.add(id);
    }
  }

  return critical;
}

export function buildGanttTaskMetricsMap(
  tasks: readonly GanttMetricTaskInput[],
  edges: readonly TaskEdge[],
  todayIso: string,
): Map<string, GanttTaskMetrics> {
  const criticalIds = computeCriticalPathIds(tasks, edges);
  const map = new Map<string, GanttTaskMetrics>();

  tasks.forEach((task, index) => {
    const signal = evaluateTaskScheduleSignal(task, todayIso);
    map.set(task.id, {
      shortId: formatTaskShortId(index),
      signal,
      signalLabel: TASK_SCHEDULE_SIGNAL_LABELS[signal],
      isCritical: criticalIds.has(task.id),
      deviationDays: computeTaskDeviationDays(task, todayIso),
    });
  });

  return map;
}

export function computeGanttSummary(
  tasks: readonly GanttMetricTaskInput[],
  edges: readonly TaskEdge[],
  todayIso: string,
): GanttSummary {
  const active = tasks.filter((task) => task.status !== "CANCELLED");
  if (active.length === 0) {
    return {
      progressPercent: 0,
      criticalCount: 0,
      deviationDays: 0,
      milestoneStatus: "EMPTY",
      milestoneLabel: MILESTONE_STATUS_LABELS.EMPTY,
    };
  }

  const criticalIds = computeCriticalPathIds(active, edges);
  const todayDay = taskDay(todayIso);

  let weightedProgress = 0;
  let maxBaselineEnd = -Infinity;
  let maxEffectiveEnd = -Infinity;
  let allDone = true;
  let hasCriticalDelayed = false;
  let hasCriticalAtRisk = false;
  let hasAnyDelayedOrAtRisk = false;

  for (const task of active) {
    if (task.status === "DONE") {
      weightedProgress += 100;
    } else {
      allDone = false;
      if (task.status === "IN_PROGRESS") {
        weightedProgress += 50;
      }
    }

    const { baselineEndDate } = resolveBaselineDates(task);
    const baseEndDay = taskDay(baselineEndDate);
    const endDay = taskDay(task.endDate);
    const effectiveEnd = task.status !== "DONE" && todayDay > endDay ? todayDay : endDay;

    if (baseEndDay > maxBaselineEnd) maxBaselineEnd = baseEndDay;
    if (effectiveEnd > maxEffectiveEnd) maxEffectiveEnd = effectiveEnd;

    const signal = evaluateTaskScheduleSignal(task, todayIso);
    const isCritical = criticalIds.has(task.id);

    if (isCritical && signal === "DELAYED") hasCriticalDelayed = true;
    if (isCritical && signal === "AT_RISK") hasCriticalAtRisk = true;
    if (signal === "DELAYED" || signal === "AT_RISK") hasAnyDelayedOrAtRisk = true;
  }

  const progressPercent = Math.round(weightedProgress / active.length);
  const deviationDays = maxEffectiveEnd - maxBaselineEnd;

  let milestoneStatus: MilestoneStatus;
  if (allDone) {
    milestoneStatus = "COMPLETED";
  } else if (deviationDays > 0 || hasCriticalDelayed) {
    milestoneStatus = "DELAYED";
  } else if (hasCriticalAtRisk || hasAnyDelayedOrAtRisk) {
    milestoneStatus = "AT_RISK";
  } else {
    milestoneStatus = "ON_TRACK";
  }

  return {
    progressPercent,
    criticalCount: criticalIds.size,
    deviationDays,
    milestoneStatus,
    milestoneLabel: MILESTONE_STATUS_LABELS[milestoneStatus],
  };
}

export function formatDeviationDays(days: number): string {
  if (days > 0) return `+${days} ${days === 1 ? "dia" : "dias"}`;
  if (days < 0) return `${days} ${days === -1 ? "dia" : "dias"}`;
  return "0 dias";
}
