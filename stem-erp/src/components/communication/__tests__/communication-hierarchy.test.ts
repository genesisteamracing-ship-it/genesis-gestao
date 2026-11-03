import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildStakeholderHierarchyTree,
  computeHierarchyTier,
} from "@/lib/communication-hierarchy";
import type { StakeholderWithRelations } from "@/types/communication";

function makeStakeholder(
  overrides: Partial<StakeholderWithRelations> & { id: string; name: string }
): StakeholderWithRelations {
  return {
    id: overrides.id,
    teamId: overrides.teamId ?? "team-1",
    sponsorId: overrides.sponsorId ?? null,
    parentStakeholderId: overrides.parentStakeholderId ?? null,
    name: overrides.name,
    organization: overrides.organization ?? "SESI",
    roleOrJobTitle: overrides.roleOrJobTitle ?? null,
    group: overrides.group ?? "SCHOOL_LEADERSHIP",
    email: overrides.email ?? null,
    phone: overrides.phone ?? null,
    power: overrides.power ?? "LOW",
    interest: overrides.interest ?? "LOW",
    currentEngagement: overrides.currentEngagement ?? "SUPPORTIVE",
    targetEngagement: overrides.targetEngagement ?? "LEADING",
    preferredChannel: overrides.preferredChannel ?? "WHATSAPP",
    preferredFrequency: overrides.preferredFrequency ?? "BIWEEKLY",
    notes: overrides.notes ?? null,
    createdAt: new Date("2026-10-01T10:00:00Z"),
    updatedAt: new Date("2026-10-01T10:00:00Z"),
    sponsor: overrides.sponsor ?? null,
    plans: overrides.plans ?? [],
    communications: overrides.communications ?? [],
  };
}

describe("Motor Hierárquico de Stakeholders (communication-hierarchy)", () => {
  it("classifica corretamente os 4 degraus de Poder e Interesse", () => {
    assert.equal(computeHierarchyTier("HIGH", "HIGH").rankWeight, 4);
    assert.equal(computeHierarchyTier("HIGH", "HIGH").tier, "TIER_1_STRATEGIC");

    assert.equal(computeHierarchyTier("HIGH", "LOW").rankWeight, 3);
    assert.equal(computeHierarchyTier("HIGH", "LOW").tier, "TIER_2_INSTITUTIONAL");

    assert.equal(computeHierarchyTier("LOW", "HIGH").rankWeight, 2);
    assert.equal(computeHierarchyTier("LOW", "HIGH").tier, "TIER_3_TACTICAL");

    assert.equal(computeHierarchyTier("LOW", "LOW").rankWeight, 1);
    assert.equal(computeHierarchyTier("LOW", "LOW").tier, "TIER_4_OPERATIONAL");
  });

  it("encadeia verticalmente SESI -> Diretoria -> Técnicos -> Professores de acordo com Poder e Interesse", () => {
    const stakeholders: StakeholderWithRelations[] = [
      makeStakeholder({
        id: "st-prof",
        name: "Professores",
        organization: "SESI",
        power: "LOW",
        interest: "LOW",
      }),
      makeStakeholder({
        id: "st-dir",
        name: "Diretoria",
        organization: "SESI",
        power: "HIGH",
        interest: "HIGH",
      }),
      makeStakeholder({
        id: "st-tec",
        name: "Técnicos",
        organization: "SESI",
        power: "LOW",
        interest: "HIGH",
      }),
    ];

    const tree = buildStakeholderHierarchyTree({
      teamName: "Equipe Gênesis",
      stakeholders,
    });

    assert.equal(tree.totalPartners, 1);
    assert.equal(tree.totalStakeholders, 3);

    const sesiBranch = tree.partners[0];
    assert.equal(sesiBranch.partnerName, "SESI");
    assert.equal(sesiBranch.rootNodes.length, 1);

    const level1 = sesiBranch.rootNodes[0];
    assert.equal(level1.stakeholder.name, "Diretoria");
    assert.equal(level1.depth, 1);
    assert.equal(level1.children.length, 1);

    const level2 = level1.children[0];
    assert.equal(level2.stakeholder.name, "Técnicos");
    assert.equal(level2.depth, 2);
    assert.equal(level2.children.length, 1);

    const level3 = level2.children[0];
    assert.equal(level3.stakeholder.name, "Professores");
    assert.equal(level3.depth, 3);
    assert.equal(level3.children.length, 0);
  });

  it("respeita subordinação explícita via parentStakeholderId e previne ciclos", () => {
    const stakeholders: StakeholderWithRelations[] = [
      makeStakeholder({
        id: "st-1",
        name: "Diretoria Regional",
        organization: "SENAI",
        power: "HIGH",
        interest: "HIGH",
      }),
      makeStakeholder({
        id: "st-2",
        name: "Coordenação Pedagógica",
        organization: "SENAI",
        power: "HIGH",
        interest: "HIGH",
        parentStakeholderId: "st-1",
      }),
      makeStakeholder({
        id: "st-3",
        name: "Instrutores de Oficina",
        organization: "SENAI",
        power: "LOW",
        interest: "HIGH",
        parentStakeholderId: "st-2",
      }),
    ];

    const tree = buildStakeholderHierarchyTree({
      teamName: "Equipe Gênesis",
      stakeholders,
    });

    const senai = tree.partners[0];
    assert.equal(senai.rootNodes.length, 1);
    assert.equal(senai.rootNodes[0].stakeholder.name, "Diretoria Regional");
    assert.equal(
      senai.rootNodes[0].children[0].stakeholder.name,
      "Coordenação Pedagógica"
    );
    assert.equal(
      senai.rootNodes[0].children[0].children[0].stakeholder.name,
      "Instrutores de Oficina"
    );
  });

  it("filtra parceiros e stakeholders por busca textual e partnerFilter", () => {
    const stakeholders: StakeholderWithRelations[] = [
      makeStakeholder({
        id: "s1",
        name: "Diretoria SESI",
        organization: "SESI",
        power: "HIGH",
        interest: "HIGH",
      }),
      makeStakeholder({
        id: "s2",
        name: "Gerência Bosch",
        organization: "Bosch",
        power: "HIGH",
        interest: "HIGH",
      }),
    ];

    const filteredByPartner = buildStakeholderHierarchyTree({
      teamName: "Equipe Gênesis",
      stakeholders,
      partnerFilter: "sesi",
    });
    assert.equal(filteredByPartner.totalPartners, 1);
    assert.equal(filteredByPartner.partners[0].partnerName, "SESI");

    const filteredBySearch = buildStakeholderHierarchyTree({
      teamName: "Equipe Gênesis",
      stakeholders,
      searchQuery: "Bosch",
    });
    assert.equal(filteredBySearch.totalPartners, 1);
    assert.equal(filteredBySearch.partners[0].partnerName, "Bosch");
  });
});
