import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canAccessTrainingAttendance } from "../attendance-permissions";

describe("canAccessTrainingAttendance", () => {
  it("concede acesso para SUPER_ADMIN e para quem tem permissions.team", () => {
    assert.equal(
      canAccessTrainingAttendance({
        role: "SUPER_ADMIN",
        deliveryGroup: null,
        jobTitle: null,
        permissions: {
          finance: true,
          roi: true,
          communication: true,
          team: false,
        },
      }),
      true
    );

    assert.equal(
      canAccessTrainingAttendance({
        role: "TEAM_LEAD",
        deliveryGroup: "ENGINEERING_CAD",
        jobTitle: "Engenheiro CAD",
        permissions: {
          finance: true,
          roi: true,
          communication: true,
          team: true,
        },
      }),
      true
    );
  });

  it("concede acesso para perfis de GESTOR mesmo sem permissions.team", () => {
    assert.equal(
      canAccessTrainingAttendance({
        role: "FINANCE_MANAGER",
        deliveryGroup: "MARKETING_SPONSOR",
        jobTitle: "Líder Financeiro",
        permissions: {
          finance: true,
          roi: true,
          communication: true,
          team: false,
        },
      }),
      true
    );

    assert.equal(
      canAccessTrainingAttendance({
        role: "TEAM_LEAD",
        deliveryGroup: "PROJECT_MANAGEMENT",
        jobTitle: "Gestora",
        permissions: {
          finance: true,
          roi: true,
          communication: true,
          team: false,
        },
      }),
      true
    );

    assert.equal(
      canAccessTrainingAttendance({
        role: "TEAM_LEAD",
        deliveryGroup: "SOCIAL_PROJECT",
        jobTitle: "Gestor Projeto Social",
        permissions: {
          finance: true,
          roi: true,
          communication: true,
          team: false,
        },
      }),
      true
    );

    assert.equal(
      canAccessTrainingAttendance({
        role: "TEAM_LEAD",
        deliveryGroup: "MANUFACTURING_CNC",
        jobTitle: "Coordenadora de Produção",
        permissions: {
          finance: true,
          roi: true,
          communication: true,
          team: false,
        },
      }),
      true
    );
  });

  it("nega acesso para AUDITOR mesmo com cargo ou setor de gestão e para integrante operacional comum", () => {
    assert.equal(
      canAccessTrainingAttendance({
        role: "AUDITOR",
        deliveryGroup: "PROJECT_MANAGEMENT",
        jobTitle: "Gestor Auditor",
        permissions: {
          finance: true,
          roi: true,
          communication: true,
          team: false,
        },
      }),
      false
    );

    assert.equal(
      canAccessTrainingAttendance({
        role: "TEAM_LEAD",
        deliveryGroup: "ENGINEERING_CAD",
        jobTitle: "Engenheiro de Projeto",
        permissions: {
          finance: true,
          roi: true,
          communication: true,
          team: false,
        },
      }),
      false
    );

    assert.equal(canAccessTrainingAttendance(null), false);
    assert.equal(canAccessTrainingAttendance(undefined), false);
  });
});
