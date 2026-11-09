import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { expandWbsAncestors } from "@/lib/wbs-expansion";
import { buildWbsTree } from "@/services/wbs-rollup.service";
import { wbsToFlowElements } from "../wbs-flow.adapter";
import type { WbsNodeDTO, WbsTreeNode } from "@/types/wbs";

describe("WBS React Flow Adapter (wbsToFlowElements)", () => {
  it("deve retornar coleções vazias quando a árvore não possuir nós", () => {
    const { nodes, edges } = wbsToFlowElements({
      tree: [],
      expandedNodeIds: new Set(),
    });

    assert.equal(nodes.length, 0);
    assert.equal(edges.length, 0);
  });

  it("deve criar nó mestre do projeto e nó filho raiz com aresta smoothstep", () => {
    const sampleTree: WbsTreeNode[] = [
      {
        id: "node-1",
        teamId: "team-1",
        parentId: null,
        code: "1",
        title: "Carro & Engenharia",
        description: null,
        discipline: "ENGINEERING_CAD",
        ownerId: null,
        ownerName: null,
        status: "PLANNED",
        estimatedCostCents: 10000,
        estimatedHours: 20,
        sortOrder: 1,
        depth: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLeaf: true,
        rolledUpCostCents: 10000,
        rolledUpHours: 20,
        children: [],
      },
    ];

    const { nodes, edges } = wbsToFlowElements({
      tree: sampleTree,
      expandedNodeIds: new Set(["node-1"]),
    });

    // 1 nó mestre + 1 nó raiz
    assert.equal(nodes.length, 2);
    assert.equal(nodes[0].id, "wbs-project-root");
    assert.equal(nodes[1].id, "node-1");

    // 1 aresta conectando raiz ao nó 1
    assert.equal(edges.length, 1);
    assert.equal(edges[0].source, "wbs-project-root");
    assert.equal(edges[0].target, "node-1");
    assert.equal(edges[0].type, "smoothstep");
  });

  it("deve gerar layout com nós filhos quando nó pai estiver expandido", () => {
    const parentNode: WbsTreeNode = {
      id: "parent-1",
      teamId: "team-1",
      parentId: null,
      code: "1",
      title: "Carro",
      description: null,
      discipline: "ENGINEERING_CAD",
      ownerId: null,
      ownerName: null,
      status: "IN_PROGRESS",
      estimatedCostCents: 0,
      estimatedHours: 0,
      sortOrder: 1,
      depth: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLeaf: false,
      rolledUpCostCents: 50000,
      rolledUpHours: 40,
      children: [
        {
          id: "child-1",
          teamId: "team-1",
          parentId: "parent-1",
          code: "1.1",
          title: "Chassi",
          description: null,
          discipline: "ENGINEERING_CAD",
          ownerId: null,
          ownerName: null,
          status: "COMPLETED",
          estimatedCostCents: 50000,
          estimatedHours: 40,
          sortOrder: 1,
          depth: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isLeaf: true,
          rolledUpCostCents: 50000,
          rolledUpHours: 40,
          children: [],
        },
      ],
    };

    const { nodes, edges } = wbsToFlowElements({
      tree: [parentNode],
      expandedNodeIds: new Set(["parent-1"]),
    });

    // 1 mestre + 1 pai + 1 filho = 3 nós
    assert.equal(nodes.length, 3);
    assert.equal(edges.length, 2);
    assert.equal(edges[1].source, "parent-1");
    assert.equal(edges[1].target, "child-1");
  });

  it("deve exibir o filho de 1.1.1 após recarregar e preservar outros ramos expandidos", () => {
    function deliverable(code: string, parentId: string | null): WbsNodeDTO {
      return {
        id: code,
        code,
        teamId: "team-1",
        parentId,
        title: code,
        description: null,
        discipline: "ENGINEERING_CAD",
        ownerId: null,
        ownerName: null,
        status: "PLANNED",
        estimatedCostCents: 0,
        estimatedHours: 0,
        sortOrder: 0,
        depth: code.split(".").length,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };
    }

    const { tree } = buildWbsTree([
      deliverable("1", null),
      deliverable("1.1", "1"),
      deliverable("1.1.1", "1.1"),
      deliverable("1.1.1.1", "1.1.1"),
      deliverable("2", null),
      deliverable("2.1", "2"),
      deliverable("2.1.1", "2.1"),
      deliverable("3", null),
      deliverable("3.1", "3"),
    ]);
    const previous = new Set(["2", "2.1"]);
    const expandedNodeIds = expandWbsAncestors(tree, "1.1.1.1", previous);
    const { nodes, edges } = wbsToFlowElements({ tree, expandedNodeIds });

    assert.ok(edges.some(({ source, target }) => source === "1.1.1" && target === "1.1.1.1"));
    assert.ok(nodes.some(({ id }) => id === "2.1.1"));
    assert.ok(!nodes.some(({ id }) => id === "3.1"));
    assert.deepEqual(previous, new Set(["2", "2.1"]));
  });
});
