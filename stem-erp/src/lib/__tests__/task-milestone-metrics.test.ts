import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateMilestoneSummary,
  evaluateMilestoneTask,
  getMilestoneWeekRange,
  suggestMilestoneTaskIds,
} from "@/lib/task-milestone-metrics";
import {
  deleteMilestoneSchema,
  saveMilestoneSchema,
  updateMilestoneCheckSchema,
} from "@/lib/validations/tasks";
import type { TaskMilestoneRecord, TaskRecord } from "@/types/tasks";

function makeMilestone(overrides: Partial<TaskMilestoneRecord> = {}): TaskMilestoneRecord {
  return {
    id: "m1",
    title: "Marco Semana 2",
    description: null,
    targetDate: "2026-05-24",
    revision: 0,
    criteria: [
      { id: "c1", title: "Modelo CAD sem interferências", sortOrder: 0 },
      { id: "c2", title: "Massa dentro do regulamento", sortOrder: 1 },
    ],
    taskIds: ["t1", "t2"],
    checks: [],
    ...overrides,
  };
}

test("evaluateMilestoneTask calcula vereditos APPROVED, REJECTED e PENDING corretamente", () => {
  const milestone = makeMilestone({
    checks: [
      { criterionId: "c1", taskId: "t1", status: "APPROVED", notes: null, checkedByName: "Ana", checkedAt: null },
      { criterionId: "c2", taskId: "t1", status: "APPROVED", notes: null, checkedByName: "Ana", checkedAt: null },
      { criterionId: "c1", taskId: "t2", status: "APPROVED", notes: null, checkedByName: "Ana", checkedAt: null },
      { criterionId: "c2", taskId: "t2", status: "REJECTED", notes: null, checkedByName: "Ana", checkedAt: null },
    ],
  });

  const evalT1 = evaluateMilestoneTask(milestone, "t1");
  assert.equal(evalT1.verdict, "APPROVED");
  assert.equal(evalT1.approvedCount, 2);
  assert.equal(evalT1.totalCriteria, 2);

  const evalT2 = evaluateMilestoneTask(milestone, "t2");
  assert.equal(evalT2.verdict, "REJECTED");
  assert.equal(evalT2.approvedCount, 1);
  assert.equal(evalT2.rejectedCount, 1);

  const emptyCheckMilestone = makeMilestone({ checks: [] });
  const evalPending = evaluateMilestoneTask(emptyCheckMilestone, "t1");
  assert.equal(evalPending.verdict, "PENDING");
  assert.equal(evalPending.pendingCount, 2);

  const noCriteriaMilestone = makeMilestone({ criteria: [] });
  assert.equal(evaluateMilestoneTask(noCriteriaMilestone, "t1").verdict, "PENDING");
});

test("evaluateMilestoneSummary identifica NO_TASKS, APPROVED, REJECTED, OVERDUE e PENDING", () => {
  assert.equal(evaluateMilestoneSummary(makeMilestone({ taskIds: [] }), "2026-05-20").status, "NO_TASKS");

  const approved = makeMilestone({
    taskIds: ["t1"],
    checks: [
      { criterionId: "c1", taskId: "t1", status: "APPROVED", notes: null, checkedByName: null, checkedAt: null },
      { criterionId: "c2", taskId: "t1", status: "APPROVED", notes: null, checkedByName: null, checkedAt: null },
    ],
  });
  const approvedSummary = evaluateMilestoneSummary(approved, "2026-05-25");
  assert.equal(approvedSummary.status, "APPROVED");
  assert.equal(approvedSummary.progressPercent, 100);

  const rejected = makeMilestone({
    taskIds: ["t1"],
    checks: [
      { criterionId: "c1", taskId: "t1", status: "REJECTED", notes: null, checkedByName: null, checkedAt: null },
    ],
  });
  assert.equal(evaluateMilestoneSummary(rejected, "2026-05-20").status, "REJECTED");

  const overdue = makeMilestone({ taskIds: ["t1"], targetDate: "2026-05-20", checks: [] });
  assert.equal(evaluateMilestoneSummary(overdue, "2026-05-21").status, "OVERDUE");

  const pending = makeMilestone({ taskIds: ["t1"], targetDate: "2026-05-24", checks: [] });
  assert.equal(evaluateMilestoneSummary(pending, "2026-05-24").status, "PENDING");
});

test("getMilestoneWeekRange calcula intervalo segunda a domingo da semana", () => {
  const week = getMilestoneWeekRange("2026-05-20");
  assert.equal(week.startIso, "2026-05-18");
  assert.equal(week.endIso, "2026-05-24");
  assert.equal(week.label, "Sem. 18/05 – 24/05");

  const invalid = getMilestoneWeekRange("invalida");
  assert.equal(invalid.label, "invalida");
});

test("suggestMilestoneTaskIds filtra tarefas ativas com término até a data do marco", () => {
  const tasks: Pick<TaskRecord, "id" | "endDate" | "status">[] = [
    { id: "t1", endDate: "2026-05-15", status: "DONE" },
    { id: "t2", endDate: "2026-05-20", status: "IN_PROGRESS" },
    { id: "t3", endDate: "2026-05-25", status: "TODO" },
    { id: "t4", endDate: "2026-05-18", status: "CANCELLED" },
  ];
  assert.deepEqual(suggestMilestoneTaskIds(tasks, "2026-05-20"), ["t1", "t2"]);
});

test("schemas Zod de marcos validam criação, edição, exclusão e verificação", () => {
  const validCreate = saveMilestoneSchema.safeParse({
    teamId: "team-1",
    title: "Marco 1",
    targetDate: "2026-05-20",
    criteria: [{ title: "Critério A" }],
    taskIds: ["t1"],
  });
  assert.equal(validCreate.success, true);

  const missingCriteria = saveMilestoneSchema.safeParse({
    teamId: "team-1",
    title: "Marco 1",
    targetDate: "2026-05-20",
    criteria: [],
    taskIds: [],
  });
  assert.equal(missingCriteria.success, false);

  const editWithoutRevision = saveMilestoneSchema.safeParse({
    teamId: "team-1",
    id: "m1",
    title: "Marco 1",
    targetDate: "2026-05-20",
    criteria: [{ title: "Critério A" }],
    taskIds: [],
  });
  assert.equal(editWithoutRevision.success, false);

  const duplicateTasks = saveMilestoneSchema.safeParse({
    teamId: "team-1",
    title: "Marco 1",
    targetDate: "2026-05-20",
    criteria: [{ title: "Critério A" }],
    taskIds: ["t1", "t1"],
  });
  assert.equal(duplicateTasks.success, false);

  assert.equal(
    deleteMilestoneSchema.safeParse({ teamId: "team-1", id: "m1" }).success,
    true,
  );
  assert.equal(
    updateMilestoneCheckSchema.safeParse({
      teamId: "team-1",
      milestoneId: "m1",
      criterionId: "c1",
      taskId: "t1",
      status: "APPROVED",
    }).success,
    true,
  );
});
