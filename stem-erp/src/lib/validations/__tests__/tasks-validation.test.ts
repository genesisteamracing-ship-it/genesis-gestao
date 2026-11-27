import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createTaskSchema, editTaskSchema } from "../tasks";

const baseInput = {
  teamId: "team-1",
  title: "Projeto CAD",
  deliveryGroup: "ENGINEERING_CAD" as const,
  startDate: "2026-11-01",
  endDate: "2026-11-10",
  assignments: [],
};

describe("validations/tasks (linha de base e flags de cronograma)", () => {
  it("aceita createTaskSchema com isAtRisk e isCritical opcionais", () => {
    const parsed = createTaskSchema.safeParse({
      ...baseInput,
      isAtRisk: true,
      isCritical: true,
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.isAtRisk, true);
      assert.equal(parsed.data.isCritical, true);
    }
  });

  it("rejeita createTaskSchema quando endDate < startDate", () => {
    const parsed = createTaskSchema.safeParse({
      ...baseInput,
      startDate: "2026-11-15",
      endDate: "2026-11-10",
    });
    assert.equal(parsed.success, false);
  });

  it("aceita editTaskSchema com linha de base válida", () => {
    const parsed = editTaskSchema.safeParse({
      ...baseInput,
      id: "task-1",
      revision: 1,
      status: "IN_PROGRESS",
      baselineStartDate: "2026-11-01",
      baselineEndDate: "2026-11-08",
      isAtRisk: false,
      isCritical: true,
    });
    assert.equal(parsed.success, true);
  });

  it("rejeita editTaskSchema quando baselineEndDate < baselineStartDate", () => {
    const parsed = editTaskSchema.safeParse({
      ...baseInput,
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
      ...baseInput,
      id: "task-1",
      revision: 1,
      status: "TODO",
      baselineStartDate: "2026-11-01",
    });
    assert.equal(parsed.success, false);
  });
});
