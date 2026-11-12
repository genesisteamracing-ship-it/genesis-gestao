import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { createsCycle, edgeKey, reorderItems, resizeTaskDates, scheduleConflict } from "@/lib/task-schedule";
import { reorderTasksSchema, rescheduleTaskSchema } from "@/lib/validations/tasks";
import type { TaskEdge } from "@/types/tasks";

describe("Gantt Interactive Dependency & Drag-to-Connect Engine", () => {
  it("permite conexão válida entre tarefas independentes", () => {
    const edges: TaskEdge[] = [
      { predecessorId: "task-1", successorId: "task-2" },
    ];
    // task-2 para task-3 é permitido
    assert.equal(createsCycle(edges, "task-2", "task-3"), false);
    // task-1 para task-3 é permitido
    assert.equal(createsCycle(edges, "task-1", "task-3"), false);
  });

  it("impede conexão para si mesma (auto-dependência)", () => {
    const edges: TaskEdge[] = [];
    assert.equal(createsCycle(edges, "task-1", "task-1"), true);
  });

  it("detecta e bloqueia ciclos diretos e transitivos ao puxar dependência", () => {
    const edges: TaskEdge[] = [
      { predecessorId: "cfd-1", successorId: "cad-1" },
      { predecessorId: "cad-1", successorId: "milling-1" },
    ];
    // Ciclo direto: tentar conectar cad-1 -> cfd-1
    assert.equal(createsCycle(edges, "cad-1", "cfd-1"), true);
    // Ciclo transitivo: tentar conectar milling-1 -> cfd-1
    assert.equal(createsCycle(edges, "milling-1", "cfd-1"), true);
    // Mas conectar cfd-1 -> milling-1 é permitido (mesmo sentido)
    assert.equal(createsCycle(edges, "cfd-1", "milling-1"), false);
  });

  it("identifica corretamente dependências duplicadas via edgeKey", () => {
    const edgeA: TaskEdge = { predecessorId: "task-a", successorId: "task-b" };
    const edgeB: TaskEdge = { predecessorId: "task-a", successorId: "task-b" };
    const edgeC: TaskEdge = { predecessorId: "task-b", successorId: "task-a" };

    assert.equal(edgeKey(edgeA), edgeKey(edgeB));
    assert.notEqual(edgeKey(edgeA), edgeKey(edgeC));
  });

  it("identifica conflito temporal quando predecessora termina após início da sucessora", () => {
    // Caso 1: CFD termina 15/11 e CAD começa 10/11 -> conflito
    assert.equal(scheduleConflict("2026-11-15", "2026-11-10"), true);
    // Caso 2: CFD termina 10/11 e CAD começa 10/11 -> conflito (mesmo dia)
    assert.equal(scheduleConflict("2026-11-10", "2026-11-10"), true);
    // Caso 3: CFD termina 10/11 e CAD começa 11/11 -> sem conflito
    assert.equal(scheduleConflict("2026-11-10", "2026-11-11"), false);
  });

  it("simula adição e remoção otimista de arestas no Gantt", () => {
    let edges: TaskEdge[] = [{ predecessorId: "a", successorId: "b" }];

    // Adição otimista
    const newEdge: TaskEdge = { predecessorId: "b", successorId: "c" };
    edges = [...edges, newEdge];
    assert.equal(edges.length, 2);
    assert.deepEqual(edges[1], newEdge);

    // Remoção otimista
    edges = edges.filter(
      (e) => !(e.predecessorId === "a" && e.successorId === "b")
    );
    assert.equal(edges.length, 1);
    assert.deepEqual(edges[0], newEdge);
  });

  it("ajusta data fim ao puxar aresta direita e respeita limite mínimo na data início", () => {
    const stretched = resizeTaskDates({
      startDate: "2026-11-10",
      endDate: "2026-11-12",
      edge: "end",
      deltaDays: 3,
    });
    assert.deepEqual(stretched, { startDate: "2026-11-10", endDate: "2026-11-15" });

    const clamped = resizeTaskDates({
      startDate: "2026-11-10",
      endDate: "2026-11-12",
      edge: "end",
      deltaDays: -10,
    });
    assert.deepEqual(clamped, { startDate: "2026-11-10", endDate: "2026-11-10" });
  });

  it("ajusta data início ao puxar aresta esquerda (diminuindo ou avançando até o fim)", () => {
    const earlier = resizeTaskDates({
      startDate: "2026-11-10",
      endDate: "2026-11-12",
      edge: "start",
      deltaDays: -4,
    });
    assert.deepEqual(earlier, { startDate: "2026-11-06", endDate: "2026-11-12" });

    const clamped = resizeTaskDates({
      startDate: "2026-11-10",
      endDate: "2026-11-12",
      edge: "start",
      deltaDays: 8,
    });
    assert.deepEqual(clamped, { startDate: "2026-11-12", endDate: "2026-11-12" });
  });

  it("reordena tarefas para cima e para baixo preservando integridade da lista", () => {
    const items = [{ id: "t1" }, { id: "t2" }, { id: "t3" }, { id: "t4" }];

    const movedDown = reorderItems(items, "t1", 2);
    assert.deepEqual(
      movedDown.map((item) => item.id),
      ["t2", "t3", "t1", "t4"],
    );

    const movedUp = reorderItems(movedDown, "t4", 0);
    assert.deepEqual(
      movedUp.map((item) => item.id),
      ["t4", "t2", "t3", "t1"],
    );
  });

  it("valida schemas de reagendamento e reordenação persistente", () => {
    assert.equal(
      rescheduleTaskSchema.safeParse({
        teamId: "team-1",
        taskId: "task-1",
        startDate: "2026-11-10",
        endDate: "2026-11-15",
        revision: 0,
      }).success,
      true,
    );
    assert.equal(
      rescheduleTaskSchema.safeParse({
        teamId: "team-1",
        taskId: "task-1",
        startDate: "2026-11-15",
        endDate: "2026-11-10",
        revision: 0,
      }).success,
      false,
    );
    assert.equal(
      reorderTasksSchema.safeParse({
        teamId: "team-1",
        taskIds: ["t1", "t2", "t1"],
      }).success,
      false,
    );
    assert.equal(
      reorderTasksSchema.safeParse({
        teamId: "team-1",
        taskIds: ["t2", "t1", "t3"],
      }).success,
      true,
    );
  });
});
