import type { jsPDF } from "jspdf";
import type {
  StakeholderGroup,
  StakeholderWithRelations,
} from "@/types/communication";
import {
  buildStakeholdersPdfData,
  buildStakeholdersPdfFilename,
  STAKEHOLDERS_PDF_COLORS,
  type StakeholderPdfRow,
  type StakeholdersPdfData,
} from "./stakeholders-pdf-layout";

export interface ExportStakeholdersPdfParams {
  stakeholders: StakeholderWithRelations[];
  teamName?: string;
  groupFilter?: StakeholderGroup | "ALL";
}

const PAGE_WIDTH = 210; // A4 Retrato (mm)
const PAGE_HEIGHT = 297;
const MARGIN_X = 12;
const MARGIN_TOP = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 186mm
const CONTENT_BOTTOM = PAGE_HEIGHT - 16; // 281mm

const COL_X = {
  stakeholder: MARGIN_X + 1.5,
  contact: MARGIN_X + 58,
  matrix: MARGIN_X + 104,
  engagement: MARGIN_X + 140,
  channelRight: MARGIN_X + CONTENT_WIDTH - 1.5,
} as const;

const COL_WIDTH = {
  stakeholder: 54,
  contact: 43,
  matrix: 34,
  engagement: 23,
} as const;

/**
 * Desenha o cabeçalho bicolor Azul + Amarelo com corte diagonal no topo,
 * padronizado com o Extrato Financeiro (Livro Caixa) e Planejamento Orçamentário.
 */
function drawPageHeader(doc: jsPDF, data: StakeholdersPdfData): number {
  const bannerY = MARGIN_TOP;
  const bannerH = 16.5;
  const splitTopX = MARGIN_X + CONTENT_WIDTH * 0.72;
  const splitBottomX = splitTopX - 8.5;

  // Bloco direito (Amarelo Ouro Gênesis)
  doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, bannerY, CONTENT_WIDTH, bannerH, "F");

  // Polígono esquerdo (Azul Gênesis com corte diagonal)
  doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.brandBlue);
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
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandYellow);
  doc.text("Diretório de Stakeholders", MARGIN_X + 3.5, bannerY + 7.2, {
    align: "left",
  });

  // Nome da Equipe em Branco sobre o Azul (esquerda)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.white);
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
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandNavy);
  doc.text("GÊNESIS", yellowCenterX, bannerY + 8.6, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.text("STAKEHOLDERS", yellowCenterX, bannerY + 13, {
    align: "center",
  });

  // Linha de metadados (Filtro, Alto Poder, Grupos Ativos, Total)
  const metaY = bannerY + bannerH + 4.8;
  doc.setFontSize(7.8);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);

  doc.setFont("helvetica", "bold");
  doc.text("Filtro:", MARGIN_X, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(data.filterLabel, MARGIN_X + 10.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Alto Poder:", MARGIN_X + 76, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.highPowerCount), MARGIN_X + 94, metaY);

  doc.setFont("helvetica", "bold");
  doc.text("Grupos Ativos:", MARGIN_X + 114, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.activeGroupCount), MARGIN_X + 137, metaY);

  doc.setFont("helvetica", "bold");
  doc.text(
    `${data.totalStakeholders} ${
      data.totalStakeholders === 1 ? "stakeholder" : "stakeholders"
    }`,
    MARGIN_X + CONTENT_WIDTH,
    metaY,
    { align: "right" }
  );

  // Barra da seção "Stakeholders Cadastrados"
  const sectionY = metaY + 3.2;
  const sectionH = 6.2;
  doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.sectionBarBg);
  doc.rect(MARGIN_X, sectionY, CONTENT_WIDTH, sectionH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandBlue);
  doc.text("Stakeholders Cadastrados", MARGIN_X + 2, sectionY + 4.4, {
    align: "left",
  });

  // Cabeçalho das colunas
  const colHeaderY = sectionY + sectionH + 4.4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);

  doc.text("Stakeholder / Organização", COL_X.stakeholder, colHeaderY, {
    align: "left",
  });
  doc.text("Contato", COL_X.contact, colHeaderY, { align: "left" });
  doc.text("Nível / Matriz", COL_X.matrix, colHeaderY, { align: "left" });
  doc.text("Engajamento", COL_X.engagement, colHeaderY, { align: "left" });
  doc.text("Comunicação", COL_X.channelRight, colHeaderY, { align: "right" });

  // Linha divisória abaixo do cabeçalho das colunas
  const headerBottomY = colHeaderY + 1.8;
  doc.setDrawColor(...STAKEHOLDERS_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, headerBottomY, MARGIN_X + CONTENT_WIDTH, headerBottomY);

  return headerBottomY;
}

function measureRow(
  doc: jsPDF,
  row: StakeholderPdfRow
): {
  height: number;
  stakeholderPrimaryLines: string[];
  stakeholderSecondaryLines: string[];
  contactPrimaryLines: string[];
  contactSecondaryLines: string[];
  matrixPrimaryLines: string[];
  engagementPrimaryLines: string[];
} {
  if (row.kind !== "STAKEHOLDER") {
    return {
      height: row.kind === "FINAL_TOTAL" ? 7.6 : 6.4,
      stakeholderPrimaryLines: [row.stakeholderPrimary],
      stakeholderSecondaryLines: [],
      contactPrimaryLines: [],
      contactSecondaryLines: [],
      matrixPrimaryLines: [],
      engagementPrimaryLines: [],
    };
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  const stakeholderPrimaryLines = doc.splitTextToSize(
    row.stakeholderPrimary,
    COL_WIDTH.stakeholder
  ) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  const stakeholderSecondaryLines = row.stakeholderSecondary
    ? (doc.splitTextToSize(
        row.stakeholderSecondary,
        COL_WIDTH.stakeholder
      ) as string[])
    : [];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.1);
  const contactPrimaryLines = doc.splitTextToSize(
    row.contactPrimary,
    COL_WIDTH.contact
  ) as string[];
  const contactSecondaryLines = row.contactSecondary
    ? (doc.splitTextToSize(row.contactSecondary, COL_WIDTH.contact) as string[])
    : [];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.1);
  const matrixPrimaryLines = doc.splitTextToSize(
    row.matrixPrimary,
    COL_WIDTH.matrix
  ) as string[];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  const engagementPrimaryLines = doc.splitTextToSize(
    row.engagementPrimary,
    COL_WIDTH.engagement
  ) as string[];

  const stakeholderHeight =
    stakeholderPrimaryLines.length * 3.5 +
    stakeholderSecondaryLines.length * 3.1;
  const contactHeight =
    contactPrimaryLines.length * 3.3 + contactSecondaryLines.length * 3.1;
  const matrixHeight = matrixPrimaryLines.length * 3.3 + 3.1;
  const engagementHeight =
    engagementPrimaryLines.length * 3.3 + (row.engagementSecondary ? 3.1 : 0);

  const maxBlock = Math.max(
    stakeholderHeight,
    contactHeight,
    matrixHeight,
    engagementHeight
  );
  const height = Math.max(8.8, maxBlock + 2.8);

  return {
    height,
    stakeholderPrimaryLines,
    stakeholderSecondaryLines,
    contactPrimaryLines,
    contactSecondaryLines,
    matrixPrimaryLines,
    engagementPrimaryLines,
  };
}

function drawRow(
  doc: jsPDF,
  row: StakeholderPdfRow,
  y: number,
  rowIndex: number,
  measured: ReturnType<typeof measureRow>
): void {
  const {
    height,
    stakeholderPrimaryLines,
    stakeholderSecondaryLines,
    contactPrimaryLines,
    contactSecondaryLines,
    matrixPrimaryLines,
    engagementPrimaryLines,
  } = measured;

  // Fundo da linha
  if (row.kind === "FINAL_TOTAL") {
    doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.finalBalanceBg);
  } else if (row.kind === "GROUP_SUBTOTAL") {
    doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.dailyBalanceBg);
  } else {
    const bg =
      rowIndex % 2 === 0
        ? STAKEHOLDERS_PDF_COLORS.rowEvenBg
        : STAKEHOLDERS_PDF_COLORS.rowOddBg;
    doc.setFillColor(...bg);
  }
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "F");

  // Divisória inferior suave
  doc.setDrawColor(
    ...(row.kind === "FINAL_TOTAL"
      ? STAKEHOLDERS_PDF_COLORS.brandBlue
      : STAKEHOLDERS_PDF_COLORS.dividerLine)
  );
  doc.setLineWidth(row.kind === "FINAL_TOTAL" ? 0.4 : 0.2);
  doc.line(MARGIN_X, y + height, MARGIN_X + CONTENT_WIDTH, y + height);

  if (row.kind !== "STAKEHOLDER") {
    const baselineY = y + height / 2 + 1.1;
    doc.setFont("helvetica", row.kind === "FINAL_TOTAL" ? "bold" : "normal");
    doc.setFontSize(row.kind === "FINAL_TOTAL" ? 8 : 7.5);
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);

    doc.text(row.stakeholderPrimary, COL_X.stakeholder, baselineY, {
      align: "left",
    });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
    doc.text(row.matrixPrimary, COL_X.matrix, baselineY, { align: "left" });

    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.positiveValue);
    doc.text(row.channelPrimary, COL_X.channelRight, baselineY, {
      align: "right",
    });
    return;
  }

  const firstBaselineY = y + 4.1;

  // Stakeholder / Organização
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
  stakeholderPrimaryLines.forEach((line, idx) => {
    doc.text(line, COL_X.stakeholder, firstBaselineY + idx * 3.5, {
      align: "left",
    });
  });

  if (stakeholderSecondaryLines.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.7);
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
    const secY = firstBaselineY + stakeholderPrimaryLines.length * 3.5;
    stakeholderSecondaryLines.forEach((line, idx) => {
      doc.text(line, COL_X.stakeholder, secY + idx * 3.1, { align: "left" });
    });
  }

  // Contato (E-mail / Telefone)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.1);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
  contactPrimaryLines.forEach((line, idx) => {
    doc.text(line, COL_X.contact, firstBaselineY + idx * 3.3, {
      align: "left",
    });
  });

  if (contactSecondaryLines.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.7);
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
    const secY = firstBaselineY + contactPrimaryLines.length * 3.3;
    contactSecondaryLines.forEach((line, idx) => {
      doc.text(line, COL_X.contact, secY + idx * 3.1, { align: "left" });
    });
  }

  // Nível / Matriz Poder x Interesse
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.1);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandNavy);
  matrixPrimaryLines.forEach((line, idx) => {
    doc.text(line, COL_X.matrix, firstBaselineY + idx * 3.3, { align: "left" });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
  doc.text(
    row.matrixSecondary,
    COL_X.matrix,
    firstBaselineY + matrixPrimaryLines.length * 3.3,
    { align: "left" }
  );

  // Engajamento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  const engagementColor =
    row.engagementTone === "positive"
      ? STAKEHOLDERS_PDF_COLORS.positiveValue
      : row.engagementTone === "negative"
        ? STAKEHOLDERS_PDF_COLORS.negativeValue
        : STAKEHOLDERS_PDF_COLORS.textPrimary;
  doc.setTextColor(...engagementColor);
  engagementPrimaryLines.forEach((line, idx) => {
    doc.text(line, COL_X.engagement, firstBaselineY + idx * 3.3, {
      align: "left",
    });
  });

  if (row.engagementSecondary) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
    doc.text(
      row.engagementSecondary,
      COL_X.engagement,
      firstBaselineY + engagementPrimaryLines.length * 3.3,
      { align: "left" }
    );
  }

  // Comunicação (Canal / Frequência)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
  doc.text(row.channelPrimary, COL_X.channelRight, firstBaselineY, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
  doc.text(row.channelSecondary, COL_X.channelRight, firstBaselineY + 3.4, {
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

  doc.setDrawColor(...STAKEHOLDERS_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_X, lineY, MARGIN_X + CONTENT_WIDTH, lineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
  doc.text(
    `${teamName} • Diretório de Stakeholders • Emitido em ${formattedDate}`,
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
 * Gera e dispara o download do Diretório de Stakeholders em PDF (A4 Retrato),
 * seguindo a identidade visual Azul e Amarelo da Equipe Gênesis.
 */
export async function exportStakeholdersToPdf({
  stakeholders,
  teamName,
  groupFilter,
}: ExportStakeholdersPdfParams): Promise<{
  filename: string;
  pageCount: number;
}> {
  if (stakeholders.length === 0) {
    throw new Error("Não há stakeholders cadastrados para exportar.");
  }

  const data = buildStakeholdersPdfData({
    stakeholders,
    teamName,
    groupFilter,
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
    if (row.kind === "STAKEHOLDER") {
      visualIndex += 1;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawPageFooter(doc, page, pageCount, data.teamDisplayName, formattedDate);
  }

  const filename = buildStakeholdersPdfFilename(data.teamDisplayName, now);
  doc.save(filename);

  return { filename, pageCount };
}
