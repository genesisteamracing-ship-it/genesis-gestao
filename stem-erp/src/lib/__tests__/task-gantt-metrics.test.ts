import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildGanttTaskMetricsMap,
  computeCriticalPathIds,
  computeGanttSummary,
  evaluateTaskScheduleSignal,
  formatDeviationDays,
  formatTaskShortId,
  type GanttMetricTaskInput,
} from "../task-gantt-metrics";

const TODAY = "2026-11-10";

function makeTask(overrides: Partial<GanttMetricTaskInput> & { id: string }): GanttMetricTaskInput {
  return {
    startDate: "2026-11-05",
    endDate: "2026-11-20",
    baselineStartDate: "2026-11-05",
    baselineEndDate: "2026-11-20",
    status: "IN_PROGRESS",
    isAtRisk: false,
    isCritical: false,
    ...overrides,
  };
}

describe("task-gantt-metrics", () => {
  describe("formatTaskShortId", () => {
    it("gera A..Z e continua em AA, AB sem duplicação", () => {
      assert.equal(formatTaskShortId(0), "A");
      assert.equal(formatTaskShortId(1), "B");
      assert.equal(formatTaskShortId(25), "Z");
      assert.equal(formatTaskShortId(26), "AA");
      assert.equal(formatTaskShortId(27), "AB");
      assert.equal(formatTaskShortId(51), "AZ");
      assert.equal(formatTaskShortId(52), "BA");
    });
  });

  describe("evaluateTaskScheduleSignal", () => {
    it("classifica CANCELLED e COMPLETED com maior precedência", () => {
      assert.equal(
        evaluateTaskScheduleSignal(
          makeTask({ id: "1", status: "CANCELLED", endDate: "2026-11-30" }),
          TODAY,
        ),
        "CANCELLED",
      );
      assert.equal(
        evaluateTaskScheduleSignal(
          makeTask({ id: "2", status: "DONE", endDate: "2026-11-30" }),
          TODAY,
        ),
        "COMPLETED",
      );
    });

    it("classifica DELAYED quando término atual ou data atual ultrapassam linha de base", () => {
      assert.equal(
        evaluateTaskScheduleSignal(
          makeTask({ id: "1", baselineEndDate: "2026-11-15", endDate: "2026-11-18" }),
          TODAY,
        ),
        "DELAYED",
      );
      assert.equal(
        evaluateTaskScheduleSignal(
          makeTask({ id: "2", baselineEndDate: "2026-11-09", endDate: "2026-11-09", status: "TODO" }),
          TODAY,
        ),
        "DELAYED",
      );
    });

    it("classifica AT_RISK por flag manual, proximidade <= 2 dias ou >= 80% decorrido", () => {
      assert.equal(
        evaluateTaskScheduleSignal(makeTask({ id: "1", isAtRisk: true }), TODAY),
        "AT_RISK",
      );
      assert.equal(
        evaluateTaskScheduleSignal(
          makeTask({ id: "2", startDate: "2026-11-01", endDate: "2026-11-12", baselineStartDate: "2026-11-01", baselineEndDate: "2026-11-12" }),
          TODAY,
        ),
        "AT_RISK",
      );
      assert.equal(
        evaluateTaskScheduleSignal(
          makeTask({ id: "3", startDate: "2026-10-20", endDate: "2026-11-14", baselineStartDate: "2026-10-20", baselineEndDate: "2026-11-14" }),
          TODAY,
        ),
        "AT_RISK",
      );
    });

    it("classifica ON_TRACK quando dentro da linha de base e sem risco", () => {
      assert.equal(
        evaluateTaskScheduleSignal(makeTask({ id: "1" }), TODAY),
        "ON_TRACK",
      );
    });
  });

  describe("computeCriticalPathIds", () => {
    it("identifica caminho de folga zero via CPM e ignora ramo com folga", () => {
      const tasks = [
        makeTask({ id: "A", startDate: "2026-11-01", endDate: "2026-11-05" }),
        makeTask({ id: "B", startDate: "2026-11-06", endDate: "2026-11-15" }),
        makeTask({ id: "C", startDate: "2026-11-06", endDate: "2026-11-08" }),
        makeTask({ id: "D", startDate: "2026-11-16", endDate: "2026-11-20" }),
      ];
      const edges = [
        { predecessorId: "A", successorId: "B" },
        { predecessorId: "A", successorId: "C" },
        { predecessorId: "B", successorId: "D" },
        { predecessorId: "C", successorId: "D" },
      ];

      const critical = computeCriticalPathIds(tasks, edges);
      assert.deepEqual([...critical].sort(), ["A", "B", "D"]);
    });

    it("combina CPM com marcação manual isCritical e exclui canceladas", () => {
      const tasks = [
        makeTask({ id: "A", startDate: "2026-11-01", endDate: "2026-11-05", isCritical: true }),
        makeTask({ id: "B", startDate: "2026-11-01", endDate: "2026-11-20" }),
        makeTask({ id: "C", startDate: "2026-11-01", endDate: "2026-11-30", status: "CANCELLED", isCritical: true }),
      ];
      const critical = computeCriticalPathIds(tasks, []);
      assert.deepEqual([...critical].sort(), ["A", "B"]);
    });
  });

  describe("computeGanttSummary & formatDeviationDays", () => {
    it("calcula progresso geral, atividades críticas, desvio atual e marco final", () => {
      const tasks = [
        makeTask({
          id: "A",
          startDate: "2026-11-01",
          endDate: "2026-11-12",
          baselineStartDate: "2026-11-01",
          baselineEndDate: "2026-11-08",
          status: "IN_PROGRESS",
        }),
        makeTask({
          id: "B",
          startDate: "2026-11-05",
          endDate: "2026-11-18",
          baselineStartDate: "2026-11-05",
          baselineEndDate: "2026-11-18",
          status: "DONE",
        }),
        makeTask({
          id: "C",
          startDate: "2026-11-10",
          endDate: "2026-11-24",
          baselineStartDate: "2026-11-10",
          baselineEndDate: "2026-11-20",
          status: "IN_PROGRESS",
          isAtRisk: true,
        }),
      ];

      const summary = computeGanttSummary(tasks, [], TODAY);
      // (50 + 100 + 50) / 3 = 66.67 -> 67%
      assert.equal(summary.progressPercent, 67);
      assert.equal(summary.criticalCount, 1); // C define o prazo final (2026-11-24)
      assert.equal(summary.deviationDays, 4); // 2026-11-24 - 2026-11-20 = +4 dias
      assert.equal(summary.milestoneStatus, "DELAYED");
      assert.equal(summary.milestoneLabel, "Em atraso");
      assert.equal(formatDeviationDays(summary.deviationDays), "+4 dias");
      assert.equal(formatDeviationDays(0), "0 dias");
      assert.equal(formatDeviationDays(-1), "-1 dia");

      const metrics = buildGanttTaskMetricsMap(tasks, [], TODAY);
      assert.equal(metrics.get("A")?.shortId, "A");
      assert.equal(metrics.get("A")?.signal, "DELAYED");
      assert.equal(metrics.get("B")?.signal, "COMPLETED");
      assert.equal(metrics.get("C")?.isCritical, true);
    });

    it("retorna estado vazio quando não há tarefas ativas", () => {
      const summary = computeGanttSummary(
        [makeTask({ id: "X", status: "CANCELLED" })],
        [],
        TODAY,
      );
      assert.equal(summary.progressPercent, 0);
      assert.equal(summary.criticalCount, 0);
      assert.equal(summary.deviationDays, 0);
      assert.equal(summary.milestoneStatus, "EMPTY");
    });
  });
});
