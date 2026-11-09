import assert from "node:assert/strict";
import { test } from "node:test";
import { planWbsDefaults } from "../wbs-default-structure";

test("starts the WBS with four sectors and their ordered subcards", () => {
  const rows = planWbsDefaults("team-a", []);
  assert.deepEqual(rows.filter((row) => row.parentId === null).map((row) => [row.code, row.title]), [
    ["1", "PROJECT MANAGEMENT"], ["2", "ENGINEERING"], ["3", "ENTERPRISE"], ["4", "SOCIAL PROJECT"],
  ]);
  assert.deepEqual(rows.filter((row) => row.parentId !== null).map((row) => [row.code, row.title]), [
    ["1.1", "INITIATING"], ["1.2", "PLANNING"], ["1.3", "EXECUTING AND CONTROLLING"],
    ["2.1", "CAD AND TEST"], ["2.2", "MANUFACTURING"], ["2.3", "DESIGN AND PAINT"],
    ["3.1", "MARKETING"], ["4.1", "PLANNING"], ["4.2", "EXECUTING"],
  ]);
  assert.equal(planWbsDefaults("team-a", rows).length, 0);
  assert.notEqual(planWbsDefaults("team-b", [])[0].id, rows[0].id);
});

test("reuses legacy sectors and phases without replacing other deliverables", () => {
  const existing = [
    { id: "project", teamId: "team-a", code: "1.0", title: "Gestão de Projetos", parentId: null, depth: 1, sortOrder: 0, discipline: "PROJECT_MANAGEMENT" as const },
    { id: "custom", teamId: "team-a", code: "1.1", title: "Portfólio", parentId: "project", depth: 2, sortOrder: 0, discipline: "PROJECT_MANAGEMENT" as const },
    { id: "planning", teamId: "team-a", code: "1.2", title: "Planejamento", parentId: "project", depth: 2, sortOrder: 0, discipline: "PROJECT_MANAGEMENT" as const },
  ];
  const additions = planWbsDefaults("team-a", existing);
  assert.ok(!additions.some((row) => row.code === "1" || row.code === "1.1" || row.code === "1.2"));
  assert.deepEqual(additions.filter((row) => row.parentId === "project").map((row) => row.title), ["INITIATING", "EXECUTING AND CONTROLLING"]);
  assert.ok(additions.every((row) => !existing.some((item) => row.id === item.id)));
  assert.equal(planWbsDefaults("team-a", [...existing, ...additions]).length, 0);
});
