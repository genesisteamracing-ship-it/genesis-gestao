import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTaskSchema, editTaskSchema } from "../tasks";

const baseCreateInput = {
  teamId: "team-1",
  title: "Projeto CAD",
  deliveryGroup: "ENGINEERING_CAD" as const,
  startDate: "2026-11-01",
  optimisticDays: 2,
  mostLikelyDays: 3,
  pessimisticDays: 4,
  assignments: [],
};

const baseEditInput = {
  ...baseCreateInput,
  endDate: "2026-11-10",
};

describe("validations/tasks (linha de base, PERT obrigatório e flags de cronograma)", () => {
  it("aceita createTaskSchema com isAtRisk/isCritical e calcula endDate por O+M+P", () => {
    const parsed = createTaskSchema.safeParse({
      ...baseCreateInput,
      endDate: "2026-11-02", // ignorado em favor de 2026-11-01 + (2+3+4 = 9 dias)
      isAtRisk: true,
      isCritical: true,
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.isAtRisk, true);
      assert.equal(parsed.data.isCritical, true);
      assert.equal(parsed.data.endDate, "2026-11-10");
    }
  });

  it("rejeita createTaskSchema quando faltam estimativas PERT", () => {
    const parsed = createTaskSchema.safeParse({
      teamId: "team-1",
      title: "Sem PERT",
      deliveryGroup: "ENGINEERING_CAD",
      startDate: "2026-11-01",
      assignments: [],
    });
    assert.equal(parsed.success, false);
  });

  it("rejeita editTaskSchema quando endDate < startDate em tarefa legada sem PERT", () => {
    const parsed = editTaskSchema.safeParse({
      teamId: "team-1",
      title: "Projeto CAD",
      deliveryGroup: "ENGINEERING_CAD",
      startDate: "2026-11-15",
      endDate: "2026-11-10",
      assignments: [],
      id: "task-1",
      revision: 1,
      status: "TODO",
    });
    assert.equal(parsed.success, false);
  });

  it("aceita editTaskSchema com linha de base válida e recalcula endDate pelo PERT", () => {
    const parsed = editTaskSchema.safeParse({
      ...baseEditInput,
      id: "task-1",
      revision: 1,
      status: "IN_PROGRESS",
      baselineStartDate: "2026-11-01",
      baselineEndDate: "2026-11-08",
      isAtRisk: false,
      isCritical: true,
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.endDate, "2026-11-10");
    }
  });

  it("rejeita editTaskSchema quando baselineEndDate < baselineStartDate", () => {
    const parsed = editTaskSchema.safeParse({
      ...baseEditInput,
      id: "task-1",
      revision: 1,
      status: "IN_PROGRESS",
      baselineStartDate: "2026-11-10",
      baselineEndDate: "2026-11-05",
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.match(parsed.error.issues[0].message, /linha de base/i);
    }
  });

  it("rejeita editTaskSchema quando apenas uma data da linha de base é informada", () => {
    const parsed = editTaskSchema.safeParse({
      ...baseEditInput,
      id: "task-1",
      revision: 1,
      status: "TODO",
      baselineStartDate: "2026-11-01",
    });
    assert.equal(parsed.success, false);
  });
});
