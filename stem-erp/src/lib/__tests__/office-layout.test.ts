import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOfficeFloorplan,
  deriveMemberStatus,
  filterOfficeMembers,
  getAvatarTraits,
  getMemberInitials,
  groupMembersBySector,
  pickPrimaryActiveTask,
} from "@/lib/office-layout";
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
  it("constrói planta arquitetônica com Ala Norte, Corredor Central, Ala Sul e 8 salas", () => {
    const members = [
      makeMember({ id: "u1", name: "Ana", deliveryGroup: "ENGINEERING_CAD" }),
      makeMember({ id: "u2", name: "Bruno", deliveryGroup: "ENGINEERING_CAD" }),
      makeMember({
        id: "u3",
        name: "Carla",
        deliveryGroup: "MARKETING_SPONSOR",
        status: "IDLE",
        activeTask: null,
        activeTasksCount: 0,
        tasks: [],
      }),
      makeMember({
        id: "u4",
        name: "Diego",
        deliveryGroup: null,
        status: "IDLE",
        activeTask: null,
        activeTasksCount: 0,
        tasks: [],
      }),
    ];

    const layout = buildOfficeFloorplan(members);

    assert.equal(layout.zones.length, 8);
    assert.equal(layout.placements.length, 4);

    const northZones = layout.zones.filter((z) => z.wing === "north");
    const southZones = layout.zones.filter((z) => z.wing === "south");
    assert.equal(northZones.length, 4);
    assert.equal(southZones.length, 4);

    assert.equal(northZones[0].y + northZones[0].height, layout.corridor.y);
    assert.equal(
      layout.corridor.y + layout.corridor.height,
      southZones[0].y
    );

    const engZone = layout.zones.find((z) => z.id === "ENGINEERING_CAD");
    assert.ok(engZone);
    assert.equal(engZone.memberCount, 2);
    assert.equal(engZone.activeCount, 2);
    assert.equal(engZone.emptyDeskSlots.length, 0);

    const mktZone = layout.zones.find((z) => z.id === "MARKETING_SPONSOR");
    assert.ok(mktZone);
    assert.equal(mktZone.emptyDeskSlots.length, 1);

    const pitZone = layout.zones.find((z) => z.id === "PIT_DISPLAY");
    assert.ok(pitZone);
    assert.equal(pitZone.emptyDeskSlots.length, 2);

    const loungeZone = layout.zones.find((z) => z.id === "LOUNGE_CAFE");
    assert.ok(loungeZone);
    assert.equal(loungeZone.memberCount, 1);

    const diegoPlacement = layout.placements.find((p) => p.member.id === "u4");
    assert.equal(diegoPlacement?.zoneId, "LOUNGE_CAFE");
  });

  it("agrupa integrantes por setor com barra de progresso e papéis RACI", () => {
    const members = [
      makeMember({
        id: "u1",
        name: "Marina",
        deliveryGroup: "ENGINEERING_CAD",
        doneTasksCount: 3,
        activeTasksCount: 1,
        todoTasksCount: 1,
        activeTask: makeTask({ id: "t-eng", role: "R" }),
      }),
      makeMember({
        id: "u2",
        name: "Caio",
        deliveryGroup: "ENGINEERING_CAD",
        doneTasksCount: 1,
        activeTasksCount: 1,
        todoTasksCount: 0,
        activeTask: makeTask({ id: "t-eng", role: "C" }),
      }),
    ];

    const groups = groupMembersBySector(members);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].id, "ENGINEERING_CAD");
    assert.deepEqual(groups[0].rolesPresent, ["R", "C"]);
    assert.ok(groups[0].totalTasksCount >= groups[0].doneTasksCount);
  });

  it("gera traços determinísticos de avatar pixel-art e respeita cor do setor", () => {
    const first = getAvatarTraits("user-abc", "ENGINEERING_CAD");
    const second = getAvatarTraits("user-abc", "ENGINEERING_CAD");

    assert.deepEqual(first, second);
    assert.equal(first.outfitTone, "primary");

    const mkt = getAvatarTraits("user-abc", "MARKETING_SPONSOR");
    assert.equal(mkt.outfitTone, "magenta");
  });

  it("filtra integrantes por nome, tarefa ativa, setor, status e papel RACI", () => {
    const members = [
      makeMember({
        id: "u1",
        name: "Marina Silva",
        deliveryGroup: "ENGINEERING_CAD",
        status: "WORKING",
        activeTask: makeTask({ title: "Teste em túnel de vento", role: "R" }),
      }),
      makeMember({
        id: "u2",
        name: "Lucas Costa",
        deliveryGroup: "MANUFACTURING_CNC",
        status: "OVERDUE",
        activeTask: makeTask({
          title: "Usinagem CNC bloco",
          isOverdue: true,
          role: "A",
        }),
        tasks: [
          makeTask({
            title: "Usinagem CNC bloco",
            isOverdue: true,
            role: "A",
          }),
        ],
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
      filterOfficeMembers(members, {
        search: "túnel",
        sector: "ALL",
        status: "ALL",
      }).length,
      1
    );
    assert.equal(
      filterOfficeMembers(members, {
        search: "",
        sector: "MANUFACTURING_CNC",
        status: "ALL",
      })[0]?.id,
      "u2"
    );
    assert.equal(
      filterOfficeMembers(members, {
        search: "",
        sector: "ALL",
        status: "IDLE",
      })[0]?.id,
      "u3"
    );
    assert.equal(
      filterOfficeMembers(members, {
        search: "",
        sector: "ALL",
        status: "ALL",
        role: "A",
      })[0]?.id,
      "u2"
    );
  });

  it("deriva status OVERDUE apenas quando o integrante é Responsável (R) e ignora atraso para C, I e A", () => {
    const tasks: OfficeTaskItemDTO[] = [
      makeTask({ id: "t-c", role: "C", isOverdue: true, endDate: "2026-11-05" }),
      makeTask({ id: "t-i", role: "I", isOverdue: true, endDate: "2026-11-06" }),
      makeTask({ id: "t-a", role: "A", isOverdue: true, endDate: "2026-11-07" }),
      makeTask({ id: "t-r-ok", role: "R", isOverdue: false, endDate: "2026-11-25" }),
    ];

    assert.equal(deriveMemberStatus(tasks), "WORKING");
    assert.equal(pickPrimaryActiveTask(tasks)?.id, "t-r-ok");

    const withResponsibleOverdue = [
      ...tasks,
      makeTask({ id: "t-r-late", role: "R", isOverdue: true, endDate: "2026-11-04" }),
    ];
    assert.equal(deriveMemberStatus(withResponsibleOverdue), "OVERDUE");
    assert.equal(pickPrimaryActiveTask(withResponsibleOverdue)?.id, "t-r-late");
    assert.equal(deriveMemberStatus([]), "IDLE");
  });

  it("extrai iniciais corretamente", () => {
    assert.equal(getMemberInitials("Marina Silva"), "MS");
    assert.equal(getMemberInitials("Lucas"), "LU");
    assert.equal(getMemberInitials("   "), "??");
  });
});
