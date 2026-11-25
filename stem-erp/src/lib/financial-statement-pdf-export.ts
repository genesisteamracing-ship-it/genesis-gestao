import type { jsPDF } from "jspdf";
import type { TransactionDTO } from "@/types/financial";
import {
  buildFinancialStatementData,
  buildFinancialStatementFilename,
  formatCurrencyBRL,
  STATEMENT_PDF_COLORS,
  type FinancialStatementData,
  type FinancialStatementRow,
} from "./financial-statement-pdf-layout";

export interface ExportFinancialStatementPdfParams {
  transactions: TransactionDTO[];
  teamName?: string;
}

const PAGE_WIDTH = 210; // A4 Retrato (mm)
const PAGE_HEIGHT = 297;
const MARGIN_X = 12;
const MARGIN_TOP = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 186mm
const CONTENT_BOTTOM = PAGE_HEIGHT - 16; // 281mm

const COL_X = {
  date: MARGIN_X + 1.5,
  method: MARGIN_X + 22,
  nfe: MARGIN_X + 46,
  history: MARGIN_X + 86,
  valueRight: MARGIN_X + CONTENT_WIDTH - 1.5,
} as const;

const COL_WIDTH = {
  nfe: 37,
  history: 68,
} as const;

/**
 * Desenha o cabeçalho bicolor Azul + Amarelo com corte diagonal no topo,
 * com o nome e identidade da Equipe Gênesis, seguido de metadados e barra "Lançamentos".
 * Retorna a coordenada Y inicial onde as linhas de dados começam.
 */
function drawPageHeader(doc: jsPDF, data: FinancialStatementData): number {
  const bannerY = MARGIN_TOP;
  const bannerH = 16.5;
  const splitTopX = MARGIN_X + CONTENT_WIDTH * 0.72;
  const splitBottomX = splitTopX - 8.5;

  // Bloco direito (Amarelo Ouro Gênesis)
  doc.setFillColor(...STATEMENT_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, bannerY, CONTENT_WIDTH, bannerH, "F");

  // Polígono esquerdo (Azul Gênesis com corte diagonal elegante)
  doc.setFillColor(...STATEMENT_PDF_COLORS.brandBlue);
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
  doc.setTextColor(...STATEMENT_PDF_COLORS.brandYellow);
  doc.text("Extrato Financeiro", MARGIN_X + 3.5, bannerY + 7.2, { align: "left" });

  // Nome da Equipe em Branco sobre o Azul (esquerda)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...STATEMENT_PDF_COLORS.white);
  doc.text(
    `Equipe: ${data.teamDisplayName.toUpperCase()}`,
    MARGIN_X + 3.5,
    bannerY + 13.4,
    { align: "left" }
  );

  // Emblema geométrico + marca "GÊNESIS" sobre o Amarelo (direita)
  const yellowCenterX = splitTopX + (MARGIN_X + CONTENT_WIDTH - splitTopX) / 2 + 1;
  doc.setFillColor(...STATEMENT_PDF_COLORS.brandNavy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...STATEMENT_PDF_COLORS.brandNavy);
  doc.text("GÊNESIS", yellowCenterX, bannerY + 8.6, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("GESTÃO FINANCEIRA", yellowCenterX, bannerY + 13, { align: "center" });

  // Linha de metadados (Período, Entradas, Saídas, Total de lançamentos)
  const metaY = bannerY + bannerH + 4.8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(...STATEMENT_PDF_COLORS.textPrimary);

  doc.setFont("helvetica", "bold");
  doc.text("Período:", MARGIN_X, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(data.periodLabel, MARGIN_X + 13.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Entradas:", MARGIN_X + 66, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(formatCurrencyBRL(data.totalEntriesCents), MARGIN_X + 81, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Saídas:", MARGIN_X + 114, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(formatCurrencyBRL(data.totalExitsCents), MARGIN_X + 126, metaY);

  doc.setFont("helvetica", "bold");
  doc.text(
    `${data.transactionCount} ${data.transactionCount === 1 ? "lançamento" : "lançamentos"}`,
    MARGIN_X + CONTENT_WIDTH,
    metaY,
    { align: "right" }
  );

  // Barra da seção "Lançamentos"
  const sectionY = metaY + 3.2;
  const sectionH = 6.2;
  doc.setFillColor(...STATEMENT_PDF_COLORS.sectionBarBg);
  doc.rect(MARGIN_X, sectionY, CONTENT_WIDTH, sectionH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...STATEMENT_PDF_COLORS.brandBlue);
  doc.text("Lançamentos", MARGIN_X + 2, sectionY + 4.4, { align: "left" });

  // Cabeçalho das colunas
  const colHeaderY = sectionY + sectionH + 4.4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...STATEMENT_PDF_COLORS.textPrimary);

  doc.text("Dia", COL_X.date, colHeaderY, { align: "left" });
  doc.text("Comprovante", COL_X.method, colHeaderY, { align: "left" });
  doc.text("Código NF-e", COL_X.nfe, colHeaderY, { align: "left" });
  doc.text("Histórico", COL_X.history, colHeaderY, { align: "left" });
  doc.text("Valor", COL_X.valueRight, colHeaderY, { align: "right" });

  // Linha divisória abaixo do cabeçalho das colunas
  const headerBottomY = colHeaderY + 1.8;
  doc.setDrawColor(...STATEMENT_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, headerBottomY, MARGIN_X + CONTENT_WIDTH, headerBottomY);

  return headerBottomY;
}

function measureRow(
  doc: jsPDF,
  row: FinancialStatementRow
): {
  height: number;
  nfeLines: string[];
  primaryLines: string[];
  secondaryLines: string[];
} {
  if (row.kind !== "TRANSACTION") {
    return {
      height: row.kind === "FINAL_BALANCE" ? 7.6 : 6.4,
      nfeLines: [],
      primaryLines: [row.historyPrimary],
      secondaryLines: [],
    };
  }

  doc.setFont("courier", "normal");
  doc.setFontSize(6.9);
  const nfeLines = doc.splitTextToSize(row.nfeCode, COL_WIDTH.nfe) as string[];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  const primaryLines = doc.splitTextToSize(
    row.historyPrimary,
    COL_WIDTH.history
  ) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  const secondaryLines = row.historySecondary
    ? (doc.splitTextToSize(row.historySecondary, COL_WIDTH.history) as string[])
    : [];

  const historyHeight = primaryLines.length * 3.5 + secondaryLines.length * 3.1;
  const nfeHeight = nfeLines.length * 3.2;
  const height = Math.max(8.4, Math.max(historyHeight, nfeHeight) + 2.8);

  return { height, nfeLines, primaryLines, secondaryLines };
}

function drawRow(
  doc: jsPDF,
  row: FinancialStatementRow,
  y: number,
  rowIndex: number,
  measured: ReturnType<typeof measureRow>
): void {
  const { height, nfeLines, primaryLines, secondaryLines } = measured;

  // Fundo da linha
  if (row.kind === "FINAL_BALANCE") {
    doc.setFillColor(...STATEMENT_PDF_COLORS.finalBalanceBg);
  } else if (row.kind === "DAILY_BALANCE") {
    doc.setFillColor(...STATEMENT_PDF_COLORS.dailyBalanceBg);
  } else {
    const bg =
      rowIndex % 2 === 0
        ? STATEMENT_PDF_COLORS.rowEvenBg
        : STATEMENT_PDF_COLORS.rowOddBg;
    doc.setFillColor(...bg);
  }
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "F");

  // Divisória inferior suave
  doc.setDrawColor(
    ...(row.kind === "FINAL_BALANCE"
      ? STATEMENT_PDF_COLORS.brandBlue
      : STATEMENT_PDF_COLORS.dividerLine)
  );
  doc.setLineWidth(row.kind === "FINAL_BALANCE" ? 0.4 : 0.2);
  doc.line(MARGIN_X, y + height, MARGIN_X + CONTENT_WIDTH, y + height);

  if (row.kind !== "TRANSACTION") {
    const baselineY = y + height / 2 + 1.1;
    doc.setFont("helvetica", row.kind === "FINAL_BALANCE" ? "bold" : "normal");
    doc.setFontSize(row.kind === "FINAL_BALANCE" ? 8 : 7.5);
    doc.setTextColor(...STATEMENT_PDF_COLORS.textPrimary);

    doc.text(row.dateLabel, COL_X.date, baselineY, { align: "left" });
    doc.text(row.historyPrimary, COL_X.history, baselineY, { align: "left" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      ...(row.isNegative
        ? STATEMENT_PDF_COLORS.negativeValue
        : STATEMENT_PDF_COLORS.positiveValue)
    );
    doc.text(row.amountFormatted, COL_X.valueRight, baselineY, { align: "right" });
    return;
  }

  const firstBaselineY = y + 4.1;

  // Dia
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...STATEMENT_PDF_COLORS.textPrimary);
  doc.text(row.dateLabel, COL_X.date, firstBaselineY, { align: "left" });

  // Método Comprobatório
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.3);
  doc.setTextColor(...STATEMENT_PDF_COLORS.textSecondary);
  doc.text(row.methodLabel, COL_X.method, firstBaselineY, { align: "left" });

  // Código da NF-e
  doc.setFont("courier", row.nfeCode === "—" ? "normal" : "bold");
  doc.setFontSize(6.9);
  doc.setTextColor(
    ...(row.nfeCode === "—"
      ? STATEMENT_PDF_COLORS.textSecondary
      : STATEMENT_PDF_COLORS.brandNavy)
  );
  nfeLines.forEach((line, idx) => {
    doc.text(line, COL_X.nfe, firstBaselineY + idx * 3.2, { align: "left" });
  });

  // Histórico (Descrição + Setor/Categoria)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(...STATEMENT_PDF_COLORS.textPrimary);
  primaryLines.forEach((line, idx) => {
    doc.text(line, COL_X.history, firstBaselineY + idx * 3.5, { align: "left" });
  });

  if (secondaryLines.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...STATEMENT_PDF_COLORS.textSecondary);
    const secStartY = firstBaselineY + primaryLines.length * 3.5;
    secondaryLines.forEach((line, idx) => {
      doc.text(line, COL_X.history, secStartY + idx * 3.1, { align: "left" });
    });
  }

  // Valor alinhado à direita com (+) ou (-)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(
    ...(row.isNegative
      ? STATEMENT_PDF_COLORS.negativeValue
      : STATEMENT_PDF_COLORS.positiveValue)
  );
  doc.text(row.amountFormatted, COL_X.valueRight, firstBaselineY, { align: "right" });
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

  doc.setDrawColor(...STATEMENT_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_X, lineY, MARGIN_X + CONTENT_WIDTH, lineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...STATEMENT_PDF_COLORS.textSecondary);
  doc.text(
    `${teamName} • Extrato Financeiro • Emitido em ${formattedDate}`,
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
 * Gera e dispara o download do Extrato Financeiro em PDF (A4 Retrato),
 * com identidade visual Azul e Amarelo da Equipe Gênesis, coluna de Código NF-e,
 * saldo diário e saldo consolidado.
 */
export async function exportFinancialStatementToPdf({
  transactions,
  teamName,
}: ExportFinancialStatementPdfParams): Promise<{
  filename: string;
  pageCount: number;
}> {
  if (transactions.length === 0) {
    throw new Error("Não há lançamentos financeiros para exportar.");
  }

  const data = buildFinancialStatementData({ transactions, teamName });
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
    if (row.kind === "TRANSACTION") {
      visualIndex += 1;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawPageFooter(doc, page, pageCount, data.teamDisplayName, formattedDate);
  }

  const filename = buildFinancialStatementFilename(data.teamDisplayName, now);
  doc.save(filename);

  return { filename, pageCount };
}
