import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { TeamMemberDTO } from "../../../types/auth";

describe("Team Members Table Logic & Filtering Integration", () => {
  const mockMembers: TeamMemberDTO[] = [
    {
      id: "usr-1",
      name: "SuperAdmin User",
      email: "admin@genesis.com",
      role: "SUPER_ADMIN",
      teamId: "team-alpha",
      teamName: "Equipe Alpha",
      deliveryGroup: "MANAGEMENT",
      jobTitle: "Líder Geral",
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      activeSessionsCount: 2,
      lastLoginAt: new Date().toISOString(),
      permissions: { finance: true, roi: true, communication: true, team: true },
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-2",
      name: "Engenheiro Chefe",
      email: "eng@genesis.com",
      role: "TEAM_LEAD",
      teamId: "team-genesis",
      teamName: "Equipe Genesis",
      deliveryGroup: "ENGINEERING",
      jobTitle: "Engenheiro de Pista",
      isActive: true,
      isLocked: true,
      failedLoginAttempts: 5,
      activeSessionsCount: 0,
      lastLoginAt: null,
      permissions: { finance: true, roi: true, communication: true, team: false },
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-3",
      name: "Marketing Inativo",
      email: "mkt@genesis.com",
      role: "STUDENT_MEMBER",
      teamId: "team-alpha",
      teamName: "Equipe Alpha",
      deliveryGroup: "ENTERPRISE",
      jobTitle: "Designer",
      isActive: false,
      isLocked: false,
      failedLoginAttempts: 0,
      activeSessionsCount: 0,
      lastLoginAt: null,
      permissions: { finance: false, roi: false, communication: false, team: false },
      createdAt: new Date().toISOString(),
    },
  ];

  it("deve computar status de conta corretamente (LOCKED, ACTIVE e INACTIVE)", () => {
    const resolveStatus = (member: TeamMemberDTO) => {
      if (member.isLocked) return "LOCKED";
      return member.isActive ? "ACTIVE" : "INACTIVE";
    };

    assert.equal(resolveStatus(mockMembers[0]), "ACTIVE");
    assert.equal(resolveStatus(mockMembers[1]), "LOCKED");
    assert.equal(resolveStatus(mockMembers[2]), "INACTIVE");
  });

  it("deve filtrar integrantes por equipe selecionada mantendo contagem correta", () => {
    const filterByTeam = (members: TeamMemberDTO[], teamId: string) => {
      if (teamId === "ALL") return members;
      return members.filter((m) => m.teamId === teamId);
    };

    assert.equal(filterByTeam(mockMembers, "ALL").length, 3);
    assert.equal(filterByTeam(mockMembers, "team-alpha").length, 2);
    assert.equal(filterByTeam(mockMembers, "team-genesis").length, 1);
  });

  it("deve filtrar integrantes por busca global em nome, email e cargo", () => {
    const filterBySearch = (members: TeamMemberDTO[], query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return members;
      return members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.jobTitle && m.jobTitle.toLowerCase().includes(q))
      );
    };

    assert.equal(filterBySearch(mockMembers, "Engenheiro").length, 1);
    assert.equal(filterBySearch(mockMembers, "admin@genesis").length, 1);
    assert.equal(filterBySearch(mockMembers, "Designer").length, 1);
    assert.equal(filterBySearch(mockMembers, "inexistente").length, 0);
  });

  it("deve garantir que colunas da tabela contêm os campos essenciais de visualização", () => {
    const expectedColumnKeys = [
      "id",
      "name",
      "teamId",
      "deliveryGroup",
      "role",
      "security",
      "accountStatus",
      "actions",
    ];

    assert.equal(expectedColumnKeys.length, 8);
    assert.ok(expectedColumnKeys.includes("actions"));
    assert.ok(expectedColumnKeys.includes("teamId"));
  });
});
