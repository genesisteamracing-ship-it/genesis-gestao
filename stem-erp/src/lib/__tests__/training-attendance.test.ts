import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildIndividualAttendanceCsvData,
  buildIndividualAttendancePdfData,
  buildIndividualAttendancePdfFilename,
  buildTeamAttendanceCsvData,
  buildTeamAttendancePdfData,
  buildTeamAttendancePdfFilename,
} from "../attendance-pdf-layout";
import {
  buildAttendanceAnalytics,
  formatIsoDateBR,
  formatWeekdayShortBR,
  isIsoDateInPeriod,
} from "../training-attendance";
import { individualAttendanceReportSchema } from "../validations/attendance";
import type { AttendanceTrackedMemberDTO } from "@/types/attendance";
import type { OfficeAttendanceDTO } from "@/types/office";

const MEMBERS: AttendanceTrackedMemberDTO[] = [
  {
    id: "u-1",
    name: "Geovanna",
    email: "geovanna@genesis.dev",
    deliveryGroup: "PROJECT_MANAGEMENT",
    jobTitle: "Gestora",
    role: "TEAM_LEAD",
  },
  {
    id: "u-2",
    name: "Artur",
    email: "artur@genesis.dev",
    deliveryGroup: "MANUFACTURING_CNC",
    jobTitle: "Engenheiro Manufatura",
    role: "TEAM_LEAD",
  },
  {
    id: "u-3",
    name: "Isaac Leal",
    email: "isaac@genesis.dev",
    deliveryGroup: "ENGINEERING_CAD",
    jobTitle: "Engenheiro de Projeto",
    role: "TEAM_LEAD",
  },
  {
    id: "u-admin",
    name: "SuperAdmin",
    email: "admin@genesis.dev",
    deliveryGroup: "PROJECT_MANAGEMENT",
    jobTitle: "Administrador",
    role: "SUPER_ADMIN",
  },
  {
    id: "u-auditor",
    name: "Juiz Auditor",
    email: "auditor@genesis.dev",
    deliveryGroup: null,
    jobTitle: "Auditor",
    role: "AUDITOR",
  },
];

const ATTENDANCES: OfficeAttendanceDTO[] = [
  {
    id: "att-1",
    userId: "u-1",
    userName: "Geovanna",
    deliveryGroup: "PROJECT_MANAGEMENT",
    jobTitle: "Gestora",
    date: "2026-11-20",
    checkedAt: "2026-11-20T14:10:00.000Z",
    notes: "Alinhamento semanal",
  },
  {
    id: "att-2",
    userId: "u-2",
    userName: "Artur",
    deliveryGroup: "MANUFACTURING_CNC",
    jobTitle: "Engenheiro Manufatura",
    date: "2026-11-20",
    checkedAt: "2026-11-20T14:15:00.000Z",
    notes: null,
  },
  {
    id: "att-3",
    userId: "u-1",
    userName: "Geovanna",
    deliveryGroup: "PROJECT_MANAGEMENT",
    jobTitle: "Gestora",
    date: "2026-11-27",
    checkedAt: "2026-11-27T14:05:00.000Z",
    notes: null,
  },
];

describe("training-attendance domain engine", () => {
  it("gera falta automática para integrantes operacionais sem marcação e exclui AUDITOR e SUPER_ADMIN", () => {
    const analytics = buildAttendanceAnalytics({
      members: MEMBERS,
      attendances: ATTENDANCES,
      period: "ALL",
      todayIso: "2026-11-28",
    });

    assert.equal(analytics.totalTrainingDays, 2);
    assert.equal(analytics.totalTrackedMembers, 3);
    assert.equal(analytics.totalRecords, 6);
    assert.equal(analytics.totalPresences, 3);
    assert.equal(analytics.totalAbsences, 3);
    assert.equal(analytics.overallAttendanceRate, 50);
    assert.equal(analytics.latestTrainingDate, "2026-11-27");
    assert.equal(analytics.latestTrainingPresences, 1);
    assert.equal(analytics.latestTrainingAbsences, 2);
    assert.equal(analytics.perfectAttendanceMembersCount, 1);
    assert.equal(analytics.membersWithAbsencesCount, 2);

    const isaacSummary = analytics.memberSummaries.find(
      (m) => m.userId === "u-3"
    );
    assert.ok(isaacSummary);
    assert.equal(isaacSummary.presencesCount, 0);
    assert.equal(isaacSummary.absencesCount, 2);
    assert.equal(isaacSummary.attendanceRate, 0);
    assert.ok(isaacSummary.records.every((r) => r.status === "ABSENT"));

    assert.equal(
      analytics.records.some(
        (r) => r.userId === "u-auditor" || r.userId === "u-admin"
      ),
      false
    );
  });

  it("filtra corretamente por período (LAST_7_DAYS, LAST_30_DAYS e CURRENT_MONTH)", () => {
    assert.equal(
      isIsoDateInPeriod("2026-11-27", "LAST_7_DAYS", "2026-11-28"),
      true
    );
    assert.equal(
      isIsoDateInPeriod("2026-11-20", "LAST_7_DAYS", "2026-11-28"),
      false
    );
    assert.equal(
      isIsoDateInPeriod("2026-11-20", "LAST_30_DAYS", "2026-11-28"),
      true
    );
    assert.equal(
      isIsoDateInPeriod("2026-10-31", "CURRENT_MONTH", "2026-11-28"),
      false
    );

    const last7 = buildAttendanceAnalytics({
      members: MEMBERS,
      attendances: ATTENDANCES,
      period: "LAST_7_DAYS",
      todayIso: "2026-11-28",
    });

    assert.equal(last7.totalTrainingDays, 1);
    assert.equal(last7.totalPresences, 1);
    assert.equal(last7.totalAbsences, 2);
  });

  it("formata datas ISO e dia da semana sem shift de fuso horário", () => {
    assert.equal(formatIsoDateBR("2026-11-27"), "27/11/2026");
    assert.equal(formatWeekdayShortBR("2026-11-27"), "Sex");
  });

  it("gera payloads estruturados para relatórios individuais e gerais em PDF e CSV", () => {
    const analytics = buildAttendanceAnalytics({
      members: MEMBERS,
      attendances: ATTENDANCES,
      period: "ALL",
      todayIso: "2026-11-28",
    });

    const arturSummary = analytics.memberSummaries.find(
      (m) => m.userId === "u-2"
    );
    assert.ok(arturSummary);

    const indPdf = buildIndividualAttendancePdfData({
      memberSummary: arturSummary,
      teamName: "Equipe Gênesis",
      seasonLabel: "2025/2026",
      period: "ALL",
    });
    assert.equal(indPdf.memberName, "Artur");
    assert.equal(indPdf.presencesCount, 1);
    assert.equal(indPdf.absencesCount, 1);
    assert.equal(indPdf.attendanceRateLabel, "50.0%");
    assert.equal(indPdf.rows.length, 2);
    assert.equal(indPdf.rows[0].statusLabel, "Presente");
    assert.equal(indPdf.rows[1].statusLabel, "Falta");

    const teamPdf = buildTeamAttendancePdfData({
      analytics,
      teamName: "Equipe Gênesis",
      seasonLabel: "2025/2026",
    });
    assert.equal(teamPdf.memberRows.length, 3);
    assert.equal(teamPdf.dailyRows.length, 2);
    assert.match(teamPdf.dailyRows[0].absentNames, /Artur/);
    assert.match(teamPdf.dailyRows[0].absentNames, /Isaac Leal/);

    const date = new Date(2026, 10, 28);
    assert.equal(
      buildIndividualAttendancePdfFilename("Artur", "Equipe Gênesis", date),
      "relatorio-presenca-artur-equipe-genesis-2026-11-28.pdf"
    );
    assert.equal(
      buildTeamAttendancePdfFilename("Equipe Gênesis", date),
      "relatorio-presenca-geral-equipe-genesis-2026-11-28.pdf"
    );

    const indCsv = buildIndividualAttendanceCsvData(arturSummary, date);
    assert.equal(indCsv.rows.length, 2);
    assert.equal(indCsv.rows[1][5], "Falta");

    const teamCsv = buildTeamAttendanceCsvData(
      analytics,
      "Equipe Gênesis",
      date
    );
    assert.equal(teamCsv.rows.length, 6);
  });

  it("valida schema Zod de exportação de relatório individual", () => {
    const valid = individualAttendanceReportSchema.safeParse({
      memberId: "u-1",
      period: "LAST_30_DAYS",
      format: "PDF",
    });
    assert.equal(valid.success, true);

    const invalid = individualAttendanceReportSchema.safeParse({
      memberId: "",
      period: "ALL",
      format: "CSV",
    });
    assert.equal(invalid.success, false);
  });
});
