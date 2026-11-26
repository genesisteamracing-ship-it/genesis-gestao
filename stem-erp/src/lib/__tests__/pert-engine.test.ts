import assert from "node:assert/strict";
import test from "node:test";
import { calculatePertNetwork, computeTaskPertDuration, formatPertDays } from "../pert-engine";
import type { TaskEdge, TaskRecord } from "@/types/tasks";

function makeTask(overrides: Partial<TaskRecord> & { id: string; title: string }): TaskRecord {
  return {
    description: null,
    deliveryGroup: "ENGINEERING_CAD",
    startDate: "2026-05-01",
    endDate: "2026-05-03", // 3 days inclusive
    status: "TODO",
    completedAt: null,
    cancelledAt: null,
    revision: 0,
    optimisticDays: null,
    mostLikelyDays: null,
    pessimisticDays: null,
    roles: [],
    ...overrides,
  };
}

test("computeTaskPertDuration uses 3-point formula (O + 4M + P)/6 when provided", () => {
  const result = computeTaskPertDuration({
    startDate: "2026-05-01",
    endDate: "2026-05-10",
    optimisticDays: 2,
    mostLikelyDays: 5,
    pessimisticDays: 14,
  });

  assert.equal(result.durationSource, "pert");
  assert.equal(result.expectedDuration, 6);
  assert.equal(result.stdDev, 2);
  assert.equal(result.variance, 4);
});

test("computeTaskPertDuration falls back to schedule dates when 3-point estimates are omitted", () => {
  const result = computeTaskPertDuration({
    startDate: "2026-05-01",
    endDate: "2026-05-05",
    optimisticDays: null,
    mostLikelyDays: null,
    pessimisticDays: null,
  });

  assert.equal(result.durationSource, "schedule");
  assert.equal(result.expectedDuration, 5);
  assert.equal(result.stdDev, 0);
  assert.equal(result.variance, 0);
});

test("calculatePertNetwork identifies critical path, slack, and parallelism correctly", () => {
  const tasks: TaskRecord[] = [
    makeTask({ id: "A", title: "Preparo", startDate: "2026-05-01", endDate: "2026-05-02" }), // 2d
    makeTask({ id: "B", title: "CAD Chassi", startDate: "2026-05-03", endDate: "2026-05-07" }), // 5d
    makeTask({ id: "C", title: "Identidade Visual", startDate: "2026-05-03", endDate: "2026-05-04" }), // 2d
    makeTask({ id: "D", title: "Usinagem CNC", startDate: "2026-05-08", endDate: "2026-05-10" }), // 3d
  ];
  const edges: TaskEdge[] = [
    { predecessorId: "A", successorId: "B" },
    { predecessorId: "A", successorId: "C" },
    { predecessorId: "B", successorId: "D" },
    { predecessorId: "C", successorId: "D" },
  ];

  const result = calculatePertNetwork(tasks, edges);

  assert.equal(result.hasCycle, false);
  assert.equal(result.summary.projectDuration, 10);
  assert.equal(result.summary.criticalTaskCount, 3);
  assert.equal(result.summary.maxSlack, 3);
  assert.equal(result.summary.parallelMaxWidth, 2);

  const byId = new Map(result.nodes.map((node) => [node.task.id, node]));
  assert.equal(byId.get("A")?.isCritical, true);
  assert.equal(byId.get("B")?.isCritical, true);
  assert.equal(byId.get("D")?.isCritical, true);

  const taskC = byId.get("C")!;
  assert.equal(taskC.isCritical, false);
  assert.equal(taskC.earlyStart, 2);
  assert.equal(taskC.earlyFinish, 4);
  assert.equal(taskC.lateStart, 5);
  assert.equal(taskC.lateFinish, 7);
  assert.equal(taskC.totalSlack, 3);
  assert.equal(taskC.freeSlack, 3);

  const criticalEdges = result.edges.filter((edge) => edge.isCritical).map((edge) => edge.id);
  assert.deepEqual(criticalEdges.sort(), ["A->B", "B->D"]);
});

test("calculatePertNetwork propagates 3-point variance along critical path and ignores cancelled tasks", () => {
  const tasks: TaskRecord[] = [
    makeTask({ id: "T1", title: "Projeto", optimisticDays: 2, mostLikelyDays: 5, pessimisticDays: 8 }), // Te=5, sd=1, var=1
    makeTask({ id: "T2", title: "Prototipo", optimisticDays: 3, mostLikelyDays: 6, pessimisticDays: 15 }), // Te=7, sd=2, var=4
    makeTask({ id: "T3", title: "Cancelada", status: "CANCELLED", optimisticDays: 10, mostLikelyDays: 10, pessimisticDays: 10 }),
  ];
  const edges: TaskEdge[] = [
    { predecessorId: "T1", successorId: "T2" },
    { predecessorId: "T2", successorId: "T3" },
  ];

  const result = calculatePertNetwork(tasks, edges);

  assert.equal(result.summary.totalTaskCount, 2);
  assert.equal(result.summary.projectDuration, 12);
  assert.equal(result.summary.hasThreePointEstimates, true);
  assert.equal(result.summary.projectVariance, 5);
  assert.equal(result.summary.projectStdDev, 2.24);
});

test("calculatePertNetwork detects dependency cycles gracefully", () => {
  const tasks: TaskRecord[] = [
    makeTask({ id: "X", title: "Tarefa X" }),
    makeTask({ id: "Y", title: "Tarefa Y" }),
  ];
  const edges: TaskEdge[] = [
    { predecessorId: "X", successorId: "Y" },
    { predecessorId: "Y", successorId: "X" },
  ];

  const result = calculatePertNetwork(tasks, edges);

  assert.equal(result.hasCycle, true);
  assert.ok(result.cycleMessage);
  assert.equal(result.nodes.length, 0);
});

test("formatPertDays formats integer and decimal durations cleanly", () => {
  assert.equal(formatPertDays(5), "5");
  assert.equal(formatPertDays(5.0000001), "5");
  assert.equal(formatPertDays(4.5), "4,5");
});
