import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildIndividualAttendancePdfData,
  buildIndividualAttendancePdfFilename,
  buildTeamAttendancePdfData,
  buildTeamAttendancePdfFilename,
} from "../attendance-pdf-layout";
import {
  buildBudgetPlanningData,
  buildBudgetPlanningFilename,
} from "../budget-planning-pdf-layout";
import {
  buildCommunicationMatrixPdfData,
  buildCommunicationMatrixPdfFilename,
} from "../communication-matrix-pdf-layout";
import {
  buildFinancialStatementData,
  buildFinancialStatementFilename,
} from "../financial-statement-pdf-layout";
import {
  buildGanttPdfFilename,
  computeGanttPdfLayout,
} from "../gantt-pdf-layout";
import { buildRisksPdfData, buildRisksPdfFilename } from "../risks-pdf-layout";
import {
  buildStakeholdersPdfData,
  buildStakeholdersPdfFilename,
} from "../stakeholders-pdf-layout";
import { buildWbsPdfFilename } from "../wbs-pdf-layout";

describe("PDF i18n layouts (en-US)", () => {
  const fixedDate = new Date(2026, 4, 15);

  test("Extrato Financeiro em en-US traduz rotulos e filename", () => {
    const data = buildFinancialStatementData({
      teamName: "Equipe Gênesis",
      locale: "en-US",
      transactions: [
        {
          id: "tx-1",
          type: "ORIGIN",
          date: "2026-05-10T12:00:00.000Z",
          description: "Sponsorship deposit",
          amountCents: 100000,
          deliveryGroup: "ENGINEERING_CAD",
          categoryId: "c1",
          categoryName: "Sponsorship",
          trackingMethod: "SPONSOR_CONTRACT",
          documentRef: "CTR-01",
          budgetResourceId: null,
          budgetResourceCode: null,
          budgetResourceName: null,
          acquisitionStrategy: null,
          sponsorId: null,
          sponsorName: null,
          sponsorTier: null,
          referenceMonth: 5,
          createdAt: "2026-05-10T12:00:00.000Z",
        },
      ],
    });

    assert.equal(data.rows[0].methodLabel, "Contract");
    assert.match(data.rows[0].historySecondary, /^Engineering & CAD/);
    assert.equal(data.rows[1].historyPrimary, "Daily balance");
    assert.equal(data.rows[2].historyPrimary, "B A L A N C E");
    assert.equal(
      buildFinancialStatementFilename("Equipe Gênesis", fixedDate, "en-US"),
      "financial-statement-equipe-genesis-2026-05-15.pdf"
    );
  });

  test("Planejamento Orcamentario em en-US traduz estrategias, meses, total e filename", () => {
    const data = buildBudgetPlanningData({
      teamName: "Equipe Gênesis",
      locale: "en-US",
      resources: [
        {
          id: "r1",
          code: "ENG-01",
          resourceName: "PLA Filament",
          deliveryGroup: "ENGINEERING_CAD",
          categoryId: "c1",
          categoryName: "Prototyping",
          acquisitionStrategy: "DIRECT_PURCHASE",
          allocatedTo: "Ana",
          plannedMonth: 2,
          plannedAmountCents: 25000,
          realizedAmountCents: 0,
          utilizationForecast: 100,
          transactionsCount: 0,
          createdAt: "2026-05-01T00:00:00.000Z",
        },
      ],
    });

    assert.equal(data.rows[0].monthLabel, "Month 2");
    assert.equal(data.rows[0].strategyLabel, "Direct Purchase");
    assert.match(data.rows[0].resourceSecondary, /Owner: Ana/);
    assert.match(data.rows[0].resourceSecondary, /100% usage/);
    assert.equal(data.rows[2].resourcePrimary, "T O T A L   B U D G E T");
    assert.equal(
      buildBudgetPlanningFilename("Equipe Gênesis", fixedDate, "en-US"),
      "budget-planning-equipe-genesis-2026-05-15.pdf"
    );

    const withSeasonMonths = buildBudgetPlanningData({
      teamName: "Equipe Gênesis",
      locale: "en-US",
      monthLabels: { 1: "Out/26", 2: "Dez/2026" },
      resources: [
        {
          id: "r2",
          code: "MAN-01",
          resourceName: "Airbrush",
          deliveryGroup: "MANUFACTURING_CNC",
          categoryId: "c2",
          categoryName: "Painting",
          acquisitionStrategy: "DIRECT_PURCHASE",
          allocatedTo: "Engenharia",
          plannedMonth: 1,
          plannedAmountCents: 35000,
          realizedAmountCents: 0,
          utilizationForecast: 100,
          transactionsCount: 0,
          createdAt: "2026-05-01T00:00:00.000Z",
        },
        {
          id: "r3",
          code: "MAN-02",
          resourceName: "Sandpaper",
          deliveryGroup: "MANUFACTURING_CNC",
          categoryId: "c2",
          categoryName: "Finishing",
          acquisitionStrategy: "OWN_FUNDS_RAFFLE",
          allocatedTo: "Lucas",
          plannedMonth: 2,
          plannedAmountCents: 5000,
          realizedAmountCents: 0,
          utilizationForecast: 80,
          transactionsCount: 0,
          createdAt: "2026-05-01T00:00:00.000Z",
        },
      ],
    });

    assert.equal(withSeasonMonths.rows[0].monthLabel, "Oct/26");
    assert.equal(withSeasonMonths.rows[1].monthLabel, "Dec/2026");
    assert.equal(withSeasonMonths.scopeLabel, "Oct/26 to Dec/2026");
    assert.match(withSeasonMonths.rows[0].resourceSecondary, /Owner: Engineering/);
    assert.match(withSeasonMonths.rows[1].resourceSecondary, /Owner: Lucas/);
  });

  test("WBS e Gantt em en-US traduzem titulo, meses, setores e filenames", () => {
    assert.equal(
      buildWbsPdfFilename("Equipe Gênesis", fixedDate, "en-US"),
      "wbs-scope-equipe-genesis-2026-05-15.pdf"
    );

    const gantt = computeGanttPdfLayout({
      teamName: "Equipe Gênesis",
      locale: "en-US",
      tasks: [
        {
          id: "t1",
          title: "CNC Chassis Milling",
          description: null,
          deliveryGroup: "MANUFACTURING_CNC",
          status: "IN_PROGRESS",
          startDate: "2026-02-01",
          endDate: "2026-02-10",
          baselineStartDate: null,
          baselineEndDate: null,
          isAtRisk: false,
          isCritical: false,
          optimisticDays: 2,
          mostLikelyDays: 3,
          pessimisticDays: 5,
          completedAt: null,
          cancelledAt: null,
          roles: [],
          revision: 1,
        },
      ],
    });

    assert.equal(gantt.title, "Equipe Gênesis — Gantt Schedule");
    assert.equal(gantt.months[0].label, "FEB 2026");
    assert.equal(gantt.rows[0].sectorLabel, "Manufacturing & CNC");
    assert.match(gantt.periodLabel, /1 task$/);
    assert.equal(
      buildGanttPdfFilename("Equipe Gênesis", fixedDate, "en-US"),
      "gantt-schedule-equipe-genesis-2026-05-15.pdf"
    );
  });

  test("Matriz de Riscos em en-US traduz badges, tipo, status e filename", () => {
    const data = buildRisksPdfData({
      teamName: "Equipe Gênesis",
      locale: "en-US",
      items: [
        {
          id: "rk-1",
          teamId: "t1",
          title: "Bearing supplier delay",
          description: null,
          entryType: "RISK",
          sector: "MANUFACTURING_CNC",
          probability: "QUASE_CERTO",
          consequence: "CATASTROFICA",
          priorityScore: 25,
          priorityLevel: "CRITICAL",
          status: "MONITORING",
          proactiveStrategy: "Keep backup supplier",
          contingencyPlan: "Order local stock",
          observations: "Monitor weekly",
          evidenceUrl: null,
          evidenceNotes: null,
          ownerName: null,
          ownerUserId: null,
          season: "2026",
          reviewsCount: 2,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
      ],
    });

    assert.equal(data.rows[0].sectorLabel, "Manufacturing");
    assert.equal(data.rows[0].probabilityLabel, "Almost Certain");
    assert.equal(data.rows[0].consequenceLabel, "Catastrophic");
    assert.equal(data.rows[0].priorityLabel, "Critical");
    assert.equal(data.rows[0].subtitle, "Risk · Monitoring · 2 reviews");
    assert.equal(
      buildRisksPdfFilename("Equipe Gênesis", fixedDate, "en-US"),
      "risk-matrix-equipe-genesis-2026-05-15.pdf"
    );
  });

  test("Stakeholders e Matriz de Comunicacao em en-US traduzem grupos, canais, frequencias e filenames", () => {
    const stakeholder = {
      id: "s1",
      teamId: "t1",
      sponsorId: null,
      parentStakeholderId: null,
      name: "Carlos Mendes",
      organization: "Bosch",
      roleOrJobTitle: "Marketing Director",
      group: "SPONSORS" as const,
      power: "HIGH" as const,
      interest: "HIGH" as const,
      currentEngagement: "SUPPORTIVE" as const,
      targetEngagement: "LEADING" as const,
      preferredChannel: "EMAIL" as const,
      preferredFrequency: "MONTHLY" as const,
      email: "carlos@bosch.com",
      phone: null,
      notes: null,
      plans: [],
      communications: [],
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
      updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    };

    const stData = buildStakeholdersPdfData({
      stakeholders: [stakeholder],
      teamName: "Equipe Gênesis",
      locale: "en-US",
    });
    assert.equal(stData.filterLabel, "All Groups");
    assert.equal(stData.quadrants.MANAGE_CLOSELY[0].engagementLabel, "Supportive");
    assert.equal(
      buildStakeholdersPdfFilename("Equipe Gênesis", fixedDate, "en-US"),
      "stakeholders-matrix-equipe-genesis-2026-05-15.pdf"
    );

    const cmData = buildCommunicationMatrixPdfData({
      stakeholders: [stakeholder],
      teamName: "Equipe Gênesis",
      locale: "en-US",
    });
    assert.equal(cmData.rows[0].strategyLabel, "Manage closely");
    assert.equal(cmData.rows[0].channelLabel, "Formal Email");
    assert.equal(cmData.rows[0].frequencyLabel, "Monthly");
    assert.equal(cmData.rows[0].powerInterestMeta, "Power High • Int. High");
    assert.equal(cmData.rows[0].engagementPrimary, "Current: Supportive");
    assert.equal(cmData.rows[0].engagementSecondary, "Target: Leading Advocate");
    assert.equal(
      buildCommunicationMatrixPdfFilename("Equipe Gênesis", fixedDate, "en-US"),
      "communication-matrix-equipe-genesis-2026-05-15.pdf"
    );
  });

  test("Presenca nos Treinos (Individual e Equipe) em en-US traduz status, periodos e filenames", () => {
    const individual = buildIndividualAttendancePdfData({
      teamName: "Equipe Gênesis",
      period: "LAST_7_DAYS",
      locale: "en-US",
      memberSummary: {
        userId: "u1",
        userName: "Lucas Silva",
        email: "lucas@genesis.com",
        deliveryGroup: "ENGINEERING_CAD",
        jobTitle: "CAD Engineer",
        totalTrainings: 2,
        presencesCount: 1,
        absencesCount: 1,
        attendanceRate: 50,
        lastPresenceDate: "2026-05-14",
        lastAbsenceDate: "2026-05-15",
        records: [
          {
            id: "r1",
            userId: "u1",
            userName: "Lucas Silva",
            deliveryGroup: "ENGINEERING_CAD",
            jobTitle: "CAD Engineer",
            date: "2026-05-14",
            checkedAt: "2026-05-14T18:00:00.000Z",
            status: "PRESENT",
            notes: "Arrived on time",
          },
          {
            id: "r2",
            userId: "u1",
            userName: "Lucas Silva",
            deliveryGroup: "ENGINEERING_CAD",
            jobTitle: "CAD Engineer",
            date: "2026-05-15",
            checkedAt: null,
            status: "ABSENT",
            notes: null,
          },
        ],
      },
    });

    assert.equal(individual.periodLabel, "Last 7 days");
    assert.equal(individual.rows[0].statusLabel, "Present");
    assert.equal(individual.rows[1].statusLabel, "Absent");
    assert.equal(individual.rows[1].notes, "No check-in recorded");
    assert.equal(
      buildIndividualAttendancePdfFilename("Lucas Silva", "Equipe Gênesis", fixedDate, "en-US"),
      "attendance-report-lucas-silva-equipe-genesis-2026-05-15.pdf"
    );

    const team = buildTeamAttendancePdfData({
      teamName: "Equipe Gênesis",
      period: "CURRENT_MONTH",
      locale: "en-US",
      analytics: {
        totalTrainingDays: 1,
        totalTrackedMembers: 1,
        totalRecords: 1,
        totalPresences: 1,
        totalAbsences: 0,
        overallAttendanceRate: 100,
        latestTrainingDate: "2026-05-14",
        latestTrainingPresences: 1,
        latestTrainingAbsences: 0,
        membersWithAbsencesCount: 0,
        perfectAttendanceMembersCount: 1,
        trainingDates: ["2026-05-14"],
        dailySeries: [
          {
            date: "2026-05-14",
            dateLabel: "14/05",
            fullDateLabel: "14/05/2026",
            presences: 1,
            absences: 0,
            totalMembers: 1,
            attendanceRate: 100,
          },
        ],
        sectorBreakdown: [],
        memberSummaries: [],
        records: [],
      },
    });

    assert.equal(team.periodLabel, "Current month");
    assert.equal(team.dailyRows[0].absentNames, "All present");
    assert.equal(
      buildTeamAttendancePdfFilename("Equipe Gênesis", fixedDate, "en-US"),
      "team-attendance-report-equipe-genesis-2026-05-15.pdf"
    );
  });
});
