import { taskDay } from "@/lib/task-schedule";
import type { TaskEdge, TaskRecord } from "@/types/tasks";

const EPSILON = 1e-6;

export type PertDurationSource = "pert" | "schedule";

export interface PertTaskMetrics {
  task: TaskRecord;
  durationSource: PertDurationSource;
  optimisticDays: number | null;
  mostLikelyDays: number | null;
  pessimisticDays: number | null;
  expectedDuration: number;
  stdDev: number;
  variance: number;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  totalSlack: number;
  freeSlack: number;
  isCritical: boolean;
  level: number;
  predecessorIds: string[];
  successorIds: string[];
}

export interface PertEdgeMetrics {
  id: string;
  predecessorId: string;
  successorId: string;
  isCritical: boolean;
}

export interface PertSummary {
  projectDuration: number;
  projectVariance: number;
  projectStdDev: number;
  totalTaskCount: number;
  criticalTaskCount: number;
  dependencyCount: number;
  maxSlack: number;
  parallelMaxWidth: number;
  hasThreePointEstimates: boolean;
}

export interface PertNetworkResult {
  hasCycle: boolean;
  cycleMessage: string | null;
  nodes: PertTaskMetrics[];
  edges: PertEdgeMetrics[];
  summary: PertSummary;
}

function roundMetric(value: number): number {
  if (Math.abs(value) <= EPSILON) return 0;
  return Math.round(value * 100) / 100;
}

export function formatPertDays(value: number): string {
  const rounded = roundMetric(value);
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function computeTaskPertDuration(task: Pick<TaskRecord, "startDate" | "endDate" | "optimisticDays" | "mostLikelyDays" | "pessimisticDays">): {
  durationSource: PertDurationSource;
  expectedDuration: number;
  stdDev: number;
  variance: number;
} {
  const o = task.optimisticDays ?? null;
  const m = task.mostLikelyDays ?? null;
  const p = task.pessimisticDays ?? null;

  if (o !== null && m !== null && p !== null && o > 0 && o <= m && m <= p) {
    const expectedDuration = (o + 4 * m + p) / 6;
    const stdDev = (p - o) / 6;
    return {
      durationSource: "pert",
      expectedDuration,
      stdDev,
      variance: stdDev * stdDev,
    };
  }

  const scheduleDays = Math.max(1, taskDay(task.endDate) - taskDay(task.startDate) + 1);
  return {
    durationSource: "schedule",
    expectedDuration: scheduleDays,
    stdDev: 0,
    variance: 0,
  };
}

export function calculatePertNetwork(
  tasks: readonly TaskRecord[],
  edges: readonly TaskEdge[],
): PertNetworkResult {
  const activeTasks = tasks.filter((task) => task.status !== "CANCELLED");
  const emptySummary: PertSummary = {
    projectDuration: 0,
    projectVariance: 0,
    projectStdDev: 0,
    totalTaskCount: 0,
    criticalTaskCount: 0,
    dependencyCount: 0,
    maxSlack: 0,
    parallelMaxWidth: 0,
    hasThreePointEstimates: false,
  };

  if (activeTasks.length === 0) {
    return {
      hasCycle: false,
      cycleMessage: null,
      nodes: [],
      edges: [],
      summary: emptySummary,
    };
  }

  const taskMap = new Map(activeTasks.map((task) => [task.id, task]));
  const predecessors = new Map<string, string[]>();
  const successors = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const task of activeTasks) {
    predecessors.set(task.id, []);
    successors.set(task.id, []);
    inDegree.set(task.id, 0);
  }

  const validEdges: TaskEdge[] = [];
  const seenEdgeKeys = new Set<string>();

  for (const edge of edges) {
    if (edge.predecessorId === edge.successorId) continue;
    if (!taskMap.has(edge.predecessorId) || !taskMap.has(edge.successorId)) continue;
    const key = `${edge.predecessorId}->${edge.successorId}`;
    if (seenEdgeKeys.has(key)) continue;
    seenEdgeKeys.add(key);

    validEdges.push(edge);
    successors.get(edge.predecessorId)!.push(edge.successorId);
    predecessors.get(edge.successorId)!.push(edge.predecessorId);
    inDegree.set(edge.successorId, (inDegree.get(edge.successorId) ?? 0) + 1);
  }

  // Kahn's algorithm for topological ordering & cycle detection
  const queue: string[] = [];
  for (const task of activeTasks) {
    if ((inDegree.get(task.id) ?? 0) === 0) {
      queue.push(task.id);
    }
  }

  const topoOrder: string[] = [];
  let cursor = 0;
  while (cursor < queue.length) {
    const currentId = queue[cursor++];
    topoOrder.push(currentId);
    for (const nextId of successors.get(currentId) ?? []) {
      const nextDegree = (inDegree.get(nextId) ?? 1) - 1;
      inDegree.set(nextId, nextDegree);
      if (nextDegree === 0) {
        queue.push(nextId);
      }
    }
  }

  if (topoOrder.length !== activeTasks.length) {
    return {
      hasCycle: true,
      cycleMessage:
        "Foi detectada uma dependência circular entre as tarefas. Remova o ciclo para calcular a Rede PERT.",
      nodes: [],
      edges: [],
      summary: {
        ...emptySummary,
        totalTaskCount: activeTasks.length,
        dependencyCount: validEdges.length,
      },
    };
  }

  const durations = new Map<string, ReturnType<typeof computeTaskPertDuration>>();
  const earlyStart = new Map<string, number>();
  const earlyFinish = new Map<string, number>();
  const levelMap = new Map<string, number>();

  // Forward pass
  let projectDuration = 0;
  for (const taskId of topoOrder) {
    const task = taskMap.get(taskId)!;
    const durationInfo = computeTaskPertDuration(task);
    durations.set(taskId, durationInfo);

    const preds = predecessors.get(taskId) ?? [];
    let es = 0;
    let level = 0;
    for (const predId of preds) {
      const predEf = earlyFinish.get(predId) ?? 0;
      if (predEf > es) es = predEf;
      const predLevel = levelMap.get(predId) ?? 0;
      if (predLevel + 1 > level) level = predLevel + 1;
    }

    const ef = es + durationInfo.expectedDuration;
    earlyStart.set(taskId, es);
    earlyFinish.set(taskId, ef);
    levelMap.set(taskId, level);
    if (ef > projectDuration) projectDuration = ef;
  }

  // Backward pass
  const lateStart = new Map<string, number>();
  const lateFinish = new Map<string, number>();

  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const taskId = topoOrder[i];
    const durationInfo = durations.get(taskId)!;
    const succs = successors.get(taskId) ?? [];

    let lf = projectDuration;
    if (succs.length > 0) {
      lf = Math.min(...succs.map((succId) => lateStart.get(succId) ?? projectDuration));
    }
    const ls = lf - durationInfo.expectedDuration;

    lateFinish.set(taskId, lf);
    lateStart.set(taskId, ls);
  }

  const metricsById = new Map<string, PertTaskMetrics>();
  const levelCounts = new Map<number, number>();
  let criticalTaskCount = 0;
  let maxSlack = 0;
  let hasThreePointEstimates = false;

  for (const taskId of topoOrder) {
    const task = taskMap.get(taskId)!;
    const durationInfo = durations.get(taskId)!;
    const es = earlyStart.get(taskId) ?? 0;
    const ef = earlyFinish.get(taskId) ?? 0;
    const ls = lateStart.get(taskId) ?? 0;
    const lf = lateFinish.get(taskId) ?? 0;
    const rawTotalSlack = ls - es;
    const totalSlack = rawTotalSlack <= EPSILON ? 0 : rawTotalSlack;

    const succs = successors.get(taskId) ?? [];
    const rawFreeSlack =
      succs.length === 0
        ? projectDuration - ef
        : Math.min(...succs.map((succId) => earlyStart.get(succId) ?? projectDuration)) - ef;
    const freeSlack = rawFreeSlack <= EPSILON ? 0 : rawFreeSlack;

    const isCritical = totalSlack <= EPSILON;
    if (isCritical) criticalTaskCount++;
    if (totalSlack > maxSlack) maxSlack = totalSlack;
    if (durationInfo.durationSource === "pert") hasThreePointEstimates = true;

    const level = levelMap.get(taskId) ?? 0;
    levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);

    metricsById.set(taskId, {
      task,
      durationSource: durationInfo.durationSource,
      optimisticDays: task.optimisticDays ?? null,
      mostLikelyDays: task.mostLikelyDays ?? null,
      pessimisticDays: task.pessimisticDays ?? null,
      expectedDuration: roundMetric(durationInfo.expectedDuration),
      stdDev: roundMetric(durationInfo.stdDev),
      variance: roundMetric(durationInfo.variance),
      earlyStart: roundMetric(es),
      earlyFinish: roundMetric(ef),
      lateStart: roundMetric(ls),
      lateFinish: roundMetric(lf),
      totalSlack: roundMetric(totalSlack),
      freeSlack: roundMetric(freeSlack),
      isCritical,
      level,
      predecessorIds: predecessors.get(taskId) ?? [],
      successorIds: succs,
    });
  }

  // Max variance along any critical path (DP over critical DAG)
  const criticalPathVariance = new Map<string, number>();
  let projectVariance = 0;

  for (const taskId of topoOrder) {
    const metric = metricsById.get(taskId)!;
    if (!metric.isCritical) continue;
    const durationInfo = durations.get(taskId)!;
    let maxPredVar = 0;
    for (const predId of metric.predecessorIds) {
      const predMetric = metricsById.get(predId);
      if (!predMetric?.isCritical) continue;
      if (Math.abs((earlyStart.get(taskId) ?? 0) - (earlyFinish.get(predId) ?? 0)) <= EPSILON) {
        maxPredVar = Math.max(maxPredVar, criticalPathVariance.get(predId) ?? 0);
      }
    }
    const currentVar = maxPredVar + durationInfo.variance;
    criticalPathVariance.set(taskId, currentVar);
    if (Math.abs((earlyFinish.get(taskId) ?? 0) - projectDuration) <= EPSILON) {
      projectVariance = Math.max(projectVariance, currentVar);
    }
  }

  const pertEdges: PertEdgeMetrics[] = validEdges.map((edge) => {
    const source = metricsById.get(edge.predecessorId)!;
    const target = metricsById.get(edge.successorId)!;
    const tightLink =
      Math.abs((earlyStart.get(edge.successorId) ?? 0) - (earlyFinish.get(edge.predecessorId) ?? 0)) <=
      EPSILON;
    return {
      id: `${edge.predecessorId}->${edge.successorId}`,
      predecessorId: edge.predecessorId,
      successorId: edge.successorId,
      isCritical: source.isCritical && target.isCritical && tightLink,
    };
  });

  const nodes = topoOrder.map((id) => metricsById.get(id)!);
  const parallelMaxWidth = Math.max(0, ...levelCounts.values());

  return {
    hasCycle: false,
    cycleMessage: null,
    nodes,
    edges: pertEdges,
    summary: {
      projectDuration: roundMetric(projectDuration),
      projectVariance: roundMetric(projectVariance),
      projectStdDev: roundMetric(Math.sqrt(projectVariance)),
      totalTaskCount: nodes.length,
      criticalTaskCount,
      dependencyCount: pertEdges.length,
      maxSlack: roundMetric(maxSlack),
      parallelMaxWidth,
      hasThreePointEstimates,
    },
  };
}
