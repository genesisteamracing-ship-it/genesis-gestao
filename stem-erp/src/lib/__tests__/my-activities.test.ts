import assert from "node:assert/strict";
import test from "node:test";
import type { TaskRecord } from "@/types/tasks";
import {
  buildMyActivityItems,
  calculateUserActivityKpis,
  classifyDeadlineUrgency,
  filterMyActivities,
  formatDeadlineCountdown,
  sortMyActivities,
} from "../my-activities";

const TODAY = "2026-11-12";

function makeTask(overrides: Partial<TaskRecord>): TaskRecord {
  return {
    id: "task-1",
    title: "Tarefa padrão",
    description: null,
    deliveryGroup: "ENGINEERING_CAD",
    startDate: "2026-11-01",
    endDate: "2026-11-15",
    status: "TODO",
    completedAt: null,
    cancelledAt: null,
    revision: 0,
    roles: [
      { role: "A", person: { key: "owner-1", name: "Gestor", available: true } },
      { role: "R", person: { key: "user-1", name: "Executor", available: true } },
    ],
    ...overrides,
  };
}

test("classifyDeadlineUrgency e formatDeadlineCountdown classificam prazos corretamente", () => {
  assert.equal(classifyDeadlineUrgency("TODO", "2026-11-10", TODAY), "OVERDUE");
  assert.equal(formatDeadlineCountdown("OVERDUE", -2), "Atrasada há 2 dias");
  assert.equal(formatDeadlineCountdown("OVERDUE", -1), "Atrasada há 1 dia");

  assert.equal(classifyDeadlineUrgency("IN_PROGRESS", "2026-11-12", TODAY), "DUE_TODAY");
  assert.equal(formatDeadlineCountdown("DUE_TODAY", 0), "Vence hoje");

  assert.equal(classifyDeadlineUrgency("TODO", "2026-11-13", TODAY), "DUE_SOON");
  assert.equal(formatDeadlineCountdown("DUE_SOON", 1), "Vence amanhã");

  assert.equal(classifyDeadlineUrgency("TODO", "2026-11-25", TODAY), "ON_TRACK");
  assert.equal(formatDeadlineCountdown("ON_TRACK", 13), "Vence em 13 dias");

  assert.equal(classifyDeadlineUrgency("DONE", "2026-11-01", TODAY), "COMPLETED");
  assert.equal(classifyDeadlineUrgency("CANCELLED", "2026-11-01", TODAY), "CANCELLED");
});

test("buildMyActivityItems filtra apenas tarefas onde o usuário é R e ordena por urgência", () => {
  const tasks: TaskRecord[] = [
    makeTask({
      id: "other-user",
      title: "De outro executor",
      roles: [
        { role: "A", person: { key: "user-1", name: "Eu como A", available: true } },
        { role: "R", person: { key: "user-2", name: "Outro R", available: true } },
      ],
    }),
    makeTask({ id: "future", title: "Futura", endDate: "2026-11-20", status: "TODO" }),
    makeTask({ id: "done", title: "Já concluída", endDate: "2026-11-05", status: "DONE", completedAt: "2026-11-05T10:00:00Z" }),
    makeTask({ id: "overdue", title: "Atrasada", endDate: "2026-11-09", status: "IN_PROGRESS" }),
    makeTask({ id: "today", title: "Hoje", endDate: "2026-11-12", status: "TODO" }),
    makeTask({ id: "cancelled", title: "Cancelada", endDate: "2026-11-08", status: "CANCELLED", cancelledAt: "2026-11-07T10:00:00Z" }),
  ];

  const items = sortMyActivities(buildMyActivityItems(tasks, "user-1", TODAY));
  assert.deepEqual(
    items.map((item) => item.task.id),
    ["overdue", "today", "future", "done", "cancelled"],
  );
});

test("filterMyActivities aplica busca, status e filtro de prazo corretamente", () => {
  const tasks: TaskRecord[] = [
    makeTask({ id: "t1", title: "Revisar orçamento", endDate: "2026-11-10", status: "TODO" }),
    makeTask({ id: "t2", title: "Enviar relatório", endDate: "2026-11-15", status: "IN_PROGRESS" }),
    makeTask({ id: "t3", title: "Planejar evento", endDate: "2026-11-24", status: "TODO" }),
    makeTask({ id: "t4", title: "Orçamento antigo", endDate: "2026-11-01", status: "DONE", completedAt: "2026-11-01T12:00:00Z" }),
  ];
  const items = buildMyActivityItems(tasks, "user-1", TODAY);

  assert.deepEqual(
    filterMyActivities(items, { search: "orçamento", status: "ALL", deadline: "ALL" }).map((i) => i.task.id),
    ["t1", "t4"],
  );
  assert.deepEqual(
    filterMyActivities(items, { search: "", status: "ALL", deadline: "OVERDUE" }).map((i) => i.task.id),
    ["t1"],
  );
  assert.deepEqual(
    filterMyActivities(items, { search: "", status: "ALL", deadline: "THIS_WEEK" }).map((i) => i.task.id),
    ["t2"],
  );
  assert.deepEqual(
    filterMyActivities(items, { search: "", status: "ALL", deadline: "NEXT_15_DAYS" }).map((i) => i.task.id),
    ["t2", "t3"],
  );
});

test("calculateUserActivityKpis calcula métricas e pontualidade com exatidão", () => {
  const tasks: TaskRecord[] = [
    makeTask({ id: "1", endDate: "2026-11-10", status: "DONE", completedAt: "2026-11-10T18:00:00Z" }), // no prazo
    makeTask({ id: "2", endDate: "2026-11-10", status: "DONE", completedAt: "2026-11-11T09:00:00Z" }), // com atraso
    makeTask({ id: "3", endDate: "2026-11-10", status: "DONE", completedAt: null }), // legada -> no prazo
    makeTask({ id: "4", endDate: "2026-11-09", status: "TODO" }), // atrasada
    makeTask({ id: "5", endDate: "2026-11-18", status: "IN_PROGRESS" }), // pendente no prazo
    makeTask({ id: "6", endDate: "2026-11-05", status: "CANCELLED", cancelledAt: "2026-11-04T12:00:00Z" }), // cancelada
  ];

  const kpis = calculateUserActivityKpis(buildMyActivityItems(tasks, "user-1", TODAY));
  assert.deepEqual(kpis, {
    totalAssigned: 6,
    completedCount: 3,
    pendingCount: 2,
    overdueCount: 1,
    cancelledCount: 1,
    onTimeCompletedCount: 2,
    completionRate: 60, // 3 / (6 - 1) = 60%
    punctualityRate: 67, // 2 / 3 = 66.6% -> 67%
  });
});

test("calculateUserActivityKpis trata estado vazio sem divisão por zero", () => {
  const kpis = calculateUserActivityKpis([]);
  assert.deepEqual(kpis, {
    totalAssigned: 0,
    completedCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    cancelledCount: 0,
    onTimeCompletedCount: 0,
    completionRate: 0,
    punctualityRate: null,
  });
});
