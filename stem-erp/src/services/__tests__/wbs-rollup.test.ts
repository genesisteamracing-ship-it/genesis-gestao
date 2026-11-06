import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildWbsTree } from "../wbs-rollup.service";
import type { WbsNodeDTO } from "@/types/wbs";

describe("WBS Roll-up Engine & Regra dos 100%", () => {
  it("deve retornar árvore vazia e métricas zeradas para lista vazia", () => {
    const { tree, metrics } = buildWbsTree([]);
    assert.equal(tree.length, 0);
    assert.equal(metrics.totalDeliverables, 0);
    assert.equal(metrics.totalWorkPackages, 0);
    assert.equal(metrics.totalRollupCostCents, 0);
    assert.equal(metrics.totalRollupHours, 0);
  });

  it("deve calcular nó folha único como seu próprio valor consolidado", () => {
    const mockNodes: WbsNodeDTO[] = [
      {
        id: "node-1",
        teamId: "team-1",
        parentId: null,
        code: "1.0",
        title: "Entregável Raiz Único",
        description: null,
        discipline: "PROJECT_MANAGEMENT",
        ownerId: "user-1",
        ownerName: "Capitão",
        status: "PLANNED",
        estimatedCostCents: 15000, // R$ 150,00
        estimatedHours: 10,
        sortOrder: 0,
        depth: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const { tree, metrics } = buildWbsTree(mockNodes);

    assert.equal(tree.length, 1);
    assert.equal(tree[0].isLeaf, true);
    assert.equal(tree[0].rolledUpCostCents, 15000);
    assert.equal(tree[0].rolledUpHours, 10);
    assert.equal(metrics.totalDeliverables, 1);
    assert.equal(metrics.totalWorkPackages, 1);
    assert.equal(metrics.totalRollupCostCents, 15000);
    assert.equal(metrics.totalRollupHours, 10);
  });

  it("deve agregar recursivamente valores de 3 níveis aplicando a Regra dos 100%", () => {
    // Hierarquia:
    // 1.0 Carro STEM (Raiz, soma de 1.1 e 1.2)
    //   1.1 Engenharia & CAD (Soma de 1.1.1 e 1.1.2)
    //     1.1.1 Modelagem 3D do Bico (Custo: 10000 centavos, 8h)
    //     1.1.2 Simulação CFD (Custo: 15000 centavos, 12h)
    //   1.2 Manufatura & CNC (Folha direta: Custo: 30000 centavos, 20h)
    const mockNodes: WbsNodeDTO[] = [
      {
        id: "root-1",
        teamId: "team-1",
        parentId: null,
        code: "1.0",
        title: "Carro STEM",
        description: "Projeto do Carro",
        discipline: "ENGINEERING_CAD",
        ownerId: "user-1",
        ownerName: "Líder Geral",
        status: "IN_PROGRESS",
        estimatedCostCents: 0, // Como é pai, o valor vem do roll-up
        estimatedHours: 0,
        sortOrder: 0,
        depth: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sub-1-1",
        teamId: "team-1",
        parentId: "root-1",
        code: "1.1",
        title: "Engenharia & CAD",
        description: null,
        discipline: "ENGINEERING_CAD",
        ownerId: "user-2",
        ownerName: "Líder CAD",
        status: "IN_PROGRESS",
        estimatedCostCents: 0,
        estimatedHours: 0,
        sortOrder: 0,
        depth: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "pkg-1-1-1",
        teamId: "team-1",
        parentId: "sub-1-1",
        code: "1.1.1",
        title: "Modelagem 3D do Bico",
        description: null,
        discipline: "ENGINEERING_CAD",
        ownerId: "user-3",
        ownerName: "Projetista",
        status: "COMPLETED",
        estimatedCostCents: 10000, // R$ 100,00
        estimatedHours: 8,
        sortOrder: 0,
        depth: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "pkg-1-1-2",
        teamId: "team-1",
        parentId: "sub-1-1",
        code: "1.1.2",
        title: "Simulação CFD",
        description: null,
        discipline: "ENGINEERING_CAD",
        ownerId: "user-3",
        ownerName: "Projetista",
        status: "IN_PROGRESS",
        estimatedCostCents: 15000, // R$ 150,00
        estimatedHours: 12,
        sortOrder: 1,
        depth: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sub-1-2",
        teamId: "team-1",
        parentId: "root-1",
        code: "1.2",
        title: "Manufatura & CNC",
        description: null,
        discipline: "MANUFACTURING_CNC",
        ownerId: "user-4",
        ownerName: "Usinador",
        status: "PLANNED",
        estimatedCostCents: 30000, // R$ 300,00
        estimatedHours: 20,
        sortOrder: 1,
        depth: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const { tree, metrics } = buildWbsTree(mockNodes);

    assert.equal(tree.length, 1);
    const root = tree[0];

    // Verifica que o subitem 1.1 somou seus dois filhos (10000 + 15000 = 25000 centavos, 8 + 12 = 20h)
    const sub11 = root.children.find((c) => c.code === "1.1")!;
    assert.equal(sub11.isLeaf, false);
    assert.equal(sub11.children.length, 2);
    assert.equal(sub11.rolledUpCostCents, 25000);
    assert.equal(sub11.rolledUpHours, 20);

    // Verifica que o subitem 1.2 é folha direta com seus valores
    const sub12 = root.children.find((c) => c.code === "1.2")!;
    assert.equal(sub12.isLeaf, true);
    assert.equal(sub12.children.length, 0);
    assert.equal(sub12.rolledUpCostCents, 30000);
    assert.equal(sub12.rolledUpHours, 20);

    // Verifica que o nó Raiz 1.0 somou 1.1 e 1.2 (25000 + 30000 = 55000 centavos, 20 + 20 = 40h)
    assert.equal(root.isLeaf, false);
    assert.equal(root.rolledUpCostCents, 55000);
    assert.equal(root.rolledUpHours, 40);

    // Verifica métricas consolidadas
    assert.equal(metrics.totalDeliverables, 5);
    assert.equal(metrics.totalWorkPackages, 3); // 1.1.1, 1.1.2 e 1.2 são folhas
    assert.equal(metrics.totalRollupCostCents, 55000);
    assert.equal(metrics.totalRollupHours, 40);
    assert.equal(metrics.completedDeliverables, 1); // Apenas 1.1.1 está COMPLETED
    assert.equal(metrics.disciplineCounts.ENGINEERING_CAD, 4);
    assert.equal(metrics.disciplineCounts.MANUFACTURING_CNC, 1);
  });
});
