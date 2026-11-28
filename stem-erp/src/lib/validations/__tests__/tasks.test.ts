import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createTaskSchema, deleteTaskSchema, editTaskSchema, riskPathSchema, updateMyTaskStatusSchema } from "../tasks";

const valid = {
  teamId: "test",
  title: "Montar carro",
  deliveryGroup: "MANUFACTURING_CNC",
  startDate: "2026-11-09",
  optimisticDays: 1,
  mostLikelyDays: 2,
  pessimisticDays: 3,
  assignments: [],
};

test("calculates endDate from O+M+P and rejects caller-supplied A or extra keys", () => {
  const parsed = createTaskSchema.safeParse(valid);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.endDate, "2026-11-15");
  }
  assert.equal(createTaskSchema.safeParse({ ...valid, assignments: [{ memberKey: "a", role: "A" }] }).success, false);
  assert.equal(createTaskSchema.safeParse({ ...valid, creatorKey: "a" }).success, false);
});

test("validates unique roles and unique risk steps", () => {
  const member = { memberKey: "a", role: "R" };
  assert.equal(createTaskSchema.safeParse({ ...valid, assignments: [member, member] }).success, false);
  assert.equal(riskPathSchema.safeParse({ teamId: "test", name: "Risco", reason: "Prazo", taskIds: ["a", "a"] }).success, false);
});

test("validates deleteTaskSchema with id and teamId", () => {
  assert.equal(deleteTaskSchema.safeParse({ id: "task-1", teamId: "team-1" }).success, true);
  assert.equal(deleteTaskSchema.safeParse({ id: "task-1" }).success, false);
  assert.equal(deleteTaskSchema.safeParse({ teamId: "team-1" }).success, false);
  assert.equal(deleteTaskSchema.safeParse({ id: "", teamId: "team-1" }).success, false);
});

test("validates updateMyTaskStatusSchema across all statuses and revision", () => {
  for (const status of ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const) {
    assert.equal(
      updateMyTaskStatusSchema.safeParse({ teamId: "team-1", taskId: "task-1", status, revision: 0 }).success,
      true,
    );
  }
  assert.equal(
    updateMyTaskStatusSchema.safeParse({ teamId: "team-1", taskId: "task-1", status: "INVALID", revision: 0 }).success,
    false,
  );
  assert.equal(
    updateMyTaskStatusSchema.safeParse({ teamId: "team-1", taskId: "task-1", status: "DONE", revision: -1 }).success,
    false,
  );
  assert.equal(
    updateMyTaskStatusSchema.safeParse({ teamId: "", taskId: "task-1", status: "DONE", revision: 0 }).success,
    false,
  );
});

test("requires 3-point PERT estimates on create (O <= M <= P) and keeps legacy compatibility on edit", () => {
  assert.equal(
    createTaskSchema.safeParse({ ...valid, optimisticDays: 2, mostLikelyDays: 4, pessimisticDays: 8 }).success,
    true,
  );
  assert.equal(
    createTaskSchema.safeParse({ ...valid, optimisticDays: null, mostLikelyDays: null, pessimisticDays: null }).success,
    false,
  );
  assert.equal(
    createTaskSchema.safeParse({ ...valid, optimisticDays: 2, mostLikelyDays: 4, pessimisticDays: null }).success,
    false,
  );
  assert.equal(
    createTaskSchema.safeParse({ ...valid, optimisticDays: 5, mostLikelyDays: 4, pessimisticDays: 8 }).success,
    false,
  );
  assert.equal(
    createTaskSchema.safeParse({ ...valid, optimisticDays: 2, mostLikelyDays: 9, pessimisticDays: 8 }).success,
    false,
  );

  // Edição de tarefa legada sem PERT continua válida
  assert.equal(
    editTaskSchema.safeParse({
      teamId: "test",
      title: "Tarefa legada",
      deliveryGroup: "MANUFACTURING_CNC",
      startDate: "2026-11-09",
      endDate: "2026-11-12",
      assignments: [],
      id: "task-1",
      revision: 0,
      status: "TODO",
      optimisticDays: null,
      mostLikelyDays: null,
      pessimisticDays: null,
    }).success,
    true,
  );
});
