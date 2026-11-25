import type { jsPDF } from "jspdf";
import type { TaskStatus } from "@prisma/client";
import { TASK_STATUS_LABELS, type TaskEdge, type TaskRecord, type TaskRisk } from "@/types/tasks";
import {
  buildGanttPdfFilename,
  computeGanttPdfLayout,
  GANTT_PDF_PAGE,
  GANTT_PDF_PALETTE,
  GANTT_PDF_STATUS_STYLES,
  type GanttPdfConnector,
  type GanttPdfLayoutResult,
} from "./gantt-pdf-layout";

export interface ExportGanttPdfParams {
  tasks: TaskRecord[];
  edges?: TaskEdge[];
  highlightedPath?: TaskRisk;
  teamName?: string;
}

function truncateTextToWidth(doc: jsPDF, text: string, maxWidthMm: number): string {
  if (maxWidthMm <= 2) return "";
  if (doc.getTextWidth(text) <= maxWidthMm) return text;

  const ellipsis = "…";
  const ellipsisWidth = doc.getTextWidth(ellipsis);
  let result = text;
  while (result.length > 1 && doc.getTextWidth(result) + ellipsisWidth > maxWidthMm) {
    result = result.slice(0, -1);
  }
  return result.trimEnd() + ellipsis;
}

function drawChamferedBanner(doc: jsPDF, layout: GanttPdfLayoutResult): void {
  const { x, y, width, height, chamfer } = layout.banner;
  const c = Math.min(chamfer, width / 4, height / 2.2);

  doc.setFillColor(...GANTT_PDF_PALETTE.headerFill);
  doc.setDrawColor(...GANTT_PDF_PALETTE.headerStroke);
  doc.setLineWidth(0.45);

  const vectors: [number, number][] = [
    [width - c, 0],
    [0, height - c],
    [-c, c],
    [-(width - c), 0],
    [0, -(height - c)],
    [c, -c],
  ];

  doc.lines(vectors, x + c, y, [1, 1], "FD", true);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...GANTT_PDF_PALETTE.headerText);
  doc.text(layout.title, x + width / 2, y + height / 2 + 1.3, { align: "center" });
}

function drawLegendRow(doc: jsPDF, layout: GanttPdfLayoutResult): void {
  const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
  let cursorX = layout.tableX;
  const y = layout.legendY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);

  for (const status of statuses) {
    const style = GANTT_PDF_STATUS_STYLES[status];
    const label = TASK_STATUS_LABELS[status];

    // Pílula arredondada de amostra de cor
    doc.setFillColor(...style.fill);
    doc.setDrawColor(...style.stroke);
    doc.setLineWidth(0.35);
    doc.roundedRect(cursorX, y - 2.9, 6.2, 3.8, 1.8, 1.8, "FD");

    doc.setTextColor(...GANTT_PDF_PALETTE.labelTitle);
    doc.text(label, cursorX + 7.8, y, { align: "left" });
    cursorX += 7.8 + doc.getTextWidth(label) + 6;
  }

  // Período consolidado alinhado à direita
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  doc.setTextColor(...GANTT_PDF_PALETTE.mutedText);
  doc.text(layout.periodLabel, layout.tableX + layout.tableWidth, y, { align: "right" });
}

function drawConnector(doc: jsPDF, connector: GanttPdfConnector): void {
  if (connector.points.length < 2) return;

  const color = connector.conflict
    ? GANTT_PDF_PALETTE.connectorConflict
    : connector.highlighted
      ? GANTT_PDF_PALETTE.connectorHighlighted
      : GANTT_PDF_PALETTE.connector;

  doc.setDrawColor(...color);
  doc.setFillColor(...color);
  doc.setLineWidth(connector.highlighted || connector.conflict ? 0.45 : 0.3);

  for (let i = 0; i < connector.points.length - 1; i += 1) {
    const p1 = connector.points[i];
    const p2 = connector.points[i + 1];
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }

  // Ponta de seta apontando para a borda esquerda da tarefa sucessora
  const end = connector.points[connector.points.length - 1];
  doc.triangle(
    end.x,
    end.y,
    end.x - 1.9,
    end.y - 1.05,
    end.x - 1.9,
    end.y + 1.05,
    "F"
  );
}

function drawPageFooter(
  doc: jsPDF,
  layout: GanttPdfLayoutResult,
  teamName: string | undefined,
  formattedDate: string
): void {
  const footerLineY = layout.pageHeight - 11.5;
  const footerTextY = layout.pageHeight - 7.5;

  doc.setDrawColor(214, 224, 238);
  doc.setLineWidth(0.25);
  doc.line(
    GANTT_PDF_PAGE.marginX,
    footerLineY,
    layout.pageWidth - GANTT_PDF_PAGE.marginX,
    footerLineY
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GANTT_PDF_PALETTE.mutedText);

  const leftLabel = `${teamName?.trim() || "Cronograma"} • Diagrama de Gantt • ${formattedDate}`;
  doc.text(leftLabel, GANTT_PDF_PAGE.marginX, footerTextY, { align: "left" });
  doc.text("Página 1 de 1", layout.pageWidth - GANTT_PDF_PAGE.marginX, footerTextY, {
    align: "right",
  });
}

/**
 * Gera e dispara o download do PDF vetorial do Cronograma de Gantt em PÁGINA ÚNICA,
 * seguindo a identidade visual azul e amarelo da WBS com barras de curvas arredondadas.
 */
export async function exportGanttToPdf({
  tasks,
  edges = [],
  highlightedPath,
  teamName,
}: ExportGanttPdfParams): Promise<{ filename: string; pageCount: number }> {
  if (tasks.length === 0) {
    throw new Error("Não há tarefas no cronograma para exportar.");
  }

  const layout = computeGanttPdfLayout({
    tasks,
    edges,
    highlightedPath,
    teamName,
  });

  const { jsPDF: JsPdfCtor } = await import("jspdf");

  const orientation =
    layout.pageWidth >= layout.pageHeight ? "landscape" : "portrait";

  const doc = new JsPdfCtor({
    orientation,
    unit: "mm",
    format: [layout.pageWidth, layout.pageHeight],
    compress: true,
  });

  const now = new Date();
  const formattedDate = now.toLocaleDateString("pt-BR");

  // 1. Banner superior e legenda de status
  drawChamferedBanner(doc, layout);
  drawLegendRow(doc, layout);

  const headerTotalHeight =
    GANTT_PDF_PAGE.monthHeaderHeight + GANTT_PDF_PAGE.tickHeaderHeight;
  const rowsStartY = layout.tableY + headerTotalHeight;

  // 2. Cabeçalho da coluna esquerda ("Tarefa / Setor")
  doc.setFillColor(...GANTT_PDF_PALETTE.timelineMonthFill);
  doc.rect(
    layout.tableX,
    layout.tableY,
    GANTT_PDF_PAGE.labelColWidth,
    headerTotalHeight,
    "F"
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(...GANTT_PDF_PALETTE.timelineHeaderText);
  doc.text(
    "Tarefa / Setor",
    layout.tableX + 3,
    layout.tableY + headerTotalHeight / 2 + 1,
    { align: "left" }
  );

  // 3. Faixa superior de Meses (Azul Marinho)
  doc.setFillColor(...GANTT_PDF_PALETTE.timelineMonthFill);
  doc.rect(
    layout.timelineX,
    layout.tableY,
    layout.timelineWidth,
    GANTT_PDF_PAGE.monthHeaderHeight,
    "F"
  );

  doc.setDrawColor(62, 110, 194);
  doc.setLineWidth(0.25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(...GANTT_PDF_PALETTE.timelineHeaderText);

  for (const month of layout.months) {
    doc.line(
      month.x,
      layout.tableY,
      month.x,
      layout.tableY + GANTT_PDF_PAGE.monthHeaderHeight
    );
    if (month.width >= 10) {
      doc.text(
        month.label,
        month.x + month.width / 2,
        layout.tableY + GANTT_PDF_PAGE.monthHeaderHeight / 2 + 1,
        { align: "center" }
      );
    }
  }

  // 4. Faixa de Datas / Ticks (Azul Principal)
  const tickHeaderY = layout.tableY + GANTT_PDF_PAGE.monthHeaderHeight;
  doc.setFillColor(...GANTT_PDF_PALETTE.timelineHeaderFill);
  doc.rect(
    layout.timelineX,
    tickHeaderY,
    layout.timelineWidth,
    GANTT_PDF_PAGE.tickHeaderHeight,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(...GANTT_PDF_PALETTE.timelineHeaderText);

  for (const tick of layout.ticks) {
    doc.setDrawColor(96, 145, 232);
    doc.setLineWidth(0.2);
    doc.line(tick.x, tickHeaderY, tick.x, tickHeaderY + GANTT_PDF_PAGE.tickHeaderHeight);
    doc.text(
      tick.label,
      tick.x + 1.2,
      tickHeaderY + GANTT_PDF_PAGE.tickHeaderHeight / 2 + 0.9,
      { align: "left" }
    );
  }

  // 5. Linhas zebra das tarefas + textos da coluna esquerda
  for (const row of layout.rows) {
    const bg =
      row.index % 2 === 0
        ? GANTT_PDF_PALETTE.rowEvenFill
        : GANTT_PDF_PALETTE.rowOddFill;

    doc.setFillColor(...bg);
    doc.rect(
      layout.tableX,
      row.rowY,
      layout.tableWidth,
      GANTT_PDF_PAGE.rowHeight,
      "F"
    );

    // Linha divisória horizontal
    doc.setDrawColor(...GANTT_PDF_PALETTE.gridLine);
    doc.setLineWidth(0.22);
    doc.line(
      layout.tableX,
      row.rowY + GANTT_PDF_PAGE.rowHeight,
      layout.tableX + layout.tableWidth,
      row.rowY + GANTT_PDF_PAGE.rowHeight
    );

    // Título da tarefa e setor na coluna esquerda
    const maxLabelWidth = GANTT_PDF_PAGE.labelColWidth - 5.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(...GANTT_PDF_PALETTE.labelTitle);
    const truncatedTitle = truncateTextToWidth(doc, row.title, maxLabelWidth);
    doc.text(truncatedTitle, layout.tableX + 2.8, row.rowY + 4.8, { align: "left" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    doc.setTextColor(...GANTT_PDF_PALETTE.labelMeta);
    const metaText = truncateTextToWidth(
      doc,
      `${row.sectorLabel} • ${formatTaskDateShort(row.startDate)}–${formatTaskDateShort(row.endDate)}`,
      maxLabelWidth
    );
    doc.text(metaText, layout.tableX + 2.8, row.rowY + 8.8, { align: "left" });
  }

  // 6. Linhas de grade verticais da timeline
  doc.setDrawColor(...GANTT_PDF_PALETTE.gridLine);
  doc.setLineWidth(0.2);
  for (const tick of layout.ticks) {
    doc.line(tick.x, rowsStartY, tick.x, layout.tableY + layout.tableHeight);
  }

  // Divisória entre coluna de labels e timeline
  doc.setDrawColor(...GANTT_PDF_PALETTE.tableBorder);
  doc.setLineWidth(0.35);
  doc.line(
    layout.timelineX,
    layout.tableY,
    layout.timelineX,
    layout.tableY + layout.tableHeight
  );

  // 7. Conectores de dependência (desenhados antes das barras ou logo atrás)
  for (const connector of layout.connectors) {
    drawConnector(doc, connector);
  }

  // 8. Barras das Tasks com curvas arredondadas (roundedRect)
  for (const row of layout.rows) {
    const style = GANTT_PDF_STATUS_STYLES[row.status];
    const radius = Math.min(row.cornerRadius, row.barHeight / 2, row.barWidth / 2);

    // Anel externo amarelo ouro se pertencer ao caminho em destaque
    if (row.highlighted) {
      doc.setDrawColor(...GANTT_PDF_PALETTE.highlightRing);
      doc.setLineWidth(0.9);
      doc.roundedRect(
        row.barX - 0.6,
        row.barY - 0.6,
        row.barWidth + 1.2,
        row.barHeight + 1.2,
        radius + 0.5,
        radius + 0.5,
        "S"
      );
    }

    doc.setFillColor(...style.fill);
    doc.setDrawColor(
      ...(row.hasConflict ? GANTT_PDF_PALETTE.connectorConflict : style.stroke)
    );
    doc.setLineWidth(row.hasConflict ? 0.55 : style.strokeWidth);
    doc.roundedRect(
      row.barX,
      row.barY,
      row.barWidth,
      row.barHeight,
      radius,
      radius,
      "FD"
    );

    // Rótulo dentro da barra (ou à direita caso a barra seja muito estreita)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.1);
    const innerAvail = row.barWidth - 4.5;
    if (innerAvail >= 14) {
      doc.setTextColor(...style.text);
      const label = truncateTextToWidth(doc, row.title, innerAvail);
      doc.text(
        label,
        row.barX + 2.4,
        row.barY + row.barHeight / 2 + 0.9,
        { align: "left" }
      );
    } else {
      const rightSpace = layout.tableX + layout.tableWidth - (row.barX + row.barWidth) - 3;
      if (rightSpace >= 10) {
        doc.setTextColor(...GANTT_PDF_PALETTE.labelTitle);
        const label = truncateTextToWidth(doc, row.title, rightSpace);
        doc.text(
          label,
          row.barX + row.barWidth + 2,
          row.barY + row.barHeight / 2 + 0.9,
          { align: "left" }
        );
      }
    }
  }

  // 9. Borda externa limpa da tabela
  doc.setDrawColor(...GANTT_PDF_PALETTE.tableBorder);
  doc.setLineWidth(0.4);
  doc.rect(layout.tableX, layout.tableY, layout.tableWidth, layout.tableHeight, "S");

  // 10. Rodapé
  drawPageFooter(doc, layout, teamName, formattedDate);

  const filename = buildGanttPdfFilename(teamName, now);
  doc.save(filename);

  return { filename, pageCount: layout.pageCount };
}

function formatTaskDateShort(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}
