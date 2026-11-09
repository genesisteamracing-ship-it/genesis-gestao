import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseTaskDate, taskDay, createsCycle, scheduleConflict, missingLinks } from "../task-schedule";

test("validates calendar dates and uses inclusive calendar days", () => {
  assert.equal(parseTaskDate("2025-02-29"), null);
  assert.equal(parseTaskDate("2024-02-29")?.toISOString().slice(0, 10), "2024-02-29");
  assert.equal(taskDay("2025-01-01") - taskDay("2024-12-31"), 1);
  assert.equal(scheduleConflict("2024-12-31", "2025-01-01"), false);
  assert.equal(scheduleConflict("2024-12-31", "2024-12-31"), true);
});

test("detects reverse reachability and preserves missing path steps", () => {
  const edges = [{ predecessorId: "a", successorId: "b" }, { predecessorId: "b", successorId: "c" }];
  assert.equal(createsCycle(edges, "c", "a"), true);
  assert.equal(createsCycle(edges, "a", "c"), false);
  assert.equal(createsCycle(edges, "a", "a"), true);
  assert.deepEqual(missingLinks(["a", "b", "c"], edges.slice(0, 1)), [edges[1]]);
});
