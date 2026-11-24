import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildWbsPdfFilename,
  computeWbsPdfLayout,
  WBS_PDF_PAGE,
  WBS_PDF_PALETTE,
} from "../wbs-pdf-layout";
import type { WbsTreeNode } from "@/types/wbs";

function makeNode(
  id: string,
  code: string,
  title: string,
  depth: number,
  children: WbsTreeNode[] = []
): WbsTreeNode {
  return {
    id,
    teamId: "team-1",
    parentId: depth === 1 ? null : "parent",
    code,
    title,
    description: null,
    discipline: "PROJECT_MANAGEMENT",
    ownerId: null,
    ownerName: null,
    status: "PLANNED",
    estimatedCostCents: 0,
    estimatedHours: 0,
    sortOrder: 0,
    depth,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    isLeaf: children.length === 0,
    rolledUpCostCents: 0,
    rolledUpHours: 0,
    children,
  };
}

describe("WBS PDF Layout Engine (computeWbsPdfLayout)", () => {
  it("deve retornar layout vazio quando a árvore não possuir entregáveis", () => {
    const result = computeWbsPdfLayout({ tree: [], teamName: "Equipe Gênesis" });
    assert.equal(result.pageCount, 0);
    assert.equal(result.pageWidth, 0);
    assert.equal(result.pageHeight, 0);
    assert.equal(result.boxes.length, 0);
    assert.equal(result.lines.length, 0);
    assert.equal(result.totalNodes, 0);
  });

  it("deve usar paleta azul e amarelo sem tons de verde predominante nos níveis", () => {
    const [r0, g0, b0] = WBS_PDF_PALETTE[0].fill;
    assert.ok(b0 > r0 && b0 > g0, "Nível 0 deve ser azul");

    const [r1, g1, b1] = WBS_PDF_PALETTE[1].fill;
    assert.ok(b1 > r1 && b1 > g1, "Nível 1 deve ser azul");

    const [r2, g2, b2] = WBS_PDF_PALETTE[2].fill;
    assert.ok(r2 > 200 && g2 > 170 && b2 < 80, "Nível 2 deve ser amarelo");

    assert.deepEqual(WBS_PDF_PALETTE[3].fill, [255, 255, 255]);
    const [sr3, sg3, sb3] = WBS_PDF_PALETTE[3].stroke;
    assert.ok(sb3 > sr3 && sb3 > sg3, "Borda do Nível 3 deve ser azul");
  });

  it("deve posicionar setores lado a lado na horizontal e empilhar Nível 3 para baixo em página única", () => {
    const tree: WbsTreeNode[] = [
      makeNode("s1", "1", "PROJECT MANAGEMENT", 1, [
        makeNode("s1-1", "1.1", "INITIATING", 2, [
          makeNode("s1-1-1", "1.1.1", "Termo de Abertura", 3),
          makeNode("s1-1-2", "1.1.2", "Mapa de Stakeholders", 3),
        ]),
        makeNode("s1-2", "1.2", "PLANNING", 2, [
          makeNode("s1-2-1", "1.2.1", "Cronograma", 3),
        ]),
      ]),
      makeNode("s2", "2", "ENGINEERING", 1, [
        makeNode("s2-1", "2.1", "CAD AND TEST", 2, [
          makeNode("s2-1-1", "2.1.1", "Modelagem 3D", 3),
          makeNode("s2-1-2", "2.1.2", "Simulação CFD", 3),
        ]),
      ]),
    ];

    const layout = computeWbsPdfLayout({ tree, teamName: "Equipe Gênesis" });

    assert.equal(layout.pageCount, 1);
    assert.equal(layout.totalNodes, 10);

    const rootBox = layout.boxes.find((b) => b.level === 0);
    const s1Box = layout.boxes.find((b) => b.id === "s1");
    const s2Box = layout.boxes.find((b) => b.id === "s2");
    const l3a = layout.boxes.find((b) => b.id === "s1-1-1");
    const l3b = layout.boxes.find((b) => b.id === "s1-1-2");

    assert.ok(rootBox && s1Box && s2Box && l3a && l3b);

    // Setores Nível 1 alinhados na mesma linha horizontal, crescendo para a direita
    assert.equal(s1Box.y, s2Box.y);
    assert.ok(s2Box.x > s1Box.x + s1Box.width);

    // Nível 3 empilhados verticalmente para baixo na mesma coluna
    assert.equal(l3a.x, l3b.x);
    assert.ok(l3b.y > l3a.y + l3a.height);

    // Todos os elementos dentro das dimensões dinâmicas da página única
    for (const box of layout.boxes) {
      assert.equal(box.page, 1);
      assert.ok(box.x >= WBS_PDF_PAGE.marginX - 0.1);
      assert.ok(box.x + box.width <= layout.pageWidth - WBS_PDF_PAGE.marginX + 0.1);
      assert.ok(box.y + box.height <= layout.pageHeight - WBS_PDF_PAGE.marginBottom + 0.1);
      assert.ok(box.chamfer > 0);
    }

    assert.ok(layout.lines.length > 0);
  });

  it("deve aumentar a largura da página na horizontal sem criar páginas extras para WBS extensa", () => {
    const wideTree: WbsTreeNode[] = Array.from({ length: 6 }, (_, sIdx) =>
      makeNode(
        `sector-${sIdx}`,
        `${sIdx + 1}`,
        `SETOR ${sIdx + 1}`,
        1,
        Array.from({ length: 3 }, (_, subIdx) =>
          makeNode(
            `sub-${sIdx}-${subIdx}`,
            `${sIdx + 1}.${subIdx + 1}`,
            `SUBCATEGORIA ${subIdx + 1}`,
            2,
            Array.from({ length: 8 }, (_, wpIdx) =>
              makeNode(
                `wp-${sIdx}-${subIdx}-${wpIdx}`,
                `${sIdx + 1}.${subIdx + 1}.${wpIdx + 1}`,
                `Pacote de Trabalho ${wpIdx + 1}`,
                3
              )
            )
          )
        )
      )
    );

    const layout = computeWbsPdfLayout({ tree: wideTree, teamName: "Equipe Gênesis" });

    assert.equal(layout.pageCount, 1, "Nunca deve adicionar novas páginas");
    assert.ok(
      layout.pageWidth > WBS_PDF_PAGE.minWidth,
      "Deve expandir a largura da página para acomodar todos os setores na horizontal"
    );

    for (const box of layout.boxes) {
      assert.equal(box.page, 1);
      assert.ok(box.x + box.width <= layout.pageWidth - WBS_PDF_PAGE.marginX + 0.1);
      assert.ok(box.y + box.height <= layout.pageHeight - WBS_PDF_PAGE.marginBottom + 0.1);
    }
  });

  it("deve gerar nome de arquivo sanitizado sem acentos", () => {
    const filename = buildWbsPdfFilename(
      "Equipe Gênesis #1",
      new Date(2026, 10, 24)
    );
    assert.equal(filename, "wbs-equipe-genesis-1-2026-11-24.pdf");
  });
});
