import type { jsPDF } from "jspdf";
import type { RiskItemDTO } from "@/types/risks";
import {
  buildRisksPdfData,
  buildRisksPdfFilename,
  RISK_PDF_BADGE_STYLES,
  RISKS_PDF_COLORS,
  type RiskBadgeTone,
  type RiskPdfRow,
  type RisksPdfData,
} from "./risks-pdf-layout";

export interface ExportRisksPdfParams {
  items: RiskItemDTO[];
  teamName?: string;
  seasonLabel?: string;
}

const PAGE_WIDTH = 297; // A4 Paisagem (mm) — ideal para tabela de 6 colunas
const PAGE_HEIGHT = 210;
const MARGIN_X = 12;
const MARGIN_TOP = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 273mm
const CONTENT_BOTTOM = PAGE_HEIGHT - 16; // 194mm

interface TableColumnSpec {
  key:
    | "sector"
    | "probability"
    | "consequence"
    | "name"
    | "priority"
    | "observations";
  label: string;
  x: number;
  width: number;
  align: "left" | "center";
}

const TABLE_COLUMNS: readonly TableColumnSpec[] = [
  { key: "sector", label: "SETOR", x: MARGIN_X, width: 28, align: "left" },
  {
    key: "probability",
    label: "PROBABILIDADE",
    x: MARGIN_X + 28,
    width: 34,
    align: "center",
  },
  {
    key: "consequence",
    label: "CONSEQUÊNCIA",
    x: MARGIN_X + 62,
    width: 34,
    align: "center",
  },
  { key: "name", label: "NOME", x: MARGIN_X + 96, width: 76, align: "left" },
  {
    key: "priority",
    label: "RISCO",
    x: MARGIN_X + 172,
    width: 26,
    align: "center",
  },
  {
    key: "observations",
    label: "OBSERVAÇÕES",
    x: MARGIN_X + 198,
    width: 75,
    align: "left",
  },
] as const;

const COL_BY_KEY = Object.fromEntries(
  TABLE_COLUMNS.map((col) => [col.key, col])
) as Record<TableColumnSpec["key"], TableColumnSpec>;

/**
 * Desenha o cabeçalho bicolor Azul + Amarelo (padrão Gênesis),
 * barra de metadados e o cabeçalho azul da tabela com grade completa.
 */
function drawPageHeader(doc: jsPDF, data: RisksPdfData): number {
  const bannerY = MARGIN_TOP;
  const bannerH = 15.5;
  const splitTopX = MARGIN_X + CONTENT_WIDTH * 0.78;
  const splitBottomX = splitTopX - 9;

  // Bloco direito (Amarelo Ouro Gênesis)
  doc.setFillColor(...RISKS_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, bannerY, CONTENT_WIDTH, bannerH, "F");

  // Polígono esquerdo (Azul Gênesis com corte diagonal)
  doc.setFillColor(...RISKS_PDF_COLORS.brandBlue);
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
  doc.setTextColor(...RISKS_PDF_COLORS.brandYellow);
  doc.text("Matriz de Riscos & Oportunidades", MARGIN_X + 4, bannerY + 6.8, {
    align: "left",
  });

  // Nome da Equipe em Branco sobre o Azul (esquerda)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...RISKS_PDF_COLORS.white);
  doc.text(
    `Equipe: ${data.teamDisplayName.toUpperCase()}`,
    MARGIN_X + 4,
    bannerY + 12.6,
    { align: "left" }
  );

  // Marca "GÊNESIS" sobre o Amarelo (direita)
  const yellowCenterX =
    splitTopX + (MARGIN_X + CONTENT_WIDTH - splitTopX) / 2 + 1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...RISKS_PDF_COLORS.brandNavy);
  doc.text("GÊNESIS", yellowCenterX, bannerY + 8.1, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("GESTÃO DE RISCOS", yellowCenterX, bannerY + 12.4, {
    align: "center",
  });

  // Linha de metadados (Temporada e contadores por severidade)
  const metaY = bannerY + bannerH + 4.8;
  doc.setFontSize(7.8);
  doc.setTextColor(...RISKS_PDF_COLORS.textPrimary);

  doc.setFont("helvetica", "bold");
  doc.text("Temporada:", MARGIN_X, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(data.seasonLabel, MARGIN_X + 18, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Críticos:", MARGIN_X + 68, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.criticalCount), MARGIN_X + 81.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Altos:", MARGIN_X + 98, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.highCount), MARGIN_X + 108, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Médios:", MARGIN_X + 124, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.mediumCount), MARGIN_X + 137, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Baixos:", MARGIN_X + 154, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.lowCount), MARGIN_X + 166.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.text(
    `${data.totalCount} ${data.totalCount === 1 ? "registro" : "registros"}`,
    MARGIN_X + CONTENT_WIDTH,
    metaY,
    { align: "right" }
  );

  // Cabeçalho da Tabela (Azul Marinho/Gênesis com bordas verticais e filete Amarelo)
  const headerY = metaY + 3.2;
  const headerH = 8.4;

  doc.setFillColor(...RISKS_PDF_COLORS.brandBlue);
  doc.rect(MARGIN_X, headerY, CONTENT_WIDTH, headerH, "F");

  // Filete amarelo inferior no cabeçalho da tabela
  const accentH = 1.0;
  doc.setFillColor(...RISKS_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, headerY + headerH, CONTENT_WIDTH, accentH, "F");

  // Divisórias verticais suaves no cabeçalho
  doc.setDrawColor(...RISKS_PDF_COLORS.brandNavy);
  doc.setLineWidth(0.25);
  for (let i = 1; i < TABLE_COLUMNS.length; i += 1) {
    const x = TABLE_COLUMNS[i].x;
    doc.line(x, headerY, x, headerY + headerH);
  }

  // Borda externa do cabeçalho
  doc.rect(MARGIN_X, headerY, CONTENT_WIDTH, headerH + accentH, "S");

  // Rótulos das colunas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(...RISKS_PDF_COLORS.white);
  const labelY = headerY + headerH / 2 + 1.1;

  for (const col of TABLE_COLUMNS) {
    if (col.align === "center") {
      doc.text(col.label, col.x + col.width / 2, labelY, { align: "center" });
    } else {
      doc.text(col.label, col.x + 2.5, labelY, { align: "left" });
    }
  }

  return headerY + headerH + accentH;
}

function measureRow(
  doc: jsPDF,
  row: RiskPdfRow
): {
  height: number;
  titleLines: string[];
  subtitleLines: string[];
  observationLines: string[];
} {
  const nameTextWidth = COL_BY_KEY.name.width - 5;
  const obsTextWidth = COL_BY_KEY.observations.width - 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  const titleLines = doc.splitTextToSize(row.title, nameTextWidth) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  const subtitleLines = doc.splitTextToSize(
    row.subtitle,
    nameTextWidth
  ) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  const observationLines = doc.splitTextToSize(
    row.observations,
    obsTextWidth
  ) as string[];

  const nameHeight = titleLines.length * 3.5 + subtitleLines.length * 3.1;
  const obsHeight = observationLines.length * 3.3;
  const height = Math.max(9.6, Math.max(nameHeight, obsHeight) + 3.4);

  return { height, titleLines, subtitleLines, observationLines };
}

function drawBadgePill(
  doc: jsPDF,
  text: string,
  tone: RiskBadgeTone,
  centerX: number,
  centerY: number,
  maxWidth: number
): void {
  const style = RISK_PDF_BADGE_STYLES[tone];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.9);

  const textWidth = doc.getTextWidth(text);
  const pillW = Math.min(maxWidth - 4, Math.max(15, textWidth + 5.5));
  const pillH = 5.0;
  const pillX = centerX - pillW / 2;
  const pillY = centerY - pillH / 2;

  doc.setFillColor(...style.fill);
  doc.setDrawColor(...style.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(pillX, pillY, pillW, pillH, 1.3, 1.3, "FD");

  doc.setTextColor(...style.text);
  doc.text(text, centerX, centerY + 0.9, { align: "center" });
}

function drawRow(
  doc: jsPDF,
  row: RiskPdfRow,
  y: number,
  rowIndex: number,
  measured: ReturnType<typeof measureRow>
): void {
  const { height, titleLines, subtitleLines, observationLines } = measured;

  // Fundo zebrado
  const bg =
    rowIndex % 2 === 0
      ? RISKS_PDF_COLORS.rowEvenBg
      : RISKS_PDF_COLORS.rowOddBg;
  doc.setFillColor(...bg);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "F");

  // Grade completa: bordas verticais internas + bordas externas + divisória inferior
  doc.setDrawColor(...RISKS_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "S");
  for (let i = 1; i < TABLE_COLUMNS.length; i += 1) {
    const x = TABLE_COLUMNS[i].x;
    doc.line(x, y, x, y + height);
  }

  const centerY = y + height / 2;

  // 1. Setor
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...RISKS_PDF_COLORS.textPrimary);
  doc.text(row.sectorLabel, COL_BY_KEY.sector.x + 2.5, centerY + 1.0, {
    align: "left",
  });

  // 2. Probabilidade (pill centralizada)
  drawBadgePill(
    doc,
    row.probabilityLabel,
    row.probabilityTone,
    COL_BY_KEY.probability.x + COL_BY_KEY.probability.width / 2,
    centerY,
    COL_BY_KEY.probability.width
  );

  // 3. Consequência (pill centralizada)
  drawBadgePill(
    doc,
    row.consequenceLabel,
    row.consequenceTone,
    COL_BY_KEY.consequence.x + COL_BY_KEY.consequence.width / 2,
    centerY,
    COL_BY_KEY.consequence.width
  );

  // 4. Nome + subtítulo (Tipo · Status)
  const nameBlockH = titleLines.length * 3.5 + subtitleLines.length * 3.1;
  const nameStartY = y + (height - nameBlockH) / 2 + 2.6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(...RISKS_PDF_COLORS.textPrimary);
  titleLines.forEach((line, idx) => {
    doc.text(line, COL_BY_KEY.name.x + 2.5, nameStartY + idx * 3.5, {
      align: "left",
    });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  doc.setTextColor(...RISKS_PDF_COLORS.brandBlue);
  const subStartY = nameStartY + titleLines.length * 3.5;
  subtitleLines.forEach((line, idx) => {
    doc.text(line, COL_BY_KEY.name.x + 2.5, subStartY + idx * 3.1, {
      align: "left",
    });
  });

  // 5. Risco / Prioridade (pill centralizada)
  drawBadgePill(
    doc,
    row.priorityLabel,
    row.priorityTone,
    COL_BY_KEY.priority.x + COL_BY_KEY.priority.width / 2,
    centerY,
    COL_BY_KEY.priority.width
  );

  // 6. Observações
  const obsBlockH = observationLines.length * 3.3;
  const obsStartY = y + (height - obsBlockH) / 2 + 2.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...RISKS_PDF_COLORS.textPrimary);
  observationLines.forEach((line, idx) => {
    doc.text(line, COL_BY_KEY.observations.x + 2.5, obsStartY + idx * 3.3, {
      align: "left",
    });
  });
}

function drawSummaryRow(doc: jsPDF, data: RisksPdfData, y: number): number {
  const height = 7.6;

  doc.setFillColor(...RISKS_PDF_COLORS.finalBalanceBg);
  doc.setDrawColor(...RISKS_PDF_COLORS.brandBlue);
  doc.setLineWidth(0.35);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "FD");

  const baselineY = y + height / 2 + 1.1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...RISKS_PDF_COLORS.brandNavy);
  doc.text("T O T A L   D E   R E G I S T R O S", MARGIN_X + 2.5, baselineY, {
    align: "left",
  });

  doc.text(
    `${data.totalCount} ${
      data.totalCount === 1 ? "registro" : "registros"
    }  •  Críticos: ${data.criticalCount}  •  Altos: ${data.highCount}  •  Médios: ${data.mediumCount}  •  Baixos: ${data.lowCount}`,
    MARGIN_X + CONTENT_WIDTH - 2.5,
    baselineY,
    { align: "right" }
  );

  return y + height;
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

  doc.setDrawColor(...RISKS_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_X, lineY, MARGIN_X + CONTENT_WIDTH, lineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...RISKS_PDF_COLORS.brandNavy);
  doc.text(
    `${teamName} • Matriz de Riscos & Oportunidades • Emitido em ${formattedDate}`,
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
 * Gera e dispara o download da Matriz de Riscos & Oportunidades em PDF (A4 Paisagem),
 * em formato tabular com grade completa e identidade visual Azul e Amarelo da Equipe Gênesis.
 */
export async function exportRisksToPdf({
  items,
  teamName,
  seasonLabel,
}: ExportRisksPdfParams): Promise<{
  filename: string;
  pageCount: number;
}> {
  if (items.length === 0) {
    throw new Error("Não há riscos cadastrados para exportar.");
  }

  const data = buildRisksPdfData({ items, teamName, seasonLabel });
  const { jsPDF: JsPdfCtor } = await import("jspdf");

  const doc = new JsPdfCtor({
    orientation: "landscape",
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
      doc.addPage("a4", "landscape");
      cursorY = drawPageHeader(doc, data);
      visualIndex = 0;
    }

    drawRow(doc, row, cursorY, visualIndex, measured);
    cursorY += measured.height;
    visualIndex += 1;
  }

  // Linha de resumo consolidado no rodapé da tabela
  if (cursorY + 8 > CONTENT_BOTTOM) {
    doc.addPage("a4", "landscape");
    cursorY = drawPageHeader(doc, data);
  }
  drawSummaryRow(doc, data, cursorY);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawPageFooter(doc, page, pageCount, data.teamDisplayName, formattedDate);
  }

  const filename = buildRisksPdfFilename(data.teamDisplayName, now);
  doc.save(filename);

  return { filename, pageCount };
}
