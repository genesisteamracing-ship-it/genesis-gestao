import type { jsPDF } from "jspdf";
import type {
  StakeholderGroup,
  StakeholderWithRelations,
} from "@/types/communication";
import {
  buildCommunicationMatrixPdfData,
  buildCommunicationMatrixPdfFilename,
  COMMUNICATION_MATRIX_BADGE_STYLES,
  COMMUNICATION_MATRIX_PDF_COLORS,
  type CommunicationMatrixBadgeTone,
  type CommunicationMatrixPdfData,
  type CommunicationMatrixPdfRow,
} from "./communication-matrix-pdf-layout";

export interface ExportCommunicationMatrixPdfParams {
  stakeholders: StakeholderWithRelations[];
  teamName?: string;
  groupFilter?: StakeholderGroup | "ALL";
}

const PAGE_WIDTH = 297; // A4 Paisagem (mm)
const PAGE_HEIGHT = 210;
const MARGIN_X = 12;
const MARGIN_TOP = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 273mm
const CONTENT_BOTTOM = PAGE_HEIGHT - 16; // 194mm

interface TableColumnSpec {
  key:
    | "stakeholder"
    | "group"
    | "strategy"
    | "channel"
    | "frequency"
    | "engagement"
    | "content";
  label: string;
  x: number;
  width: number;
  align: "left" | "center";
}

const TABLE_COLUMNS: readonly TableColumnSpec[] = [
  {
    key: "stakeholder",
    label: "STAKEHOLDER / PÚBLICO",
    x: MARGIN_X,
    width: 52,
    align: "left",
  },
  {
    key: "group",
    label: "GRUPO",
    x: MARGIN_X + 52,
    width: 32,
    align: "left",
  },
  {
    key: "strategy",
    label: "ESTRATÉGIA",
    x: MARGIN_X + 84,
    width: 38,
    align: "center",
  },
  {
    key: "channel",
    label: "CANAL",
    x: MARGIN_X + 122,
    width: 31,
    align: "center",
  },
  {
    key: "frequency",
    label: "FREQUÊNCIA",
    x: MARGIN_X + 153,
    width: 26,
    align: "center",
  },
  {
    key: "engagement",
    label: "ENGAJAMENTO",
    x: MARGIN_X + 179,
    width: 32,
    align: "center",
  },
  {
    key: "content",
    label: "CONTEÚDO / ABORDAGEM",
    x: MARGIN_X + 211,
    width: 62,
    align: "left",
  },
] as const;

const COL_BY_KEY = Object.fromEntries(
  TABLE_COLUMNS.map((col) => [col.key, col]),
) as Record<TableColumnSpec["key"], TableColumnSpec>;

interface MeasuredMatrixRow {
  height: number;
  nameLines: string[];
  subtitleLines: string[];
  groupLines: string[];
  contentLines: string[];
  responsibleLines: string[];
}

/**
 * Desenha o cabeçalho bicolor Azul + Amarelo (padrão Gênesis),
 * barra de metadados por quadrante e cabeçalho azul da tabela com grade.
 */
function drawPageHeader(doc: jsPDF, data: CommunicationMatrixPdfData): number {
  const bannerY = MARGIN_TOP;
  const bannerH = 15.5;
  const splitTopX = MARGIN_X + CONTENT_WIDTH * 0.78;
  const splitBottomX = splitTopX - 9;

  // Bloco direito (Amarelo Ouro Gênesis)
  doc.setFillColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, bannerY, CONTENT_WIDTH, bannerH, "F");

  // Polígono esquerdo (Azul Gênesis com corte diagonal)
  doc.setFillColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandBlue);
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
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandYellow);
  doc.text("Matriz de Comunicação", MARGIN_X + 4, bannerY + 6.8, {
    align: "left",
  });

  // Equipe e Filtro em Branco sobre o Azul (esquerda)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.4);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.white);
  doc.text(
    `Equipe: ${data.teamDisplayName.toUpperCase()}  •  Filtro: ${data.filterLabel}`,
    MARGIN_X + 4,
    bannerY + 12.6,
    { align: "left" },
  );

  // Marca "GÊNESIS" sobre o Amarelo (direita)
  const yellowCenterX =
    splitTopX + (MARGIN_X + CONTENT_WIDTH - splitTopX) / 2 + 1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandNavy);
  doc.text("GÊNESIS", yellowCenterX, bannerY + 8.1, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("COMUNICAÇÃO", yellowCenterX, bannerY + 12.4, {
    align: "center",
  });

  // Linha de metadados com contadores estratégicos
  const metaY = bannerY + bannerH + 4.8;
  doc.setFontSize(7.6);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.textPrimary);

  doc.setFont("helvetica", "bold");
  doc.text("Gerenciar de perto:", MARGIN_X, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.quadrantCounts.MANAGE_CLOSELY), MARGIN_X + 27.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Manter satisfeito:", MARGIN_X + 43, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.quadrantCounts.KEEP_SATISFIED), MARGIN_X + 68.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Manter informado:", MARGIN_X + 84, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.quadrantCounts.KEEP_INFORMED), MARGIN_X + 110.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Monitorar:", MARGIN_X + 126, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.quadrantCounts.MONITOR), MARGIN_X + 141.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandNavy);
  doc.text(
    `${data.totalStakeholders} ${
      data.totalStakeholders === 1 ? "stakeholder" : "stakeholders"
    }  •  ${data.totalRows} ${data.totalRows === 1 ? "registro" : "registros"}`,
    MARGIN_X + CONTENT_WIDTH,
    metaY,
    { align: "right" },
  );

  // Cabeçalho azul da tabela com filete amarelo inferior
  const headerY = metaY + 3.2;
  const headerH = 8.4;

  doc.setFillColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandBlue);
  doc.rect(MARGIN_X, headerY, CONTENT_WIDTH, headerH, "F");

  const accentH = 1.0;
  doc.setFillColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, headerY + headerH, CONTENT_WIDTH, accentH, "F");

  doc.setDrawColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandNavy);
  doc.setLineWidth(0.25);
  for (let i = 1; i < TABLE_COLUMNS.length; i += 1) {
    const x = TABLE_COLUMNS[i].x;
    doc.line(x, headerY, x, headerY + headerH);
  }
  doc.rect(MARGIN_X, headerY, CONTENT_WIDTH, headerH + accentH, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.white);
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

function measureRow(doc: jsPDF, row: CommunicationMatrixPdfRow): MeasuredMatrixRow {
  const stakeholderTextW = COL_BY_KEY.stakeholder.width - 5;
  const groupTextW = COL_BY_KEY.group.width - 4.5;
  const contentTextW = COL_BY_KEY.content.width - 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  const nameLines = doc.splitTextToSize(
    row.stakeholderName,
    stakeholderTextW,
  ) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  const subtitleLines = doc.splitTextToSize(
    row.stakeholderSubtitle,
    stakeholderTextW,
  ) as string[];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.1);
  const groupLines = doc.splitTextToSize(row.groupLabel, groupTextW) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.0);
  const contentLines = doc.splitTextToSize(
    row.contentApproach,
    contentTextW,
  ) as string[];

  let responsibleLines: string[] = [];
  if (row.responsibleLabel) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.4);
    responsibleLines = doc.splitTextToSize(
      `Resp.: ${row.responsibleLabel}`,
      contentTextW,
    ) as string[];
  }

  const nameBlockH = nameLines.length * 3.4 + subtitleLines.length * 3.0;
  const groupBlockH = groupLines.length * 3.3;
  const contentBlockH =
    contentLines.length * 3.2 +
    (responsibleLines.length > 0 ? responsibleLines.length * 3.0 + 0.8 : 0);
  const strategyMinH = 10.6;

  const height = Math.max(
    12.2,
    strategyMinH,
    nameBlockH + 3.4,
    groupBlockH + 3.4,
    contentBlockH + 3.4,
  );

  return {
    height,
    nameLines,
    subtitleLines,
    groupLines,
    contentLines,
    responsibleLines,
  };
}

function drawBadgePill(
  doc: jsPDF,
  text: string,
  tone: CommunicationMatrixBadgeTone,
  centerX: number,
  centerY: number,
  maxWidth: number,
): void {
  const style = COMMUNICATION_MATRIX_BADGE_STYLES[tone];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.6);

  const textWidth = doc.getTextWidth(text);
  const pillW = Math.min(maxWidth - 3.6, Math.max(16, textWidth + 5.0));
  const pillH = 4.9;
  const pillX = centerX - pillW / 2;
  const pillY = centerY - pillH / 2;

  doc.setFillColor(...style.fill);
  doc.setDrawColor(...style.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(pillX, pillY, pillW, pillH, 1.3, 1.3, "FD");

  doc.setTextColor(...style.text);
  doc.text(text, centerX, centerY + 0.85, { align: "center" });
}

function drawRow(
  doc: jsPDF,
  row: CommunicationMatrixPdfRow,
  y: number,
  rowIndex: number,
  measured: MeasuredMatrixRow,
): void {
  const {
    height,
    nameLines,
    subtitleLines,
    groupLines,
    contentLines,
    responsibleLines,
  } = measured;

  // Fundo zebrado
  const bg =
    rowIndex % 2 === 0
      ? COMMUNICATION_MATRIX_PDF_COLORS.rowEvenBg
      : COMMUNICATION_MATRIX_PDF_COLORS.rowOddBg;
  doc.setFillColor(...bg);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "F");

  // Grade completa
  doc.setDrawColor(...COMMUNICATION_MATRIX_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "S");
  for (let i = 1; i < TABLE_COLUMNS.length; i += 1) {
    const x = TABLE_COLUMNS[i].x;
    doc.line(x, y, x, y + height);
  }

  const centerY = y + height / 2;

  // 1. Stakeholder / Público
  const nameBlockH = nameLines.length * 3.4 + subtitleLines.length * 3.0;
  const nameStartY = y + (height - nameBlockH) / 2 + 2.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.textPrimary);
  nameLines.forEach((line, idx) => {
    doc.text(line, COL_BY_KEY.stakeholder.x + 2.5, nameStartY + idx * 3.4, {
      align: "left",
    });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandBlue);
  const subStartY = nameStartY + nameLines.length * 3.4;
  subtitleLines.forEach((line, idx) => {
    doc.text(line, COL_BY_KEY.stakeholder.x + 2.5, subStartY + idx * 3.0, {
      align: "left",
    });
  });

  // 2. Grupo
  const groupBlockH = groupLines.length * 3.3;
  const groupStartY = y + (height - groupBlockH) / 2 + 2.4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.1);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.textPrimary);
  groupLines.forEach((line, idx) => {
    doc.text(line, COL_BY_KEY.group.x + 2.2, groupStartY + idx * 3.3, {
      align: "left",
    });
  });

  // 3. Estratégia (Pill + Poder/Interesse)
  const strategyCenterX = COL_BY_KEY.strategy.x + COL_BY_KEY.strategy.width / 2;
  drawBadgePill(
    doc,
    row.strategyLabel,
    row.strategyTone,
    strategyCenterX,
    centerY - 1.5,
    COL_BY_KEY.strategy.width,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.0);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandNavy);
  doc.text(row.powerInterestMeta, strategyCenterX, centerY + 3.5, {
    align: "center",
  });

  // 4. Canal (Pill)
  drawBadgePill(
    doc,
    row.channelLabel,
    row.channelTone,
    COL_BY_KEY.channel.x + COL_BY_KEY.channel.width / 2,
    centerY,
    COL_BY_KEY.channel.width,
  );

  // 5. Frequência
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.textPrimary);
  doc.text(
    row.frequencyLabel,
    COL_BY_KEY.frequency.x + COL_BY_KEY.frequency.width / 2,
    centerY + 0.9,
    { align: "center" },
  );

  // 6. Engajamento (Atual -> Meta)
  const engCenterX = COL_BY_KEY.engagement.x + COL_BY_KEY.engagement.width / 2;
  if (row.engagementSecondary) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.7);
    doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.textPrimary);
    doc.text(row.engagementPrimary, engCenterX, centerY - 0.9, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandBlue);
    doc.text(row.engagementSecondary, engCenterX, centerY + 2.6, {
      align: "center",
    });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.0);
    doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.textPrimary);
    doc.text(row.engagementPrimary, engCenterX, centerY + 0.9, {
      align: "center",
    });
  }

  // 7. Conteúdo / Abordagem
  const contentBlockH =
    contentLines.length * 3.2 +
    (responsibleLines.length > 0 ? responsibleLines.length * 3.0 + 0.8 : 0);
  const contentStartY = y + (height - contentBlockH) / 2 + 2.4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.0);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.textPrimary);
  contentLines.forEach((line, idx) => {
    doc.text(line, COL_BY_KEY.content.x + 2.5, contentStartY + idx * 3.2, {
      align: "left",
    });
  });

  if (responsibleLines.length > 0) {
    const respStartY = contentStartY + contentLines.length * 3.2 + 0.6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.4);
    doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandNavy);
    responsibleLines.forEach((line, idx) => {
      doc.text(line, COL_BY_KEY.content.x + 2.5, respStartY + idx * 3.0, {
        align: "left",
      });
    });
  }
}

function drawSummaryRow(
  doc: jsPDF,
  data: CommunicationMatrixPdfData,
  y: number,
): number {
  const height = 7.6;

  doc.setFillColor(...COMMUNICATION_MATRIX_PDF_COLORS.finalBalanceBg);
  doc.setDrawColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandBlue);
  doc.setLineWidth(0.35);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "FD");

  const baselineY = y + height / 2 + 1.1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandNavy);
  doc.text("T O T A L   D A   M A T R I Z", MARGIN_X + 2.5, baselineY, {
    align: "left",
  });

  doc.text(
    `E-mail: ${data.channelCounts.EMAIL}  •  WhatsApp: ${data.channelCounts.WHATSAPP}  •  Reunião: ${data.channelCounts.MEETING}  •  Relatório PDF: ${data.channelCounts.REPORT_PDF}`,
    MARGIN_X + CONTENT_WIDTH - 2.5,
    baselineY,
    { align: "right" },
  );

  return y + height;
}

function drawPageFooter(
  doc: jsPDF,
  pageNumber: number,
  pageCount: number,
  teamName: string,
  formattedDate: string,
): void {
  const lineY = PAGE_HEIGHT - 11;
  const textY = PAGE_HEIGHT - 7;

  doc.setDrawColor(...COMMUNICATION_MATRIX_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_X, lineY, MARGIN_X + CONTENT_WIDTH, lineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...COMMUNICATION_MATRIX_PDF_COLORS.brandNavy);
  doc.text(
    `${teamName} • Matriz de Comunicação • Emitido em ${formattedDate}`,
    MARGIN_X,
    textY,
    { align: "left" },
  );
  doc.text(
    `Página ${pageNumber} de ${pageCount}`,
    MARGIN_X + CONTENT_WIDTH,
    textY,
    { align: "right" },
  );
}

/**
 * Gera e dispara o download da Matriz de Comunicação em PDF (A4 Paisagem),
 * em formato tabular para portfólio seguindo o padrão visual Azul e Amarelo da equipe.
 */
export async function exportCommunicationMatrixToPdf({
  stakeholders,
  teamName,
  groupFilter,
}: ExportCommunicationMatrixPdfParams): Promise<{
  filename: string;
  pageCount: number;
  rowCount: number;
}> {
  if (stakeholders.length === 0) {
    throw new Error("Não há stakeholders cadastrados para gerar a matriz.");
  }

  const data = buildCommunicationMatrixPdfData({
    stakeholders,
    teamName,
    groupFilter,
  });

  if (data.rows.length === 0) {
    throw new Error("Não há registros para o filtro selecionado.");
  }

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

  const filename = buildCommunicationMatrixPdfFilename(data.teamDisplayName, now);
  doc.save(filename);

  return { filename, pageCount, rowCount: data.rows.length };
}
