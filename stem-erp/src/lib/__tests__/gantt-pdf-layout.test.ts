import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildGanttPdfFilename,
  computeGanttPdfLayout,
  GANTT_PDF_PAGE,
  GANTT_PDF_PALETTE,
  GANTT_PDF_STATUS_STYLES,
} from "../gantt-pdf-layout";
import type { TaskEdge, TaskRecord } from "@/types/tasks";

function makeTask(
  id: string,
  title: string,
  startDate: string,
  endDate: string,
  status: TaskRecord["status"] = "TODO"
): TaskRecord {
  return {
    id,
    title,
    description: null,
    deliveryGroup: "ENGINEERING_CAD",
    startDate,
    endDate,
    status,
    completedAt: null,
    cancelledAt: null,
    revision: 1,
    roles: [],
  };
}

describe("Gantt PDF Layout Engine (computeGanttPdfLayout)", () => {
  it("deve retornar layout vazio quando não houver tarefas", () => {
    const result = computeGanttPdfLayout({ tasks: [], teamName: "Equipe Gênesis" });
    assert.equal(result.pageCount, 0);
    assert.equal(result.pageWidth, 0);
    assert.equal(result.pageHeight, 0);
    assert.equal(result.rows.length, 0);
    assert.equal(result.connectors.length, 0);
  });

  it("deve usar paleta azul e amarelo alinhada à WBS e curvas arredondadas nas barras", () => {
    const [hr, hg, hb] = GANTT_PDF_PALETTE.headerFill;
    assert.ok(hb > hr && hb > hg, "Cabeçalho deve ser azul marinho");

    const [ir, ig, ib] = GANTT_PDF_STATUS_STYLES.IN_PROGRESS.fill;
    assert.ok(ir > 200 && ig > 170 && ib < 80, "Em andamento deve ser amarelo ouro");

    const [dr, dg, db] = GANTT_PDF_STATUS_STYLES.DONE.fill;
    assert.ok(db > dr && db > dg, "Concluída deve ser azul principal");

    assert.ok(GANTT_PDF_PAGE.barCornerRadius >= 2.5, "Barras devem possuir curvas arredondadas");
  });

  it("deve posicionar tarefas proporcionalmente às datas com barras arredondadas e conectores de dependência", () => {
    const tasks: TaskRecord[] = [
      makeTask("t1", "Modelagem 3D", "2026-03-01", "2026-03-05", "DONE"),
      makeTask("t2", "Simulação CFD", "2026-03-06", "2026-03-10", "IN_PROGRESS"),
      makeTask("t3", "Usinagem CNC", "2026-03-09", "2026-03-14", "TODO"),
    ];
    const edges: TaskEdge[] = [
      { predecessorId: "t1", successorId: "t2" },
      { predecessorId: "t2", successorId: "t3" }, // conflito de datas (09 <= 10)
    ];

    const layout = computeGanttPdfLayout({
      tasks,
      edges,
      teamName: "Equipe Gênesis",
    });

    assert.equal(layout.pageCount, 1);
    assert.equal(layout.rows.length, 3);
    assert.equal(layout.connectors.length, 2);

    const [r1, r2, r3] = layout.rows;
    assert.ok(r2.barX > r1.barX, "Tarefa posterior deve iniciar mais à direita");
    assert.ok(r2.rowY > r1.rowY, "Linhas devem crescer verticalmente");
    assert.equal(r1.cornerRadius, GANTT_PDF_PAGE.barCornerRadius);
    assert.equal(r3.hasConflict, true, "Deve sinalizar conflito de datas na sucessora");
    assert.equal(layout.connectors[0].conflict, false);
    assert.equal(layout.connectors[1].conflict, true);
    assert.ok(layout.months.length >= 1);
    assert.ok(layout.ticks.length >= 1);
  });

  it("deve manter página única expandindo largura horizontal e altura vertical para cronogramas extensos", () => {
    const manyTasks: TaskRecord[] = Array.from({ length: 24 }, (_, idx) => {
      const month = String(Math.floor(idx / 4) + 1).padStart(2, "0");
      const startDay = String((idx % 4) * 5 + 1).padStart(2, "0");
      const endDay = String((idx % 4) * 5 + 5).padStart(2, "0");
      return makeTask(
        `task-${idx}`,
        `Atividade ${idx + 1}`,
        `2026-${month}-${startDay}`,
        `2026-${month}-${endDay}`,
        idx % 3 === 0 ? "DONE" : idx % 3 === 1 ? "IN_PROGRESS" : "TODO"
      );
    });

    const layout = computeGanttPdfLayout({
      tasks: manyTasks,
      teamName: "Equipe Gênesis",
    });

    assert.equal(layout.pageCount, 1, "Deve gerar sempre uma única página");
    assert.ok(
      layout.pageWidth > GANTT_PDF_PAGE.minWidth,
      "Deve expandir a largura horizontal para cronograma longo"
    );
    assert.ok(
      layout.pageHeight > GANTT_PDF_PAGE.minHeight,
      "Deve expandir a altura vertical para comportar todas as linhas"
    );

    for (const row of layout.rows) {
      assert.ok(row.barX + row.barWidth <= layout.tableX + layout.tableWidth + 0.1);
      assert.ok(row.rowY + GANTT_PDF_PAGE.rowHeight <= layout.pageHeight - GANTT_PDF_PAGE.marginBottom + 0.1);
    }
  });

  it("deve gerar nome de arquivo sanitizado sem acentos", () => {
    const filename = buildGanttPdfFilename(
      "Equipe Gênesis #1",
      new Date(2026, 10, 25)
    );
    assert.equal(filename, "gantt-equipe-genesis-1-2026-11-25.pdf");
  });
});
