import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createTaskSchema, deleteTaskSchema, riskPathSchema, updateMyTaskStatusSchema } from "../tasks";

const valid = {
  teamId: "test", title: "Montar carro", deliveryGroup: "MANUFACTURING_CNC",
  startDate: "2026-11-09", endDate: "2026-11-09", assignments: [],
};

test("accepts a single day and rejects reversed dates and caller-supplied A", () => {
  assert.equal(createTaskSchema.safeParse(valid).success, true);
  assert.equal(createTaskSchema.safeParse({ ...valid, endDate: "2026-11-08" }).success, false);
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

test("validates optional 3-point PERT estimates (O <= M <= P)", () => {
  assert.equal(
    createTaskSchema.safeParse({ ...valid, optimisticDays: 2, mostLikelyDays: 4, pessimisticDays: 8 }).success,
    true,
  );
  assert.equal(
    createTaskSchema.safeParse({ ...valid, optimisticDays: null, mostLikelyDays: null, pessimisticDays: null }).success,
    true,
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
});
