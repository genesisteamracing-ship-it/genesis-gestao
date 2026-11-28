import type { jsPDF } from "jspdf";
import type { BudgetResourceDTO } from "@/types/financial";
import {
  BUDGET_PDF_COLORS,
  buildBudgetPlanningData,
  buildBudgetPlanningFilename,
  type BudgetPlanningData,
  type BudgetPlanningRow,
} from "./budget-planning-pdf-layout";
import { formatCurrencyBRL } from "./financial-statement-pdf-layout";

export interface ExportBudgetPlanningPdfParams {
  resources: BudgetResourceDTO[];
  teamName?: string;
  seasonLabel?: string;
  monthLabels?: Record<number, string>;
}

const PAGE_WIDTH = 210; // A4 Retrato (mm)
const PAGE_HEIGHT = 297;
const MARGIN_X = 12;
const MARGIN_TOP = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 186mm
const CONTENT_BOTTOM = PAGE_HEIGHT - 16; // 281mm

const COL_X = {
  code: MARGIN_X + 1.5,
  month: MARGIN_X + 21,
  strategy: MARGIN_X + 41,
  resource: MARGIN_X + 68,
  plannedRight: MARGIN_X + CONTENT_WIDTH - 1.5,
} as const;

const COL_WIDTH = {
  code: 18,
  strategy: 25,
  resource: 88,
} as const;

/**
 * Desenha o cabeçalho bicolor Azul + Amarelo com corte diagonal no topo,
 * idêntico ao Extrato Financeiro do Livro Caixa, seguido de metadados e barra da seção.
 */
function drawPageHeader(doc: jsPDF, data: BudgetPlanningData): number {
  const bannerY = MARGIN_TOP;
  const bannerH = 16.5;
  const splitTopX = MARGIN_X + CONTENT_WIDTH * 0.72;
  const splitBottomX = splitTopX - 8.5;

  // Bloco direito (Amarelo Ouro Gênesis)
  doc.setFillColor(...BUDGET_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, bannerY, CONTENT_WIDTH, bannerH, "F");

  // Polígono esquerdo (Azul Gênesis com corte diagonal)
  doc.setFillColor(...BUDGET_PDF_COLORS.brandBlue);
  const blueVectors: [number, number][] = [
    [splitTopX - MARGIN_X, 0],
    [splitBottomX - splitTopX, bannerH],
    [-(splitBottomX - MARGIN_X), 0],
    [0, -bannerH],
  ];
  doc.lines(blueVectors, MARGIN_X, bannerY, [1, 1], "F", true);

  // Título em Amarelo sobre o Azul (esquerda)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.setTextColor(...BUDGET_PDF_COLORS.brandYellow);
  doc.text("Planejamento Orçamentário", MARGIN_X + 3.5, bannerY + 7.2, {
    align: "left",
  });

  // Nome da Equipe em Branco sobre o Azul (esquerda)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BUDGET_PDF_COLORS.white);
  doc.text(
    `Equipe: ${data.teamDisplayName.toUpperCase()}`,
    MARGIN_X + 3.5,
    bannerY + 13.4,
    { align: "left" }
  );

  // Marca "GÊNESIS" sobre o Amarelo (direita)
  const yellowCenterX =
    splitTopX + (MARGIN_X + CONTENT_WIDTH - splitTopX) / 2 + 1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BUDGET_PDF_COLORS.brandNavy);
  doc.text("GÊNESIS", yellowCenterX, bannerY + 8.6, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("GESTÃO FINANCEIRA", yellowCenterX, bannerY + 13, {
    align: "center",
  });

  // Linha de metadados (Escopo, Total Orçado, Total de recursos)
  const metaY = bannerY + bannerH + 4.8;
  doc.setFontSize(7.8);
  doc.setTextColor(...BUDGET_PDF_COLORS.textPrimary);

  doc.setFont("helvetica", "bold");
  doc.text("Escopo:", MARGIN_X, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(data.scopeLabel, MARGIN_X + 12.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BUDGET_PDF_COLORS.textPrimary);
  doc.text("Total Orçado:", MARGIN_X + 76, metaY);
  doc.setTextColor(...BUDGET_PDF_COLORS.brandNavy);
  doc.text(formatCurrencyBRL(data.totalPlannedCents), MARGIN_X + 97, metaY);

  doc.setTextColor(...BUDGET_PDF_COLORS.textPrimary);
  doc.text(
    `${data.resourceCount} ${data.resourceCount === 1 ? "recurso" : "recursos"}`,
    MARGIN_X + CONTENT_WIDTH,
    metaY,
    { align: "right" }
  );

  // Barra da seção "Orçamentos Planejados"
  const sectionY = metaY + 3.2;
  const sectionH = 6.2;
  doc.setFillColor(...BUDGET_PDF_COLORS.sectionBarBg);
  doc.rect(MARGIN_X, sectionY, CONTENT_WIDTH, sectionH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BUDGET_PDF_COLORS.brandBlue);
  doc.text("Orçamentos Planejados", MARGIN_X + 2, sectionY + 4.4, {
    align: "left",
  });

  // Cabeçalho das colunas (apenas Orçado, sem Realizado)
  const colHeaderY = sectionY + sectionH + 4.4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...BUDGET_PDF_COLORS.textPrimary);

  doc.text("Código", COL_X.code, colHeaderY, { align: "left" });
  doc.text("Mês", COL_X.month, colHeaderY, { align: "left" });
  doc.text("Aquisição", COL_X.strategy, colHeaderY, { align: "left" });
  doc.text("Recurso", COL_X.resource, colHeaderY, { align: "left" });
  doc.text("Orçado", COL_X.plannedRight, colHeaderY, { align: "right" });

  // Linha divisória abaixo do cabeçalho das colunas
  const headerBottomY = colHeaderY + 1.8;
  doc.setDrawColor(...BUDGET_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, headerBottomY, MARGIN_X + CONTENT_WIDTH, headerBottomY);

  return headerBottomY;
}

function measureRow(
  doc: jsPDF,
  row: BudgetPlanningRow
): {
  height: number;
  codeLines: string[];
  strategyLines: string[];
  primaryLines: string[];
  secondaryLines: string[];
} {
  if (row.kind !== "RESOURCE") {
    return {
      height: row.kind === "FINAL_TOTAL" ? 7.6 : 6.4,
      codeLines: [],
      strategyLines: [],
      primaryLines: [row.resourcePrimary],
      secondaryLines: [],
    };
  }

  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  const codeLines = doc.splitTextToSize(row.code, COL_WIDTH.code) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  const strategyLines = doc.splitTextToSize(
    row.strategyLabel,
    COL_WIDTH.strategy
  ) as string[];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  const primaryLines = doc.splitTextToSize(
    row.resourcePrimary,
    COL_WIDTH.resource
  ) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  const secondaryLines = row.resourceSecondary
    ? (doc.splitTextToSize(
        row.resourceSecondary,
        COL_WIDTH.resource
      ) as string[])
    : [];

  const resourceHeight =
    primaryLines.length * 3.5 + secondaryLines.length * 3.1;
  const sideHeight = Math.max(codeLines.length, strategyLines.length) * 3.2;
  const height = Math.max(8.4, Math.max(resourceHeight, sideHeight) + 2.8);

  return { height, codeLines, strategyLines, primaryLines, secondaryLines };
}

function drawRow(
  doc: jsPDF,
  row: BudgetPlanningRow,
  y: number,
  rowIndex: number,
  measured: ReturnType<typeof measureRow>
): void {
  const { height, codeLines, strategyLines, primaryLines, secondaryLines } =
    measured;

  // Fundo da linha
  if (row.kind === "FINAL_TOTAL") {
    doc.setFillColor(...BUDGET_PDF_COLORS.finalBalanceBg);
  } else if (row.kind === "GROUP_SUBTOTAL") {
    doc.setFillColor(...BUDGET_PDF_COLORS.dailyBalanceBg);
  } else {
    const bg =
      rowIndex % 2 === 0
        ? BUDGET_PDF_COLORS.rowEvenBg
        : BUDGET_PDF_COLORS.rowOddBg;
    doc.setFillColor(...bg);
  }
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "F");

  // Divisória inferior suave
  doc.setDrawColor(
    ...(row.kind === "FINAL_TOTAL"
      ? BUDGET_PDF_COLORS.brandBlue
      : BUDGET_PDF_COLORS.dividerLine)
  );
  doc.setLineWidth(row.kind === "FINAL_TOTAL" ? 0.4 : 0.2);
  doc.line(MARGIN_X, y + height, MARGIN_X + CONTENT_WIDTH, y + height);

  if (row.kind !== "RESOURCE") {
    const baselineY = y + height / 2 + 1.1;
    doc.setFont("helvetica", row.kind === "FINAL_TOTAL" ? "bold" : "normal");
    doc.setFontSize(row.kind === "FINAL_TOTAL" ? 8 : 7.5);
    doc.setTextColor(...BUDGET_PDF_COLORS.textPrimary);

    doc.text(row.resourcePrimary, COL_X.resource, baselineY, {
      align: "left",
    });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BUDGET_PDF_COLORS.positiveValue);
    doc.text(row.plannedFormatted, COL_X.plannedRight, baselineY, {
      align: "right",
    });
    return;
  }

  const firstBaselineY = y + 4.1;

  // Código do recurso
  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BUDGET_PDF_COLORS.brandNavy);
  codeLines.forEach((line, idx) => {
    doc.text(line, COL_X.code, firstBaselineY + idx * 3.2, { align: "left" });
  });

  // Mês planejado
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(...BUDGET_PDF_COLORS.textPrimary);
  doc.text(row.monthLabel, COL_X.month, firstBaselineY, { align: "left" });

  // Estratégia de aquisição (fonte preta para alta legibilidade)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...BUDGET_PDF_COLORS.textPrimary);
  strategyLines.forEach((line, idx) => {
    doc.text(line, COL_X.strategy, firstBaselineY + idx * 3.2, {
      align: "left",
    });
  });

  // Recurso (Título em preto e subtítulo em azul Gênesis)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(...BUDGET_PDF_COLORS.textPrimary);
  primaryLines.forEach((line, idx) => {
    doc.text(line, COL_X.resource, firstBaselineY + idx * 3.5, {
      align: "left",
    });
  });

  if (secondaryLines.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...BUDGET_PDF_COLORS.brandBlue);
    const secStartY = firstBaselineY + primaryLines.length * 3.5;
    secondaryLines.forEach((line, idx) => {
      doc.text(line, COL_X.resource, secStartY + idx * 3.1, { align: "left" });
    });
  }

  // Valor Orçado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BUDGET_PDF_COLORS.positiveValue);
  doc.text(row.plannedFormatted, COL_X.plannedRight, firstBaselineY, {
    align: "right",
  });
}

function drawPageFooter(
  doc: jsPDF,
  pageNumber: number,
  pageCount: number,
  teamName: string,
  formattedDate: string
): void {
  const lineY = PAGE_HEIGHT - 11;
  const textY = PAGE_HEIGHT - 7;

  doc.setDrawColor(...BUDGET_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_X, lineY, MARGIN_X + CONTENT_WIDTH, lineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...BUDGET_PDF_COLORS.brandNavy);
  doc.text(
    `${teamName} • Planejamento Orçamentário • Emitido em ${formattedDate}`,
    MARGIN_X,
    textY,
    { align: "left" }
  );
  doc.text(
    `Página ${pageNumber} de ${pageCount}`,
    MARGIN_X + CONTENT_WIDTH,
    textY,
    { align: "right" }
  );
}

/**
 * Gera e dispara o download do Relatório de Planejamento Orçamentário em PDF (A4 Retrato),
 * exibindo exclusivamente os valores orçados com alto contraste (preto e azul Gênesis).
 */
export async function exportBudgetPlanningToPdf({
  resources,
  teamName,
  seasonLabel,
  monthLabels,
}: ExportBudgetPlanningPdfParams): Promise<{
  filename: string;
  pageCount: number;
}> {
  if (resources.length === 0) {
    throw new Error("Não há orçamentos planejados para exportar.");
  }

  const data = buildBudgetPlanningData({
    resources,
    teamName,
    seasonLabel,
    monthLabels,
  });
  const { jsPDF: JsPdfCtor } = await import("jspdf");

  const doc = new JsPdfCtor({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const now = new Date();
  const formattedDate = now.toLocaleDateString("pt-BR");

  let cursorY = drawPageHeader(doc, data);
  let visualIndex = 0;

  for (const row of data.rows) {
    const measured = measureRow(doc, row);

    if (cursorY + measured.height > CONTENT_BOTTOM) {
      doc.addPage("a4", "portrait");
      cursorY = drawPageHeader(doc, data);
      visualIndex = 0;
    }

    drawRow(doc, row, cursorY, visualIndex, measured);
    cursorY += measured.height;
    if (row.kind === "RESOURCE") {
      visualIndex += 1;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawPageFooter(doc, page, pageCount, data.teamDisplayName, formattedDate);
  }

  const filename = buildBudgetPlanningFilename(data.teamDisplayName, now);
  doc.save(filename);

  return { filename, pageCount };
}
