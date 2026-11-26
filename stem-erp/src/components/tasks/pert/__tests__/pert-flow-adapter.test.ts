import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculatePertNetwork } from "@/lib/pert-engine";
import type { TaskEdge, TaskRecord } from "@/types/tasks";
import { buildPertFlowGraph } from "../pert-flow.adapter";

function makeTask(overrides: Partial<TaskRecord> & { id: string; title: string }): TaskRecord {
  return {
    description: null,
    deliveryGroup: "ENGINEERING_CAD",
    startDate: "2026-05-01",
    endDate: "2026-05-03",
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

describe("PERT React Flow Adapter (buildPertFlowGraph)", () => {
  it("positions parallel branches in the same X column and marks critical edges", () => {
    const tasks: TaskRecord[] = [
      makeTask({ id: "A", title: "Início", startDate: "2026-05-01", endDate: "2026-05-02" }),
      makeTask({ id: "B", title: "Frente Crítica", startDate: "2026-05-03", endDate: "2026-05-08" }),
      makeTask({ id: "C", title: "Frente Paralela", startDate: "2026-05-03", endDate: "2026-05-04" }),
      makeTask({ id: "D", title: "Entrega", startDate: "2026-05-09", endDate: "2026-05-10" }),
    ];
    const edges: TaskEdge[] = [
      { predecessorId: "A", successorId: "B" },
      { predecessorId: "A", successorId: "C" },
      { predecessorId: "B", successorId: "D" },
      { predecessorId: "C", successorId: "D" },
    ];

    const network = calculatePertNetwork(tasks, edges);
    const graph = buildPertFlowGraph(network, {
      highlightCriticalOnly: true,
      onSelectTask: () => {},
    });

    assert.equal(graph.nodes.length, 4);
    assert.equal(graph.edges.length, 4);

    const byId = new Map(graph.nodes.map((node) => [node.id, node]));
    assert.equal(byId.get("B")!.position.x, byId.get("C")!.position.x);
    assert.ok(byId.get("A")!.position.x < byId.get("B")!.position.x);
    assert.ok(byId.get("B")!.position.x < byId.get("D")!.position.x);

    assert.equal(byId.get("B")!.data.dimmed, false);
    assert.equal(byId.get("C")!.data.dimmed, true);

    const criticalEdge = graph.edges.find((e) => e.id === "A->B")!;
    const slackEdge = graph.edges.find((e) => e.id === "A->C")!;
    assert.equal(criticalEdge.animated, true);
    assert.equal(slackEdge.animated, false);
  });

  it("returns empty graph when network has a cycle", () => {
    const tasks: TaskRecord[] = [
      makeTask({ id: "1", title: "Um" }),
      makeTask({ id: "2", title: "Dois" }),
    ];
    const edges: TaskEdge[] = [
      { predecessorId: "1", successorId: "2" },
      { predecessorId: "2", successorId: "1" },
    ];

    const network = calculatePertNetwork(tasks, edges);
    const graph = buildPertFlowGraph(network, {
      highlightCriticalOnly: false,
      onSelectTask: () => {},
    });

    assert.equal(graph.nodes.length, 0);
    assert.equal(graph.edges.length, 0);
  });
});
