import type { jsPDF } from "jspdf";
import type {
  AttendanceAnalyticsDTO,
  AttendancePeriodFilter,
  AttendanceStatus,
  MemberAttendanceSummaryDTO,
} from "@/types/attendance";
import {
  ATTENDANCE_PDF_BADGE_STYLES,
  ATTENDANCE_PDF_COLORS,
  buildIndividualAttendancePdfData,
  buildIndividualAttendancePdfFilename,
  buildTeamAttendancePdfData,
  buildTeamAttendancePdfFilename,
  type IndividualAttendancePdfData,
  type IndividualAttendancePdfRow,
  type TeamAttendanceDailyPdfRow,
  type TeamAttendanceMemberPdfRow,
  type TeamAttendancePdfData,
} from "./attendance-pdf-layout";

export interface ExportIndividualAttendancePdfParams {
  memberSummary: MemberAttendanceSummaryDTO;
  teamName?: string;
  seasonLabel?: string;
  period?: AttendancePeriodFilter;
}

export interface ExportTeamAttendancePdfParams {
  analytics: AttendanceAnalyticsDTO;
  teamName?: string;
  seasonLabel?: string;
  period?: AttendancePeriodFilter;
}

const PAGE_WIDTH = 210; // A4 Retrato (mm)
const PAGE_HEIGHT = 297;
const MARGIN_X = 12;
const MARGIN_TOP = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 186mm
const CONTENT_BOTTOM = PAGE_HEIGHT - 16; // 281mm

function drawBicolorBanner(
  doc: jsPDF,
  title: string,
  teamDisplayName: string
): number {
  const bannerY = MARGIN_TOP;
  const bannerH = 16.5;
  const splitTopX = MARGIN_X + CONTENT_WIDTH * 0.72;
  const splitBottomX = splitTopX - 8.5;

  // Bloco direito (Amarelo Ouro Gênesis)
  doc.setFillColor(...ATTENDANCE_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, bannerY, CONTENT_WIDTH, bannerH, "F");

  // Polígono esquerdo (Azul Gênesis com corte diagonal)
  doc.setFillColor(...ATTENDANCE_PDF_COLORS.brandBlue);
  const blueVectors: [number, number][] = [
    [splitTopX - MARGIN_X, 0],
    [splitBottomX - splitTopX, bannerH],
    [-(splitBottomX - MARGIN_X), 0],
    [0, -bannerH],
  ];
  doc.lines(blueVectors, MARGIN_X, bannerY, [1, 1], "F", true);

  // Título em Amarelo sobre Azul
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.brandYellow);
  doc.text(title, MARGIN_X + 3.5, bannerY + 7.2, { align: "left" });

  // Equipe em Branco sobre Azul
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.white);
  doc.text(
    `Equipe: ${teamDisplayName.toUpperCase()}`,
    MARGIN_X + 3.5,
    bannerY + 13.4,
    { align: "left" }
  );

  // Marca "GÊNESIS" sobre Amarelo
  const yellowCenterX =
    splitTopX + (MARGIN_X + CONTENT_WIDTH - splitTopX) / 2 + 1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.brandNavy);
  doc.text("GÊNESIS", yellowCenterX, bannerY + 8.6, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.text("PRESENÇA NOS TREINOS", yellowCenterX, bannerY + 13, {
    align: "center",
  });

  return bannerY + bannerH;
}

function drawStatusPill(
  doc: jsPDF,
  text: string,
  status: AttendanceStatus,
  centerX: number,
  centerY: number
): void {
  const style = ATTENDANCE_PDF_BADGE_STYLES[status];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);

  const pillW = 20;
  const pillH = 4.8;
  const pillX = centerX - pillW / 2;
  const pillY = centerY - pillH / 2;

  doc.setFillColor(...style.fill);
  doc.setDrawColor(...style.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(pillX, pillY, pillW, pillH, 1.2, 1.2, "FD");

  doc.setTextColor(...style.text);
  doc.text(text, centerX, centerY + 0.9, { align: "center" });
}

function drawPageFooter(
  doc: jsPDF,
  pageNumber: number,
  pageCount: number,
  teamName: string,
  reportTitle: string,
  formattedDate: string
): void {
  const lineY = PAGE_HEIGHT - 11;
  const textY = PAGE_HEIGHT - 7;

  doc.setDrawColor(...ATTENDANCE_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_X, lineY, MARGIN_X + CONTENT_WIDTH, lineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.textSecondary);
  doc.text(
    `${teamName} • ${reportTitle} • Emitido em ${formattedDate}`,
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

// ============================================================================
// RELATÓRIO INDIVIDUAL DE PRESENÇA (PDF)
// ============================================================================

const IND_COLS = [
  { key: "date", label: "DATA", x: MARGIN_X, width: 26, align: "left" as const },
  { key: "day", label: "DIA", x: MARGIN_X + 26, width: 18, align: "center" as const },
  { key: "time", label: "HORÁRIO", x: MARGIN_X + 44, width: 24, align: "center" as const },
  { key: "status", label: "STATUS", x: MARGIN_X + 68, width: 32, align: "center" as const },
  { key: "notes", label: "OBSERVAÇÃO", x: MARGIN_X + 100, width: 86, align: "left" as const },
];

function drawIndividualHeader(
  doc: jsPDF,
  data: IndividualAttendancePdfData,
  includeProfileBlock: boolean
): number {
  let cursorY = drawBicolorBanner(
    doc,
    "Relatório Individual de Presença",
    data.teamDisplayName
  );

  // Linha de metadados
  cursorY += 4.6;
  doc.setFontSize(7.8);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.textPrimary);

  doc.setFont("helvetica", "bold");
  doc.text("Integrante:", MARGIN_X, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(data.memberName, MARGIN_X + 16.5, cursorY);

  doc.setFont("helvetica", "bold");
  doc.text("Período:", MARGIN_X + 92, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(data.periodLabel, MARGIN_X + 106, cursorY);

  doc.setFont("helvetica", "bold");
  doc.text(`Temporada: ${data.seasonLabel}`, MARGIN_X + CONTENT_WIDTH, cursorY, {
    align: "right",
  });

  if (includeProfileBlock) {
    // Cartão de identificação e 4 caixas KPI
    cursorY += 3.2;
    const infoBoxH = 11.5;
    doc.setFillColor(...ATTENDANCE_PDF_COLORS.sectionBarBg);
    doc.setDrawColor(...ATTENDANCE_PDF_COLORS.dividerLine);
    doc.setLineWidth(0.25);
    doc.roundedRect(MARGIN_X, cursorY, CONTENT_WIDTH, infoBoxH, 1.5, 1.5, "FD");

    doc.setFontSize(7.6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ATTENDANCE_PDF_COLORS.brandNavy);
    doc.text(
      `${data.memberName}  •  ${data.sectorLabel}  •  ${data.jobTitleLabel}`,
      MARGIN_X + 3,
      cursorY + 4.8
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...ATTENDANCE_PDF_COLORS.textSecondary);
    doc.text(`E-mail: ${data.memberEmail}`, MARGIN_X + 3, cursorY + 9.2);

    cursorY += infoBoxH + 3.0;

    // 4 caixas KPI lado a lado
    const kpiGap = 3;
    const kpiW = (CONTENT_WIDTH - kpiGap * 3) / 4;
    const kpiH = 13.5;
    const kpis = [
      {
        label: "TREINOS NO PERÍODO",
        value: String(data.totalTrainings),
        color: ATTENDANCE_PDF_COLORS.textPrimary,
      },
      {
        label: "PRESENÇAS",
        value: String(data.presencesCount),
        color: [4, 120, 87] as const,
      },
      {
        label: "FALTAS",
        value: String(data.absencesCount),
        color: ATTENDANCE_PDF_COLORS.negativeValue,
      },
      {
        label: "FREQUÊNCIA",
        value: data.attendanceRateLabel,
        color: ATTENDANCE_PDF_COLORS.brandBlue,
      },
    ];

    kpis.forEach((kpi, idx) => {
      const boxX = MARGIN_X + idx * (kpiW + kpiGap);
      doc.setFillColor(...ATTENDANCE_PDF_COLORS.white);
      doc.setDrawColor(...ATTENDANCE_PDF_COLORS.dividerLine);
      doc.setLineWidth(0.25);
      doc.roundedRect(boxX, cursorY, kpiW, kpiH, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.2);
      doc.setTextColor(...ATTENDANCE_PDF_COLORS.textSecondary);
      doc.text(kpi.label, boxX + 3, cursorY + 4.4);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...kpi.color);
      doc.text(kpi.value, boxX + 3, cursorY + 10.6);
    });

    cursorY += kpiH + 4.2;
  } else {
    cursorY += 3.5;
  }

  // Cabeçalho da Tabela
  const headerH = 7.8;
  const accentH = 0.9;
  doc.setFillColor(...ATTENDANCE_PDF_COLORS.brandBlue);
  doc.rect(MARGIN_X, cursorY, CONTENT_WIDTH, headerH, "F");

  doc.setFillColor(...ATTENDANCE_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, cursorY + headerH, CONTENT_WIDTH, accentH, "F");

  doc.setDrawColor(...ATTENDANCE_PDF_COLORS.brandNavy);
  doc.setLineWidth(0.25);
  for (let i = 1; i < IND_COLS.length; i += 1) {
    doc.line(IND_COLS[i].x, cursorY, IND_COLS[i].x, cursorY + headerH);
  }
  doc.rect(MARGIN_X, cursorY, CONTENT_WIDTH, headerH + accentH, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.white);
  const labelY = cursorY + headerH / 2 + 1.0;

  for (const col of IND_COLS) {
    if (col.align === "center") {
      doc.text(col.label, col.x + col.width / 2, labelY, { align: "center" });
    } else {
      doc.text(col.label, col.x + 2.5, labelY, { align: "left" });
    }
  }

  return cursorY + headerH + accentH;
}

function measureIndividualRow(
  doc: jsPDF,
  row: IndividualAttendancePdfRow
): { height: number; noteLines: string[] } {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.3);
  const noteLines = doc.splitTextToSize(
    row.notes,
    IND_COLS[4].width - 5
  ) as string[];
  const height = Math.max(8.2, noteLines.length * 3.4 + 3.0);
  return { height, noteLines };
}

function drawIndividualRow(
  doc: jsPDF,
  row: IndividualAttendancePdfRow,
  y: number,
  rowIndex: number,
  measured: { height: number; noteLines: string[] }
): void {
  const { height, noteLines } = measured;
  const bg =
    rowIndex % 2 === 0
      ? ATTENDANCE_PDF_COLORS.rowEvenBg
      : ATTENDANCE_PDF_COLORS.rowOddBg;

  doc.setFillColor(...bg);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "F");

  doc.setDrawColor(...ATTENDANCE_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "S");
  for (let i = 1; i < IND_COLS.length; i += 1) {
    doc.line(IND_COLS[i].x, y, IND_COLS[i].x, y + height);
  }

  const centerY = y + height / 2;

  // Data
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.textPrimary);
  doc.text(row.dateLabel, IND_COLS[0].x + 2.5, centerY + 1.0, {
    align: "left",
  });

  // Dia da semana
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.textSecondary);
  doc.text(
    row.weekdayLabel,
    IND_COLS[1].x + IND_COLS[1].width / 2,
    centerY + 1.0,
    { align: "center" }
  );

  // Horário
  doc.setFont("courier", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.textPrimary);
  doc.text(
    row.timeLabel,
    IND_COLS[2].x + IND_COLS[2].width / 2,
    centerY + 1.0,
    { align: "center" }
  );

  // Pill Status
  drawStatusPill(
    doc,
    row.statusLabel,
    row.status,
    IND_COLS[3].x + IND_COLS[3].width / 2,
    centerY
  );

  // Observação
  const noteBlockH = noteLines.length * 3.4;
  const noteStartY = y + (height - noteBlockH) / 2 + 2.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.3);
  doc.setTextColor(
    ...(row.status === "ABSENT"
      ? ATTENDANCE_PDF_COLORS.negativeValue
      : row.notes === "—"
        ? ATTENDANCE_PDF_COLORS.textSecondary
        : ATTENDANCE_PDF_COLORS.textPrimary)
  );
  noteLines.forEach((line, idx) => {
    doc.text(line, IND_COLS[4].x + 2.5, noteStartY + idx * 3.4, {
      align: "left",
    });
  });
}

export async function exportIndividualAttendanceToPdf({
  memberSummary,
  teamName,
  seasonLabel,
  period = "ALL",
}: ExportIndividualAttendancePdfParams): Promise<{
  filename: string;
  pageCount: number;
}> {
  if (memberSummary.totalTrainings === 0) {
    throw new Error(
      "Não há registros de treino para gerar o relatório deste integrante."
    );
  }

  const data = buildIndividualAttendancePdfData({
    memberSummary,
    teamName,
    seasonLabel,
    period,
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

  let cursorY = drawIndividualHeader(doc, data, true);
  let visualIndex = 0;

  for (const row of data.rows) {
    const measured = measureIndividualRow(doc, row);
    if (cursorY + measured.height > CONTENT_BOTTOM) {
      doc.addPage("a4", "portrait");
      cursorY = drawIndividualHeader(doc, data, false);
      visualIndex = 0;
    }
    drawIndividualRow(doc, row, cursorY, visualIndex, measured);
    cursorY += measured.height;
    visualIndex += 1;
  }

  // Barra consolidada final
  if (cursorY + 8 > CONTENT_BOTTOM) {
    doc.addPage("a4", "portrait");
    cursorY = drawIndividualHeader(doc, data, false);
  }
  const summaryH = 7.6;
  doc.setFillColor(...ATTENDANCE_PDF_COLORS.finalBalanceBg);
  doc.setDrawColor(...ATTENDANCE_PDF_COLORS.brandBlue);
  doc.setLineWidth(0.35);
  doc.rect(MARGIN_X, cursorY, CONTENT_WIDTH, summaryH, "FD");
  const baselineY = cursorY + summaryH / 2 + 1.1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.brandNavy);
  doc.text("C O N S O L I D A D O", MARGIN_X + 2.5, baselineY, {
    align: "left",
  });
  doc.text(
    `Treinos: ${data.totalTrainings}  •  Presenças: ${data.presencesCount}  •  Faltas: ${data.absencesCount}  •  Frequência: ${data.attendanceRateLabel}`,
    MARGIN_X + CONTENT_WIDTH - 2.5,
    baselineY,
    { align: "right" }
  );

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawPageFooter(
      doc,
      page,
      pageCount,
      data.teamDisplayName,
      `Relatório Individual — ${data.memberName}`,
      formattedDate
    );
  }

  const filename = buildIndividualAttendancePdfFilename(
    data.memberName,
    data.teamDisplayName,
    now
  );
  doc.save(filename);

  return { filename, pageCount };
}

// ============================================================================
// RELATÓRIO GERAL DE PRESENÇA DA EQUIPE (PDF)
// ============================================================================

const TEAM_MEMBER_COLS = [
  { key: "name", label: "INTEGRANTE", x: MARGIN_X, width: 64, align: "left" as const },
  { key: "sector", label: "SETOR", x: MARGIN_X + 64, width: 34, align: "left" as const },
  { key: "total", label: "TREINOS", x: MARGIN_X + 98, width: 20, align: "center" as const },
  { key: "presences", label: "PRESENÇAS", x: MARGIN_X + 118, width: 22, align: "center" as const },
  { key: "absences", label: "FALTAS", x: MARGIN_X + 140, width: 20, align: "center" as const },
  { key: "rate", label: "FREQUÊNCIA", x: MARGIN_X + 160, width: 26, align: "center" as const },
];

const TEAM_DAILY_COLS = [
  { key: "date", label: "DATA", x: MARGIN_X, width: 34, align: "left" as const },
  { key: "presences", label: "PRESENTES", x: MARGIN_X + 34, width: 22, align: "center" as const },
  { key: "absences", label: "FALTAS", x: MARGIN_X + 56, width: 18, align: "center" as const },
  { key: "rate", label: "TAXA", x: MARGIN_X + 74, width: 20, align: "center" as const },
  { key: "absentNames", label: "AUSENTES NO DIA", x: MARGIN_X + 94, width: 92, align: "left" as const },
];

function drawTeamTopHeader(doc: jsPDF, data: TeamAttendancePdfData): number {
  let cursorY = drawBicolorBanner(
    doc,
    "Relatório Geral de Presença nos Treinos",
    data.teamDisplayName
  );

  cursorY += 4.6;
  doc.setFontSize(7.6);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.textPrimary);

  doc.setFont("helvetica", "bold");
  doc.text("Período:", MARGIN_X, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(data.periodLabel, MARGIN_X + 13.5, cursorY);

  doc.setFont("helvetica", "bold");
  doc.text("Treinos:", MARGIN_X + 58, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.totalTrainingDays), MARGIN_X + 71, cursorY);

  doc.setFont("helvetica", "bold");
  doc.text("Presenças:", MARGIN_X + 86, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.totalPresences), MARGIN_X + 104, cursorY);

  doc.setFont("helvetica", "bold");
  doc.text("Faltas:", MARGIN_X + 120, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(String(data.totalAbsences), MARGIN_X + 131, cursorY);

  doc.setFont("helvetica", "bold");
  doc.text(
    `Frequência: ${data.overallAttendanceRateLabel}`,
    MARGIN_X + CONTENT_WIDTH,
    cursorY,
    { align: "right" }
  );

  return cursorY + 3.5;
}

function drawSectionTableHeader(
  doc: jsPDF,
  y: number,
  sectionTitle: string,
  cols: ReadonlyArray<{
    label: string;
    x: number;
    width: number;
    align: "left" | "center";
  }>
): number {
  const sectionH = 6.0;
  doc.setFillColor(...ATTENDANCE_PDF_COLORS.sectionBarBg);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, sectionH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.brandBlue);
  doc.text(sectionTitle, MARGIN_X + 2, y + 4.2, { align: "left" });

  const headerY = y + sectionH + 1.2;
  const headerH = 7.4;
  const accentH = 0.8;

  doc.setFillColor(...ATTENDANCE_PDF_COLORS.brandBlue);
  doc.rect(MARGIN_X, headerY, CONTENT_WIDTH, headerH, "F");
  doc.setFillColor(...ATTENDANCE_PDF_COLORS.brandYellow);
  doc.rect(MARGIN_X, headerY + headerH, CONTENT_WIDTH, accentH, "F");

  doc.setDrawColor(...ATTENDANCE_PDF_COLORS.brandNavy);
  doc.setLineWidth(0.25);
  for (let i = 1; i < cols.length; i += 1) {
    doc.line(cols[i].x, headerY, cols[i].x, headerY + headerH);
  }
  doc.rect(MARGIN_X, headerY, CONTENT_WIDTH, headerH + accentH, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.1);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.white);
  const labelY = headerY + headerH / 2 + 1.0;

  for (const col of cols) {
    if (col.align === "center") {
      doc.text(col.label, col.x + col.width / 2, labelY, { align: "center" });
    } else {
      doc.text(col.label, col.x + 2.2, labelY, { align: "left" });
    }
  }

  return headerY + headerH + accentH;
}

function drawTeamMemberRow(
  doc: jsPDF,
  row: TeamAttendanceMemberPdfRow,
  y: number,
  rowIndex: number
): number {
  const height = 7.8;
  const bg =
    rowIndex % 2 === 0
      ? ATTENDANCE_PDF_COLORS.rowEvenBg
      : ATTENDANCE_PDF_COLORS.rowOddBg;

  doc.setFillColor(...bg);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "F");

  doc.setDrawColor(...ATTENDANCE_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "S");
  for (let i = 1; i < TEAM_MEMBER_COLS.length; i += 1) {
    doc.line(
      TEAM_MEMBER_COLS[i].x,
      y,
      TEAM_MEMBER_COLS[i].x,
      y + height
    );
  }

  const baselineY = y + height / 2 + 1.0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.textPrimary);
  doc.text(row.userName, TEAM_MEMBER_COLS[0].x + 2.2, baselineY, {
    align: "left",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.textSecondary);
  doc.text(row.sectorLabel, TEAM_MEMBER_COLS[1].x + 2.2, baselineY, {
    align: "left",
  });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.textPrimary);
  doc.text(
    String(row.totalTrainings),
    TEAM_MEMBER_COLS[2].x + TEAM_MEMBER_COLS[2].width / 2,
    baselineY,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ATTENDANCE_PDF_BADGE_STYLES.PRESENT.text);
  doc.text(
    String(row.presencesCount),
    TEAM_MEMBER_COLS[3].x + TEAM_MEMBER_COLS[3].width / 2,
    baselineY,
    { align: "center" }
  );

  doc.setTextColor(
    ...(row.absencesCount > 0
      ? ATTENDANCE_PDF_COLORS.negativeValue
      : ATTENDANCE_PDF_COLORS.textSecondary)
  );
  doc.text(
    String(row.absencesCount),
    TEAM_MEMBER_COLS[4].x + TEAM_MEMBER_COLS[4].width / 2,
    baselineY,
    { align: "center" }
  );

  doc.setTextColor(...ATTENDANCE_PDF_COLORS.brandNavy);
  doc.text(
    row.attendanceRateLabel,
    TEAM_MEMBER_COLS[5].x + TEAM_MEMBER_COLS[5].width / 2,
    baselineY,
    { align: "center" }
  );

  return y + height;
}

function measureDailyRow(
  doc: jsPDF,
  row: TeamAttendanceDailyPdfRow
): { height: number; absentLines: string[] } {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.1);
  const absentLines = doc.splitTextToSize(
    row.absentNames,
    TEAM_DAILY_COLS[4].width - 4.4
  ) as string[];
  const height = Math.max(8.0, absentLines.length * 3.3 + 2.8);
  return { height, absentLines };
}

function drawTeamDailyRow(
  doc: jsPDF,
  row: TeamAttendanceDailyPdfRow,
  y: number,
  rowIndex: number,
  measured: { height: number; absentLines: string[] }
): number {
  const { height, absentLines } = measured;
  const bg =
    rowIndex % 2 === 0
      ? ATTENDANCE_PDF_COLORS.rowEvenBg
      : ATTENDANCE_PDF_COLORS.rowOddBg;

  doc.setFillColor(...bg);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "F");

  doc.setDrawColor(...ATTENDANCE_PDF_COLORS.dividerLine);
  doc.setLineWidth(0.25);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, "S");
  for (let i = 1; i < TEAM_DAILY_COLS.length; i += 1) {
    doc.line(TEAM_DAILY_COLS[i].x, y, TEAM_DAILY_COLS[i].x, y + height);
  }

  const centerY = y + height / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.3);
  doc.setTextColor(...ATTENDANCE_PDF_COLORS.textPrimary);
  doc.text(
    `${row.dateLabel} (${row.weekdayLabel})`,
    TEAM_DAILY_COLS[0].x + 2.2,
    centerY + 1.0,
    { align: "left" }
  );

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ATTENDANCE_PDF_BADGE_STYLES.PRESENT.text);
  doc.text(
    String(row.presencesCount),
    TEAM_DAILY_COLS[1].x + TEAM_DAILY_COLS[1].width / 2,
    centerY + 1.0,
    { align: "center" }
  );

  doc.setTextColor(
    ...(row.absencesCount > 0
      ? ATTENDANCE_PDF_COLORS.negativeValue
      : ATTENDANCE_PDF_COLORS.textSecondary)
  );
  doc.text(
    String(row.absencesCount),
    TEAM_DAILY_COLS[2].x + TEAM_DAILY_COLS[2].width / 2,
    centerY + 1.0,
    { align: "center" }
  );

  doc.setTextColor(...ATTENDANCE_PDF_COLORS.brandNavy);
  doc.text(
    row.attendanceRateLabel,
    TEAM_DAILY_COLS[3].x + TEAM_DAILY_COLS[3].width / 2,
    centerY + 1.0,
    { align: "center" }
  );

  const textBlockH = absentLines.length * 3.3;
  const startY = y + (height - textBlockH) / 2 + 2.4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.1);
  doc.setTextColor(
    ...(row.absencesCount > 0
      ? ATTENDANCE_PDF_COLORS.textPrimary
      : ATTENDANCE_PDF_BADGE_STYLES.PRESENT.text)
  );
  absentLines.forEach((line, idx) => {
    doc.text(line, TEAM_DAILY_COLS[4].x + 2.2, startY + idx * 3.3, {
      align: "left",
    });
  });

  return y + height;
}

export async function exportTeamAttendanceToPdf({
  analytics,
  teamName,
  seasonLabel,
  period = "ALL",
}: ExportTeamAttendancePdfParams): Promise<{
  filename: string;
  pageCount: number;
}> {
  if (analytics.totalTrainingDays === 0) {
    throw new Error(
      "Não há treinos registrados para exportar o relatório geral."
    );
  }

  const data = buildTeamAttendancePdfData({
    analytics,
    teamName,
    seasonLabel,
    period,
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

  let cursorY = drawTeamTopHeader(doc, data);
  cursorY = drawSectionTableHeader(
    doc,
    cursorY,
    "Resumo por Integrante",
    TEAM_MEMBER_COLS
  );

  let visualIndex = 0;
  for (const memberRow of data.memberRows) {
    if (cursorY + 7.8 > CONTENT_BOTTOM) {
      doc.addPage("a4", "portrait");
      cursorY = drawTeamTopHeader(doc, data);
      cursorY = drawSectionTableHeader(
        doc,
        cursorY,
        "Resumo por Integrante",
        TEAM_MEMBER_COLS
      );
      visualIndex = 0;
    }
    cursorY = drawTeamMemberRow(doc, memberRow, cursorY, visualIndex);
    visualIndex += 1;
  }

  // Seção 2: Histórico por Dia de Treino
  cursorY += 5.5;
  if (cursorY + 24 > CONTENT_BOTTOM) {
    doc.addPage("a4", "portrait");
    cursorY = drawTeamTopHeader(doc, data);
  }

  cursorY = drawSectionTableHeader(
    doc,
    cursorY,
    "Histórico por Dia de Treino",
    TEAM_DAILY_COLS
  );

  visualIndex = 0;
  for (const dailyRow of data.dailyRows) {
    const measured = measureDailyRow(doc, dailyRow);
    if (cursorY + measured.height > CONTENT_BOTTOM) {
      doc.addPage("a4", "portrait");
      cursorY = drawTeamTopHeader(doc, data);
      cursorY = drawSectionTableHeader(
        doc,
        cursorY,
        "Histórico por Dia de Treino",
        TEAM_DAILY_COLS
      );
      visualIndex = 0;
    }
    cursorY = drawTeamDailyRow(doc, dailyRow, cursorY, visualIndex, measured);
    visualIndex += 1;
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawPageFooter(
      doc,
      page,
      pageCount,
      data.teamDisplayName,
      "Relatório Geral de Presença nos Treinos",
      formattedDate
    );
  }

  const filename = buildTeamAttendancePdfFilename(data.teamDisplayName, now);
  doc.save(filename);

  return { filename, pageCount };
}
