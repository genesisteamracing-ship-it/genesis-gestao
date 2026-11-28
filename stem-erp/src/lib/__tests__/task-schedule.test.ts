import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  calculateEndDateFromPertSum,
  computePertTotalDays,
  createsCycle,
  missingLinks,
  parseTaskDate,
  scheduleConflict,
  taskDay,
} from "../task-schedule";

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

test("calcula soma PERT (O + M + P) e data de término a partir da data de início", () => {
  assert.equal(computePertTotalDays(2, 4, 9), 15);
  assert.equal(computePertTotalDays(null, 4, 9), null);
  assert.equal(computePertTotalDays(0, 4, 9), null);
  assert.equal(computePertTotalDays(1.5, 4, 9), null);

  assert.equal(calculateEndDateFromPertSum("2026-11-28", 2, 4, 9), "2026-12-13");
  assert.equal(calculateEndDateFromPertSum("2026-12-30", 1, 2, 3), "2027-01-05");
  assert.equal(calculateEndDateFromPertSum("2024-02-28", 1, 1, 1), "2024-03-02");
  assert.equal(calculateEndDateFromPertSum("2025-02-29", 1, 2, 3), null);
  assert.equal(calculateEndDateFromPertSum("2026-11-28", 2, null, 9), null);
});
