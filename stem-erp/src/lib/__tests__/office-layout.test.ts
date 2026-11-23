import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOfficeFloorplan,
  filterOfficeMembers,
  getAvatarTraits,
  getMemberInitials,
} from "@/lib/office-layout";
import {
  deriveMemberStatus,
  pickPrimaryActiveTask,
} from "@/services/office-service";
import type { OfficeMemberDTO, OfficeTaskItemDTO } from "@/types/office";

function makeTask(overrides: Partial<OfficeTaskItemDTO> = {}): OfficeTaskItemDTO {
  return {
    id: "task-1",
    title: "Modelagem da asa dianteira",
    description: null,
    deliveryGroup: "ENGINEERING_CAD",
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    status: "IN_PROGRESS",
    role: "R",
    isOverdue: false,
    revision: 0,
    ...overrides,
  };
}

function makeMember(overrides: Partial<OfficeMemberDTO> = {}): OfficeMemberDTO {
  return {
    id: "user-1",
    name: "Marina Silva",
    email: "marina@genesis.dev",
    jobTitle: "Líder de Engenharia",
    role: "TEAM_LEAD",
    deliveryGroup: "ENGINEERING_CAD",
    status: "WORKING",
    activeTask: makeTask(),
    activeTasksCount: 1,
    todoTasksCount: 0,
    doneTasksCount: 2,
    overdueTasksCount: 0,
    tasks: [makeTask()],
    lastLoginAt: null,
    isCurrentUser: false,
    ...overrides,
  };
}

describe("office-layout & office-service rules", () => {
  it("constrói planta com 6 setores, sala de briefing e lounge", () => {
    const members = [
      makeMember({ id: "u1", name: "Ana", deliveryGroup: "ENGINEERING_CAD" }),
      makeMember({ id: "u2", name: "Bruno", deliveryGroup: "ENGINEERING_CAD" }),
      makeMember({ id: "u3", name: "Carla", deliveryGroup: "MARKETING_SPONSOR", status: "IDLE", activeTask: null, activeTasksCount: 0, tasks: [] }),
      makeMember({ id: "u4", name: "Diego", deliveryGroup: null, status: "IDLE", activeTask: null, activeTasksCount: 0, tasks: [] }),
    ];

    const layout = buildOfficeFloorplan(members);

    assert.equal(layout.zones.length, 8);
    assert.equal(layout.placements.length, 4);

    const engZone = layout.zones.find((z) => z.id === "ENGINEERING_CAD");
    assert.ok(engZone);
    assert.equal(engZone.memberCount, 2);
    assert.equal(engZone.activeCount, 2);

    const loungeZone = layout.zones.find((z) => z.id === "LOUNGE_CAFE");
    assert.ok(loungeZone);
    assert.equal(loungeZone.memberCount, 1);

    const diegoPlacement = layout.placements.find((p) => p.member.id === "u4");
    assert.equal(diegoPlacement?.zoneId, "LOUNGE_CAFE");
  });

  it("gera traços determinísticos de avatar pixel-art e respeita cor do setor", () => {
    const first = getAvatarTraits("user-abc", "ENGINEERING_CAD");
    const second = getAvatarTraits("user-abc", "ENGINEERING_CAD");

    assert.deepEqual(first, second);
    assert.equal(first.outfitTone, "primary");

    const mkt = getAvatarTraits("user-abc", "MARKETING_SPONSOR");
    assert.equal(mkt.outfitTone, "magenta");
  });

  it("filtra integrantes por nome, tarefa ativa, setor e status", () => {
    const members = [
      makeMember({
        id: "u1",
        name: "Marina Silva",
        deliveryGroup: "ENGINEERING_CAD",
        status: "WORKING",
        activeTask: makeTask({ title: "Teste em túnel de vento" }),
      }),
      makeMember({
        id: "u2",
        name: "Lucas Costa",
        deliveryGroup: "MANUFACTURING_CNC",
        status: "OVERDUE",
        activeTask: makeTask({ title: "Usinagem CNC bloco", isOverdue: true }),
      }),
      makeMember({
        id: "u3",
        name: "Sofia Rocha",
        deliveryGroup: "MARKETING_SPONSOR",
        status: "IDLE",
        activeTask: null,
        tasks: [],
      }),
    ];

    assert.equal(
      filterOfficeMembers(members, { search: "túnel", sector: "ALL", status: "ALL" }).length,
      1
    );
    assert.equal(
      filterOfficeMembers(members, { search: "", sector: "MANUFACTURING_CNC", status: "ALL" })[0]?.id,
      "u2"
    );
    assert.equal(
      filterOfficeMembers(members, { search: "", sector: "ALL", status: "IDLE" })[0]?.id,
      "u3"
    );
  });

  it("deriva status OVERDUE quando há tarefa em andamento atrasada e prioriza papel R", () => {
    const tasks: OfficeTaskItemDTO[] = [
      makeTask({ id: "t-a", role: "C", isOverdue: false, endDate: "2026-11-20" }),
      makeTask({ id: "t-b", role: "R", isOverdue: false, endDate: "2026-11-25" }),
    ];

    assert.equal(deriveMemberStatus(tasks), "WORKING");
    assert.equal(pickPrimaryActiveTask(tasks)?.id, "t-b");

    const withOverdue = [
      ...tasks,
      makeTask({ id: "t-c", role: "A", isOverdue: true, endDate: "2026-11-05" }),
    ];
    assert.equal(deriveMemberStatus(withOverdue), "OVERDUE");
    assert.equal(pickPrimaryActiveTask(withOverdue)?.id, "t-c");
    assert.equal(deriveMemberStatus([]), "IDLE");
  });

  it("extrai iniciais corretamente", () => {
    assert.equal(getMemberInitials("Marina Silva"), "MS");
    assert.equal(getMemberInitials("Lucas"), "LU");
    assert.equal(getMemberInitials("   "), "??");
  });
});
