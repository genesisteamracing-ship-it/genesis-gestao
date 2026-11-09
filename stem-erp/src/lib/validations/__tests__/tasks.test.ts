import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createTaskSchema, riskPathSchema } from "../tasks";

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
