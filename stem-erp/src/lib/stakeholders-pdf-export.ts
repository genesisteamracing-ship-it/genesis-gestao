import type { jsPDF } from "jspdf";
import { getStoredLocale, type AppLocale } from "@/lib/i18n/locale-types";
import {
  resolveTranslatedPdfText,
  translatePdfTexts,
} from "@/lib/i18n/pdf-translate-client";
import type {
  StakeholderGroup,
  StakeholderWithRelations,
} from "@/types/communication";
import {
  buildStakeholdersPdfData,
  buildStakeholdersPdfFilename,
  STAKEHOLDER_QUADRANT_CONFIG,
  STAKEHOLDERS_PDF_COLORS,
  type StakeholderMatrixCard,
  type StakeholderQuadrantKey,
  type StakeholdersPdfData,
} from "./stakeholders-pdf-layout";

export interface ExportStakeholdersPdfParams {
  stakeholders: StakeholderWithRelations[];
  teamName?: string;
  groupFilter?: StakeholderGroup | "ALL";
  locale?: AppLocale;
}

const QUADRANT_TITLES_EN: Record<StakeholderQuadrantKey, string> = {
  KEEP_SATISFIED: "Keep satisfied",
  MANAGE_CLOSELY: "Manage closely & engage",
  MONITOR: "Monitor",
  KEEP_INFORMED: "Keep informed",
};

const PAGE_WIDTH = 297; // A4 Paisagem (mm)
const PAGE_HEIGHT = 210;
const MARGIN_X = 12;
const MARGIN_TOP = 8;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 273mm

const MATRIX = {
  axisX: 22.5,
  axisTopY: 32.5,
  axisBottomY: 185.5,
  axisRightX: 284,
  leftColX: 25,
  rightColX: 155,
  topRowY: 32.5,
  bottomRowY: 110,
  quadW: 126,
  quadH: 73.5,
  dividerX: 153,
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
 * Cabeçalho bicolor Azul + Amarelo (padrão oficial Gênesis) + faixa compacta de contadores.
 */
function drawPageHeader(
  doc: jsPDF,
  data: StakeholdersPdfData,
  locale: AppLocale
): void {
  const isEn = locale === "en-US";
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
  doc.text(
    isEn
      ? "Stakeholders Matrix (Power × Interest)"
      : "Matriz de Stakeholders (Poder × Interesse)",
    MARGIN_X + 4,
    bannerY + 6.4,
    { align: "left" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.white);
  doc.text(
    `${isEn ? "Team" : "Equipe"}: ${data.teamDisplayName.toUpperCase()}  •  ${isEn ? "Filter" : "Filtro"}: ${data.filterLabel}`,
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

  // Linha de resumo horizontal limpa (sem caixa de relações)
  const metaY = bannerY + bannerH + 4.8;
  doc.setFontSize(7.6);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);

  doc.setFont("helvetica", "bold");
  doc.text(isEn ? "Manage closely:" : "Gerenciar de perto:", MARGIN_X, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.quadrants.MANAGE_CLOSELY.length), MARGIN_X + 28, metaY);

  doc.setFont("helvetica", "bold");
  doc.text(
    isEn ? "Keep satisfied:" : "Manter satisfeito:",
    MARGIN_X + 44,
    metaY
  );
  doc.setFont("helvetica", "normal");
  doc.text(String(data.quadrants.KEEP_SATISFIED.length), MARGIN_X + 69.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.text(
    isEn ? "Keep informed:" : "Manter informado:",
    MARGIN_X + 86,
    metaY
  );
  doc.setFont("helvetica", "normal");
  doc.text(String(data.quadrants.KEEP_INFORMED.length), MARGIN_X + 112.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.text(isEn ? "Monitor:" : "Monitorar:", MARGIN_X + 129, metaY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.quadrants.MONITOR.length), MARGIN_X + 144.5, metaY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandNavy);
  doc.text(
    `${data.totalStakeholders} ${
      isEn
        ? data.totalStakeholders === 1
          ? "mapped stakeholder"
          : "mapped stakeholders"
        : data.totalStakeholders === 1
          ? "stakeholder mapeado"
          : "stakeholders mapeados"
    }`,
    MARGIN_X + CONTENT_WIDTH,
    metaY,
    { align: "right" }
  );
}

/**
 * Desenha os eixos PODER (vertical) e INTERESSE (horizontal) com setas e divisória tracejada.
 */
function drawMatrixAxes(doc: jsPDF, locale: AppLocale): void {
  const isEn = locale === "en-US";
  doc.setDrawColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
  doc.setLineWidth(0.95);

  // Eixo vertical (PODER)
  doc.line(MATRIX.axisX, MATRIX.axisBottomY, MATRIX.axisX, MATRIX.axisTopY);
  doc.line(
    MATRIX.axisX,
    MATRIX.axisTopY,
    MATRIX.axisX - 2.3,
    MATRIX.axisTopY + 3.5
  );
  doc.line(
    MATRIX.axisX,
    MATRIX.axisTopY,
    MATRIX.axisX + 2.3,
    MATRIX.axisTopY + 3.5
  );

  // Eixo horizontal (INTERESSE)
  doc.line(
    MATRIX.axisX,
    MATRIX.axisBottomY,
    MATRIX.axisRightX,
    MATRIX.axisBottomY
  );
  doc.line(
    MATRIX.axisRightX,
    MATRIX.axisBottomY,
    MATRIX.axisRightX - 3.5,
    MATRIX.axisBottomY - 2.3
  );
  doc.line(
    MATRIX.axisRightX,
    MATRIX.axisBottomY,
    MATRIX.axisRightX - 3.5,
    MATRIX.axisBottomY + 2.3
  );

  // Linha tracejada vertical entre quadrantes da esquerda e direita
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  const dashLen = 2.0;
  const gapLen = 1.6;
  for (
    let y = MATRIX.topRowY;
    y < MATRIX.axisBottomY - 2;
    y += dashLen + gapLen
  ) {
    const endY = Math.min(y + dashLen, MATRIX.axisBottomY - 2);
    doc.line(MATRIX.dividerX, y, MATRIX.dividerX, endY);
  }

  // Rótulo vertical PODER
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
  doc.text(
    isEn ? "POWER" : "PODER",
    17.5,
    (MATRIX.topRowY + MATRIX.axisBottomY) / 2 + 7.5,
    {
      angle: 90,
    }
  );

  // Rótulo horizontal INTERESSE
  doc.text(
    isEn ? "INTEREST" : "INTERESSE",
    MATRIX.dividerX,
    MATRIX.axisBottomY + 6.0,
    {
      align: "center",
    }
  );
}

/**
 * Desenha os 4 quadrantes translúcidos e os cards corporativos limpos (sem emojis/ícones infantis).
 */
function drawQuadrantsPage(
  doc: jsPDF,
  slices: Record<StakeholderQuadrantKey, StakeholderMatrixCard[]>,
  locale: AppLocale
): void {
  const isEn = locale === "en-US";
  const keys: StakeholderQuadrantKey[] = [
    "KEEP_SATISFIED",
    "MANAGE_CLOSELY",
    "MONITOR",
    "KEEP_INFORMED",
  ];

  for (const key of keys) {
    const rect = QUADRANT_RECTS[key];
    const config = STAKEHOLDER_QUADRANT_CONFIG[key];
    const quadrantTitle = isEn ? QUADRANT_TITLES_EN[key] : config.title;
    const items = slices[key];

    // Fundo translúcido + borda sutil
    doc.setFillColor(...config.bgColor);
    doc.setDrawColor(...config.borderColor);
    doc.setLineWidth(0.35);
    doc.roundedRect(rect.x, rect.y, rect.w, rect.h, 1.8, 1.8, "FD");

    // Título do quadrante
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.4);
    doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);

    if (config.titlePosition === "top-left") {
      doc.text(quadrantTitle, rect.x + 3.6, rect.y + 6.0, { align: "left" });
    } else if (config.titlePosition === "bottom-left") {
      doc.text(quadrantTitle, rect.x + 3.6, rect.y + rect.h - 3.0, {
        align: "left",
      });
    } else {
      doc.text(quadrantTitle, rect.x + rect.w - 3.6, rect.y + rect.h - 3.0, {
        align: "right",
      });
    }

    if (items.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.6);
      doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandNavy);
      doc.text(
        isEn
          ? "No stakeholders in this quadrant"
          : "Nenhum stakeholder neste quadrante",
        rect.x + rect.w / 2,
        rect.y + rect.h / 2,
        { align: "center" }
      );
      continue;
    }

    const padX = 3.4;
    const contentTopY =
      config.titlePosition === "top-left" ? rect.y + 9.0 : rect.y + 3.2;
    const contentBottomY =
      config.titlePosition === "top-left"
        ? rect.y + rect.h - 3.2
        : rect.y + rect.h - 8.4;
    const availH = contentBottomY - contentTopY;

    const cols = 2;
    const gapX = 2.8;
    const gapY = 2.0;
    const cardW = (rect.w - padX * 2 - gapX) / cols;
    const rowsNeeded = Math.ceil(items.length / cols);
    const cardH = Math.min(
      10.0,
      Math.max(7.6, (availH - gapY * (rowsNeeded - 1)) / rowsNeeded)
    );

    items.forEach((card, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cx = rect.x + padX + col * (cardW + gapX);
      const cy = contentTopY + row * (cardH + gapY);

      // Card branco limpo com borda suave
      doc.setFillColor(...STAKEHOLDERS_PDF_COLORS.white);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.22);
      doc.roundedRect(cx, cy, cardW, cardH, 1.3, 1.3, "FD");

      // Filete lateral minimalista na cor de destaque do quadrante
      doc.setFillColor(...config.accentColor);
      doc.rect(cx, cy + 1.0, 1.15, cardH - 2.0, "F");

      const textX = cx + 3.2;
      const engagementReserve = 18;
      const maxNameW = cardW - engagementReserve - 4.5;
      const maxSubW = cardW - 5.0;

      // Nome em negrito
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.3);
      doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.textPrimary);
      doc.text(
        truncateToWidth(doc, card.name, maxNameW),
        textX,
        cy + cardH * 0.43,
        { align: "left" }
      );

      // Engajamento discreto à direita (texto puro, sem emoji)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandNavy);
      doc.text(
        truncateToWidth(doc, card.engagementLabel, engagementReserve),
        cx + cardW - 2.2,
        cy + cardH * 0.43,
        { align: "right" }
      );

      // Subtítulo (Organização / Cargo)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.1);
      doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandBlue);
      doc.text(
        truncateToWidth(doc, card.subtitle, maxSubW),
        textX,
        cy + cardH * 0.79,
        { align: "left" }
      );
    });
  }
}

function drawPageFooter(
  doc: jsPDF,
  pageNumber: number,
  pageCount: number,
  teamName: string,
  formattedDate: string,
  locale: AppLocale
): void {
  const isEn = locale === "en-US";
  const lineY = PAGE_HEIGHT - 10;
  const textY = PAGE_HEIGHT - 6;

  doc.setDrawColor(...STAKEHOLDERS_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_X, lineY, MARGIN_X + CONTENT_WIDTH, lineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.0);
  doc.setTextColor(...STAKEHOLDERS_PDF_COLORS.brandNavy);
  doc.text(
    isEn
      ? `${teamName} • Stakeholders Matrix (Power × Interest) • Issued on ${formattedDate}`
      : `${teamName} • Matriz de Stakeholders (Poder × Interesse) • Emitido em ${formattedDate}`,
    MARGIN_X,
    textY,
    { align: "left" }
  );
  doc.text(
    isEn
      ? `Page ${pageNumber} of ${pageCount}`
      : `Página ${pageNumber} de ${pageCount}`,
    MARGIN_X + CONTENT_WIDTH,
    textY,
    { align: "right" }
  );
}

/**
 * Gera e dispara o download da Matriz de Stakeholders (Poder × Interesse) em PDF (A4 Paisagem),
 * com os 4 quadrantes translúcidos, eixos com setas e cards corporativos limpos.
 */
export async function exportStakeholdersToPdf({
  stakeholders,
  teamName,
  groupFilter,
  locale,
}: ExportStakeholdersPdfParams): Promise<{
  filename: string;
  pageCount: number;
  translationFallback?: boolean;
}> {
  const resolvedLocale = locale ?? getStoredLocale();
  const isEn = resolvedLocale === "en-US";

  if (stakeholders.length === 0) {
    throw new Error(
      isEn
        ? "There are no registered stakeholders to export."
        : "Não há stakeholders cadastrados para exportar."
    );
  }

  let localizedStakeholders = stakeholders;
  let translationFallback = false;

  if (isEn) {
    const roles = stakeholders.map((item) => item.roleOrJobTitle);
    const translated = await translatePdfTexts(roles, {
      locale: resolvedLocale,
      context: "Stakeholders Power x Interest Matrix PDF (job titles and roles)",
    });
    translationFallback = translated.usedFallback;

    localizedStakeholders = stakeholders.map((item) => ({
      ...item,
      roleOrJobTitle: item.roleOrJobTitle
        ? resolveTranslatedPdfText(
            item.roleOrJobTitle,
            translated.translations,
            resolvedLocale
          )
        : item.roleOrJobTitle,
    }));
  }

  const data = buildStakeholdersPdfData({
    stakeholders: localizedStakeholders,
    teamName,
    groupFilter,
    locale: resolvedLocale,
  });
  const { jsPDF: JsPdfCtor } = await import("jspdf");

  const doc = new JsPdfCtor({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const now = new Date();
  const formattedDate = now.toLocaleDateString(resolvedLocale);

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

    drawPageHeader(doc, data, resolvedLocale);
    drawQuadrantsPage(doc, pageSlices, resolvedLocale);
    drawMatrixAxes(doc, resolvedLocale);
    drawPageFooter(
      doc,
      pageIdx + 1,
      totalPages,
      data.teamDisplayName,
      formattedDate,
      resolvedLocale
    );
  }

  const filename = buildStakeholdersPdfFilename(
    data.teamDisplayName,
    now,
    resolvedLocale
  );
  doc.save(filename);

  return { filename, pageCount: totalPages, translationFallback };
}
