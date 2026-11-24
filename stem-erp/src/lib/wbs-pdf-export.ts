import type { jsPDF } from "jspdf";
import type { WbsTreeNode } from "@/types/wbs";
import {
  buildWbsPdfFilename,
  computeWbsPdfLayout,
  WBS_PDF_CONNECTOR_COLOR,
  WBS_PDF_MUTED_TEXT_COLOR,
  WBS_PDF_PAGE,
  WBS_PDF_PALETTE,
  type WbsPdfBox,
} from "./wbs-pdf-layout";

export interface ExportWbsPdfParams {
  tree: WbsTreeNode[];
  teamName?: string;
}

/**
 * Desenha um nó retangular com cantos opostos chanfrados (top-left e bottom-right)
 * reproduzindo o estilo visual executivo do diagrama WBS.
 */
function drawChamferedBox(doc: jsPDF, box: WbsPdfBox): void {
  const palette = WBS_PDF_PALETTE[box.level];
  const c = Math.min(box.chamfer, box.width / 4, box.height / 2.2);

  doc.setFillColor(palette.fill[0], palette.fill[1], palette.fill[2]);
  doc.setDrawColor(palette.stroke[0], palette.stroke[1], palette.stroke[2]);
  doc.setLineWidth(palette.strokeWidth);

  const vectors: [number, number][] = [
    [box.width - c, 0],
    [0, box.height - c],
    [-c, c],
    [-(box.width - c), 0],
    [0, -(box.height - c)],
    [c, -c],
  ];

  doc.lines(vectors, box.x + c, box.y, [1, 1], "FD", true);

  // Texto centralizado vertical e horizontalmente dentro da caixa
  doc.setFont("helvetica", palette.fontWeight);
  doc.setFontSize(palette.fontSize);
  doc.setTextColor(palette.text[0], palette.text[1], palette.text[2]);

  const lineHeightMm = palette.fontSize * 0.3528 * 1.24;
  const totalTextHeight = box.lines.length * lineHeightMm;
  const firstLineBaselineY =
    box.y + (box.height - totalTextHeight) / 2 + lineHeightMm * 0.78;

  box.lines.forEach((line, idx) => {
    doc.text(
      line,
      box.x + box.width / 2,
      firstLineBaselineY + idx * lineHeightMm,
      { align: "center" }
    );
  });
}

function drawPageFooter(
  doc: jsPDF,
  pageNumber: number,
  pageCount: number,
  teamName: string | undefined,
  formattedDate: string
): void {
  const footerLineY = WBS_PDF_PAGE.height - 11.5;
  const footerTextY = WBS_PDF_PAGE.height - 7.5;

  doc.setDrawColor(214, 224, 238);
  doc.setLineWidth(0.25);
  doc.line(
    WBS_PDF_PAGE.marginX,
    footerLineY,
    WBS_PDF_PAGE.width - WBS_PDF_PAGE.marginX,
    footerLineY
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(
    WBS_PDF_MUTED_TEXT_COLOR[0],
    WBS_PDF_MUTED_TEXT_COLOR[1],
    WBS_PDF_MUTED_TEXT_COLOR[2]
  );

  const leftLabel = `${teamName?.trim() || "WBS"} • Estrutura Analítica do Projeto • ${formattedDate}`;
  doc.text(leftLabel, WBS_PDF_PAGE.marginX, footerTextY, { align: "left" });
  doc.text(
    `Página ${pageNumber} de ${pageCount}`,
    WBS_PDF_PAGE.width - WBS_PDF_PAGE.marginX,
    footerTextY,
    { align: "right" }
  );
}

/**
 * Gera e dispara o download do PDF vetorial da WBS (A4 Retrato, crescendo para baixo,
 * com nós chanfrados na paleta azul e amarelo).
 */
export async function exportWbsToPdf({
  tree,
  teamName,
}: ExportWbsPdfParams): Promise<{ filename: string; pageCount: number }> {
  if (tree.length === 0) {
    throw new Error("Não há entregáveis na WBS para exportar.");
  }

  // Importação dinâmica evita carregar jsPDF no bundle inicial SSR
  const { jsPDF: JsPdfCtor } = await import("jspdf");

  const doc = new JsPdfCtor({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const layout = computeWbsPdfLayout({
    tree,
    teamName,
    wrapText: (text, maxWidthMm, fontSizePt) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontSizePt);
      const result = doc.splitTextToSize(text, maxWidthMm);
      return Array.isArray(result) ? result : [String(result)];
    },
  });

  const now = new Date();
  const formattedDate = now.toLocaleDateString("pt-BR");

  // Cria páginas adicionais conforme necessário (crescendo verticalmente para baixo)
  for (let p = 2; p <= layout.pageCount; p += 1) {
    doc.addPage("a4", "portrait");
  }

  // Renderiza página por página: primeiro conectores (camada de fundo), depois caixas chanfradas
  for (let page = 1; page <= layout.pageCount; page += 1) {
    doc.setPage(page);

    const pageLines = layout.lines.filter((line) => line.page === page);
    doc.setDrawColor(
      WBS_PDF_CONNECTOR_COLOR[0],
      WBS_PDF_CONNECTOR_COLOR[1],
      WBS_PDF_CONNECTOR_COLOR[2]
    );
    doc.setLineWidth(0.38);

    for (const line of pageLines) {
      doc.line(line.x1, line.y1, line.x2, line.y2);
    }

    const pageBoxes = layout.boxes.filter((box) => box.page === page);
    for (const box of pageBoxes) {
      drawChamferedBox(doc, box);
    }

    drawPageFooter(doc, page, layout.pageCount, teamName, formattedDate);
  }

  const filename = buildWbsPdfFilename(teamName, now);
  doc.save(filename);

  return { filename, pageCount: layout.pageCount };
}
