import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildMonthlyScheduleCalendar,
  getNextStakeholderScheduleDate,
  projectStakeholderSchedulesInMonth,
  SCHEDULED_REPORT_DEFAULT_TITLE,
} from "../communication-schedule";

describe("Communication Schedule Calendar Engine", () => {
  it("deve agendar relatórios semanais (+7 dias) a partir do dia 04 nos dias 11, 18 e 25 do mesmo mês", () => {
    const stakeholder = {
      id: "st-weekly-04",
      name: "Adam",
      organization: "SESI",
      group: "TECHNICAL_MENTORS" as const,
      email: "adam@sesi.org.br",
      preferredFrequency: "WEEKLY" as const,
      createdAt: "2026-11-04T12:00:00.000Z",
    };

    const items = projectStakeholderSchedulesInMonth(stakeholder, 2026, 10); // 10 = Novembro

    assert.equal(items.length, 3);
    assert.deepEqual(
      items.map((item) => item.scheduledDateKey),
      ["2026-11-11", "2026-11-18", "2026-11-25"]
    );
    assert.equal(items[0].reportTitle, SCHEDULED_REPORT_DEFAULT_TITLE);
    assert.equal(items[0].occurrenceNumber, 1);
    assert.equal(items[1].occurrenceNumber, 2);
    assert.equal(items[2].occurrenceNumber, 3);
  });

  it("deve agendar relatórios quinzenais (+14 dias) corretamente", () => {
    const stakeholder = {
      id: "st-biweekly-02",
      name: "Fulano",
      organization: "IFPB",
      group: "SPONSORS" as const,
      email: "fulano@ifpb.edu.br",
      preferredFrequency: "BIWEEKLY" as const,
      createdAt: "2026-11-02T10:00:00.000Z",
    };

    const items = projectStakeholderSchedulesInMonth(stakeholder, 2026, 10); // Novembro 2026
    assert.deepEqual(
      items.map((item) => item.scheduledDateKey),
      ["2026-11-16", "2026-11-30"]
    );
  });

  it("deve ajustar agendamentos mensais do dia 31 para o último dia válido em meses mais curtos", () => {
    const stakeholder = {
      id: "st-monthly-31",
      name: "Samara",
      organization: "SESI",
      group: "SCHOOL_LEADERSHIP" as const,
      email: "samara@sesi.org.br",
      preferredFrequency: "MONTHLY" as const,
      createdAt: "2026-01-31T10:00:00.000Z",
    };

    // Fevereiro de 2026 tem 28 dias
    const febItems = projectStakeholderSchedulesInMonth(stakeholder, 2026, 1);
    assert.equal(febItems.length, 1);
    assert.equal(febItems[0].scheduledDateKey, "2026-02-28");
    assert.equal(febItems[0].occurrenceNumber, 1);
  });

  it("deve construir a grade mensal de 42 dias marcando hasScheduledReports = true nos dias agendados", () => {
    const stakeholders = [
      {
        id: "st-weekly-04",
        name: "Adam",
        organization: "SESI",
        group: "TECHNICAL_MENTORS" as const,
        email: "adam@sesi.org.br",
        preferredFrequency: "WEEKLY" as const,
        createdAt: "2026-11-04T12:00:00.000Z",
      },
    ];

    const calendar = buildMonthlyScheduleCalendar(
      stakeholders,
      2026,
      10,
      "2026-11-04T12:00:00.000Z"
    );

    assert.equal(calendar.days.length, 42);
    assert.equal(calendar.monthLabel, "Novembro de 2026");
    assert.equal(calendar.totalScheduledInMonth, 3);

    const day11 = calendar.days.find((d) => d.dateKey === "2026-11-11");
    assert.ok(day11);
    assert.equal(day11.hasScheduledReports, true);
    assert.equal(day11.scheduledItems[0].stakeholderName, "Adam");
  });

  it("deve calcular o próximo envio automático a partir da data de referência", () => {
    const stakeholder = {
      id: "st-weekly-04",
      name: "Adam",
      organization: "SESI",
      group: "TECHNICAL_MENTORS" as const,
      email: "adam@sesi.org.br",
      preferredFrequency: "WEEKLY" as const,
      createdAt: "2026-11-04T12:00:00.000Z",
    };

    const next = getNextStakeholderScheduleDate(stakeholder, "2026-11-05T00:00:00.000Z");
    assert.equal(next.dateKey, "2026-11-11");
    assert.equal(next.occurrenceNumber, 1);
  });
});
