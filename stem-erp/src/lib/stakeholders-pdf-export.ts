import type { jsPDF } from "jspdf";
import type {
  StakeholderGroup,
  StakeholderWithRelations,
} from "@/types/communication";
import {
  buildStakeholdersPdfData,
  buildStakeholdersPdfFilename,
  STAKEHOLDER_QUADRANT_CONFIG,
  STAKEHOLDER_RELATION_COLORS,
  STAKEHOLDERS_PDF_COLORS,
  type StakeholderMatrixCard,
  type StakeholderQuadrantKey,
  type StakeholderRelationKind,
  type StakeholdersPdfData,
} from "./stakeholders-pdf-layout";

export interface ExportStakeholdersPdfParams {
  stakeholders: StakeholderWithRelations[];
  teamName?: string;
  groupFilter?: StakeholderGroup | "ALL";
}

const PAGE_WIDTH = 297; // A4 Paisagem (mm)
const PAGE_HEIGHT = 210;
const MARGIN_X = 12;
const MARGIN_TOP = 8;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 273mm

const MATRIX = {
  axisX: 22.5,
  axisTopY: 28,
  axisBottomY: 185.5,
  axisRightX: 237,
  leftColX: 25,
  rightColX: 129,
  topRowY: 28,
  bottomRowY: 107.5,
  quadW: 100,
  quadH: 76,
  dividerX: 127,
} as const;

const SIDE_PANEL = {
  x: 241,
  w: 44,
  summaryY: 28,
  summaryH: 48,
  legendY: 108,
  legendH: 64,
} as const;

const QUADRANT_RECTS: Record<
  StakeholderQuadrantKey,
  { x: number; y: number; w: number; h: number }
> = {
  KEEP_SATISFIED: {
    x: MATRIX.leftColX,
    y: MATRIX.topRowY,
    w: MATRIX.quadW,
    h: MATRIX.quadH,
  },
  MANAGE_CLOSELY: {
    x: MATRIX.rightColX,
    y: MATRIX.topRowY,
    w: MATRIX.quadW,
    h: MATRIX.quadH,
  },
  MONITOR: {
    x: MATRIX.leftColX,
    y: MATRIX.bottomRowY,
    w: MATRIX.quadW,
    h: MATRIX.quadH,
  },
  KEEP_INFORMED: {
    x: MATRIX.rightColX,
    y: MATRIX.bottomRowY,
    w: MATRIX.quadW,
    h: MATRIX.quadH,
  },
};

function truncateToWidth(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && doc.getTextWidth(`${trimmed}…`) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed.trimEnd()}…`;
}

/**
 * Desenha os 3 ícones vetoriais da legenda e dos cards (Raio, Coração e Parceria).
 */
function drawRelationIcon(
  doc: jsPDF,
  relation: StakeholderRelationKind,
  centerX: number,
  centerY: number,
  scale = 1
): void {
  const color = STAKEHOLDER_RELATION_COLORS[relation];
  doc.setFillColor(...color);
  doc.setDrawColor(...color);

  if (relation === "NEGATIVE") {
    // Raio amarelo/ouro (Negativas)
    const s = scale;
    doc.lines(
      [
        [-1.3 * s, 2.3 * s],
        [1.1 * s, 0],
        [-1.0 * s, 2.4 * s],
        [2.4 * s, -2.9 * s],
        [-1.1 * s, 0],
        [1.0 * s, -1.8 * s],
      ],
      centerX + 0.3 * s,
      centerY - 2.3 * s,
      [1, 1],
      "F",
      true
    );
    return;
  }

  if (relation === "POSITIVE") {
    // Coração vermelho (Positivas)
    const r = 1.15 * scale;
    doc.circle(centerX - r * 0.85, centerY - r * 0.45, r, "F");
    doc.circle(centerX + r * 0.85, centerY - r * 0.45, r, "F");
    doc.triangle(
      centerX - r * 1.82,
      centerY - r * 0.1,
      centerX + r * 1.82,
      centerY - r * 0.1,
      centerX,
      centerY + r * 2.05,
      "F"
    );
    return;
  }

  // Potenciais parcerias (duas figuras conectadas em teal)
  const s = scale;
  doc.circle(centerX - 1.35 * s, centerY - 1.2 * s, 0.72 * s, "F");
  doc.circle(centerX + 1.35 * s, centerY - 1.2 * s, 0.72 * s, "F");
  doc.roundedRect(
    centerX - 2.2 * s,
    centerY - 0.15 * s,
    1.7 * s,
    2.1 * s,
    0.5 * s,
    0.5 * s,
    "F"
  );
  doc.roundedRect(
    centerX + 0.5 * s,
    centerY - 0.15 * s,
    1.7 * s,
    2.1 * s,
    0.5 * s,
    0.5 * s,
    "F"
  );
  doc.setLineWidth(0.55 * s);
  doc.line(centerX - 0.8 * s, centerY + 0.4 * s, centerX + 0.8 * s, centerY + 0.4 * s);
}

/**
 * Cabeçalho bicolor Azul + Amarelo (padrão oficial Gênesis).
 */
function drawPageHeader(doc: jsPDF, data: StakeholdersPdfData): void {
  const bannerY = MARGIN_TOP;
  const bannerH = 14.5;
  const splitTopX = MARGIN_X + CONTENT_WIDTH * 0.78;
  const splitBottomX = splitTopX - 8.5;

  doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, bannerY, CONTENT_WIDTH, bannerH, "F");

  doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.brandBlue);
  const blueVectors: [number, number][] = [
    [splitTopX - MARGIN_X, 0],
    [splitBottomX - splitTopX, bannerH],
    [-(splitBottomX - MARGIN_X), 0],
    [0, -bannerH],
  ];
  doc.lines(blueVectors, MARGIN_X, bannerY, [1, 1], "F", true);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandYellow);
  doc.text("Matriz de Stakeholders (Poder × Interesse)", MARGIN_X + 4, bannerY + 6.4, {
    align: "left",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.white);
  doc.text(
    `Equipe: ${data.teamDisplayName.toUpperCase()}  •  Filtro: ${data.filterLabel}`,
    MARGIN_X + 4,
    bannerY + 11.8,
    { align: "left" }
  );

  const yellowCenterX =
    splitTopX + (MARGIN_X + CONTENT_WIDTH - splitTopX) / 2 + 1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandNavy);
  doc.text("GÊNESIS", yellowCenterX, bannerY + 7.6, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.text("STAKEHOLDERS", yellowCenterX, bannerY + 11.8, { align: "center" });
}

/**
 * Desenha os eixos PODER (vertical) e INTERESSE (horizontal) com setas e divisória tracejada.
 */
function drawMatrixAxes(doc: jsPDF): void {
  doc.setDrawColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
  doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
  doc.setLineWidth(1.0);

  // Eixo vertical (PODER)
  doc.line(MATRIX.axisX, MATRIX.axisBottomY, MATRIX.axisX, MATRIX.axisTopY);
  // Seta superior
  doc.line(MATRIX.axisX, MATRIX.axisTopY, MATRIX.axisX - 2.4, MATRIX.axisTopY + 3.6);
  doc.line(MATRIX.axisX, MATRIX.axisTopY, MATRIX.axisX + 2.4, MATRIX.axisTopY + 3.6);

  // Eixo horizontal (INTERESSE)
  doc.line(MATRIX.axisX, MATRIX.axisBottomY, MATRIX.axisRightX, MATRIX.axisBottomY);
  // Seta direita
  doc.line(
    MATRIX.axisRightX,
    MATRIX.axisBottomY,
    MATRIX.axisRightX - 3.6,
    MATRIX.axisBottomY - 2.4
  );
  doc.line(
    MATRIX.axisRightX,
    MATRIX.axisBottomY,
    MATRIX.axisRightX - 3.6,
    MATRIX.axisBottomY + 2.4
  );

  // Linha tracejada vertical entre quadrantes da esquerda e direita
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.3);
  const dashLen = 2.0;
  const gapLen = 1.6;
  for (let y = MATRIX.topRowY; y < MATRIX.axisBottomY - 2; y += dashLen + gapLen) {
    const endY = Math.min(y + dashLen, MATRIX.axisBottomY - 2);
    doc.line(MATRIX.dividerX, y, MATRIX.dividerX, endY);
  }

  // Rótulo vertical PODER
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
  doc.text("PODER", 17.5, (MATRIX.topRowY + MATRIX.axisBottomY) / 2 + 8, {
    angle: 90,
  });

  // Rótulo horizontal INTERESSE
  doc.text("INTERESSE", MATRIX.dividerX, MATRIX.axisBottomY + 6.2, {
    align: "center",
  });
}

/**
 * Desenha os 4 quadrantes coloridos da matriz e os cards de stakeholders dentro de cada um.
 */
function drawQuadrantsPage(
  doc: jsPDF,
  slices: Record<StakeholderQuadrantKey, StakeholderMatrixCard[]>
): void {
  const keys: StakeholderQuadrantKey[] = [
    "KEEP_SATISFIED",
    "MANAGE_CLOSELY",
    "MONITOR",
    "KEEP_INFORMED",
  ];

  for (const key of keys) {
    const rect = QUADRANT_RECTS[key];
    const config = STAKEHOLDER_QUADRANT_CONFIG[key];
    const items = slices[key];

    // Fundo colorido do quadrante
    doc.setFillColor(...config.bgColor);
    doc.rect(rect.x, rect.y, rect.w, rect.h, "F");

    // Título do quadrante (mesmas posições da referência)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);

    if (config.titlePosition === "top-left") {
      doc.text(config.title, rect.x + 3.2, rect.y + 6.0, { align: "left" });
    } else if (config.titlePosition === "bottom-left") {
      doc.text(config.title, rect.x + 3.2, rect.y + rect.h - 3.0, {
        align: "left",
      });
    } else {
      doc.text(config.title, rect.x + rect.w - 3.2, rect.y + rect.h - 3.0, {
        align: "right",
      });
    }

    if (items.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Nenhum stakeholder neste quadrante", rect.x + rect.w / 2, rect.y + rect.h / 2, {
        align: "center",
      });
      continue;
    }

    // Área útil para os cards dentro do quadrante
    const padX = 3.0;
    const contentTopY =
      config.titlePosition === "top-left" ? rect.y + 9.0 : rect.y + 3.2;
    const contentBottomY =
      config.titlePosition === "top-left"
        ? rect.y + rect.h - 3.0
        : rect.y + rect.h - 8.5;
    const availH = contentBottomY - contentTopY;

    const cols = 2;
    const gapX = 2.4;
    const gapY = 2.0;
    const cardW = (rect.w - padX * 2 - gapX) / cols;
    const rowsNeeded = Math.ceil(items.length / cols);
    const cardH = Math.min(10.2, Math.max(7.8, (availH - gapY * (rowsNeeded - 1)) / rowsNeeded));

    items.forEach((card, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cx = rect.x + padX + col * (cardW + gapX);
      const cy = contentTopY + row * (cardH + gapY);

      // Card branco arredondado com borda sutil
      doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.white);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.roundedRect(cx, cy, cardW, cardH, 1.4, 1.4, "FD");

      // Ícone da relação à esquerda
      drawRelationIcon(doc, card.relation, cx + 4.0, cy + cardH / 2, 0.85);

      const textX = cx + 8.0;
      const maxTextW = cardW - 9.5;

      // Nome em negrito
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.1);
      doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
      doc.text(
        truncateToWidth(doc, card.name, maxTextW),
        textX,
        cy + cardH * 0.43,
        { align: "left" }
      );

      // Subtítulo (Organização / Cargo)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.0);
      doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
      doc.text(
        truncateToWidth(doc, card.subtitle, maxTextW),
        textX,
        cy + cardH * 0.78,
        { align: "left" }
      );
    });
  }
}

/**
 * Painel lateral direito: Resumo da Matriz + Caixa "RELAÇÕES" (fiel à imagem de referência).
 */
function drawSidePanel(doc: jsPDF, data: StakeholdersPdfData): void {
  const { x, w, summaryY, summaryH, legendY, legendH } = SIDE_PANEL;

  // 1. Card de resumo consolidado (Azul + Amarelo Gênesis)
  doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.white);
  doc.setDrawColor(...STAKEHOLDERS_PDF_COLORS.brandBlue);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, summaryY, w, summaryH, 1.6, 1.6, "FD");

  // Cabeçalho azul do resumo
  doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.brandBlue);
  doc.rect(x, summaryY, w, 7.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandYellow);
  doc.text("RESUMO", x + w / 2, summaryY + 4.9, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandNavy);
  doc.text(String(data.totalStakeholders), x + w / 2, summaryY + 15.5, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
  doc.text(
    data.totalStakeholders === 1 ? "stakeholder mapeado" : "stakeholders mapeados",
    x + w / 2,
    summaryY + 19.6,
    { align: "center" }
  );

  const summaryRows: Array<{ label: string; count: number }> = [
    { label: "Gerenciar de perto", count: data.quadrants.MANAGE_CLOSELY.length },
    { label: "Manter satisfeito", count: data.quadrants.KEEP_SATISFIED.length },
    { label: "Manter informado", count: data.quadrants.KEEP_INFORMED.length },
    { label: "Monitorar", count: data.quadrants.MONITOR.length },
  ];

  doc.setDrawColor(...STAKEHOLDERS_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.2);
  doc.line(x + 2.5, summaryY + 22.5, x + w - 2.5, summaryY + 22.5);

  summaryRows.forEach((row, idx) => {
    const ry = summaryY + 27.5 + idx * 5.0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
    doc.text(row.label, x + 2.8, ry, { align: "left" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandNavy);
    doc.text(String(row.count), x + w - 2.8, ry, { align: "right" });
  });

  // 2. Caixa de Legenda "RELAÇÕES" (com sombra suave e borda escura como na referência)
  doc.setFillColor(203, 213, 225);
  doc.rect(x + 1.0, legendY + 1.0, w, legendH, "F");

  doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.white);
  doc.setDrawColor(...STAKEHOLDERS_PDF_COLORS.brandNavy);
  doc.setLineWidth(0.45);
  doc.rect(x, legendY, w, legendH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
  doc.text("RELAÇÕES", x + w / 2, legendY + 7.5, { align: "center" });

  const legendItems: Array<{
    relation: StakeholderRelationKind;
    title: string;
    subtitle: string;
  }> = [
    {
      relation: "NEGATIVE",
      title: "NEGATIVAS",
      subtitle: `Resistente (${data.relationCounts.negative})`,
    },
    {
      relation: "POSITIVE",
      title: "POSITIVAS",
      subtitle: `Apoiador / Líder (${data.relationCounts.positive})`,
    },
    {
      relation: "POTENTIAL_PARTNERSHIP",
      title: "POTENCIAIS PARCERIAS",
      subtitle: `Neutro / Base (${data.relationCounts.potential})`,
    },
  ];

  legendItems.forEach((item, idx) => {
    const iy = legendY + 19.5 + idx * 15.5;
    drawRelationIcon(doc, item.relation, x + 7.5, iy, 1.35);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.6);
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
    const titleLines = doc.splitTextToSize(item.title, w - 15.5) as string[];
    titleLines.forEach((line, lineIdx) => {
      doc.text(line, x + 13.5, iy - 1.2 + lineIdx * 2.9, { align: "left" });
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.9);
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
    doc.text(
      item.subtitle,
      x + 13.5,
      iy - 1.2 + titleLines.length * 2.9 + 0.6,
      { align: "left" }
    );
  });
}

function drawPageFooter(
  doc: jsPDF,
  pageNumber: number,
  pageCount: number,
  teamName: string,
  formattedDate: string
): void {
  const lineY = PAGE_HEIGHT - 10;
  const textY = PAGE_HEIGHT - 6;

  doc.setDrawColor(...STAKEHOLDERS_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_X, lineY, MARGIN_X + CONTENT_WIDTH, lineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.0);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textSecondary);
  doc.text(
    `${teamName} • Matriz de Stakeholders (Poder × Interesse) • Emitido em ${formattedDate}`,
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
 * Gera e dispara o download da Matriz de Stakeholders (Poder × Interesse) em PDF (A4 Paisagem),
 * com os 4 quadrantes coloridos, eixos com setas, cards com ícones de relação e legenda lateral.
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
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const now = new Date();
  const formattedDate = now.toLocaleDateString("pt-BR");

  // Até 12 cards por quadrante por página (2 colunas x 6 linhas)
  const MAX_PER_QUADRANT_PER_PAGE = 12;
  const maxItemsInAnyQuadrant = Math.max(
    data.quadrants.KEEP_SATISFIED.length,
    data.quadrants.MANAGE_CLOSELY.length,
    data.quadrants.MONITOR.length,
    data.quadrants.KEEP_INFORMED.length,
    1
  );
  const totalPages = Math.ceil(
    maxItemsInAnyQuadrant / MAX_PER_QUADRANT_PER_PAGE
  );

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx += 1) {
    if (pageIdx > 0) {
      doc.addPage("a4", "landscape");
    }

    const start = pageIdx * MAX_PER_QUADRANT_PER_PAGE;
    const end = start + MAX_PER_QUADRANT_PER_PAGE;

    const pageSlices: Record<StakeholderQuadrantKey, StakeholderMatrixCard[]> = {
      KEEP_SATISFIED: data.quadrants.KEEP_SATISFIED.slice(start, end),
      MANAGE_CLOSELY: data.quadrants.MANAGE_CLOSELY.slice(start, end),
      MONITOR: data.quadrants.MONITOR.slice(start, end),
      KEEP_INFORMED: data.quadrants.KEEP_INFORMED.slice(start, end),
    };

    drawPageHeader(doc, data);
    drawQuadrantsPage(doc, pageSlices);
    drawMatrixAxes(doc);
    drawSidePanel(doc, data);
    drawPageFooter(
      doc,
      pageIdx + 1,
      totalPages,
      data.teamDisplayName,
      formattedDate
    );
  }

  const filename = buildStakeholdersPdfFilename(data.teamDisplayName, now);
  doc.save(filename);

  return { filename, pageCount: totalPages };
}
