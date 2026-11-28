import type { TaskStatus } from "@prisma/client";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import type { AppLocale } from "@/lib/i18n/locale-types";
import { translateUiText } from "@/lib/i18n/translations";
import {
  dayLabel,
  edgeKey,
  formatTaskDate,
  pathEdges,
  scheduleConflict,
  taskDay,
} from "@/lib/task-schedule";
import type { TaskEdge, TaskRecord, TaskRisk } from "@/types/tasks";

export type RgbColor = readonly [number, number, number];

export interface GanttPdfBarStyle {
  fill: RgbColor;
  stroke: RgbColor;
  text: RgbColor;
  strokeWidth: number;
}

/**
 * Paleta Azul e Amarelo alinhada ao PDF da WBS,
 * adaptada para os estados de tarefas do Gantt.
 */
export const GANTT_PDF_PALETTE = {
  headerFill: [15, 61, 140] as RgbColor, // Azul marinho profundo (#0F3D8C)
  headerStroke: [10, 42, 102] as RgbColor,
  headerText: [255, 255, 255] as RgbColor,
  timelineHeaderFill: [29, 95, 214] as RgbColor, // Azul principal (#1D5FD6)
  timelineMonthFill: [15, 61, 140] as RgbColor, // Azul marinho para faixa de meses
  timelineHeaderText: [255, 255, 255] as RgbColor,
  rowEvenFill: [255, 255, 255] as RgbColor,
  rowOddFill: [248, 250, 252] as RgbColor,
  gridLine: [226, 232, 240] as RgbColor,
  tableBorder: [191, 219, 254] as RgbColor,
  labelTitle: [15, 41, 82] as RgbColor,
  labelMeta: [100, 116, 139] as RgbColor,
  connector: [51, 65, 85] as RgbColor,
  connectorHighlighted: [15, 61, 140] as RgbColor,
  connectorConflict: [220, 38, 38] as RgbColor,
  highlightRing: [245, 196, 40] as RgbColor,
  mutedText: [100, 116, 139] as RgbColor,
} as const;

export const GANTT_PDF_STATUS_STYLES: Record<TaskStatus, GanttPdfBarStyle> = {
  TODO: {
    fill: [239, 246, 255], // Azul claríssimo (#EFF6FF)
    stroke: [29, 95, 214], // Borda azul principal (#1D5FD6)
    text: [15, 41, 82],
    strokeWidth: 0.42,
  },
  IN_PROGRESS: {
    fill: [245, 196, 40], // Amarelo ouro (#F5C428)
    stroke: [202, 152, 14],
    text: [15, 41, 82],
    strokeWidth: 0.42,
  },
  DONE: {
    fill: [29, 95, 214], // Azul principal (#1D5FD6)
    stroke: [15, 61, 140],
    text: [255, 255, 255],
    strokeWidth: 0.42,
  },
  CANCELLED: {
    fill: [241, 245, 249], // Cinza claro neutro
    stroke: [148, 163, 184],
    text: [100, 116, 139],
    strokeWidth: 0.38,
  },
};

export const GANTT_PDF_PAGE = {
  minWidth: 297, // Mínimo A4 Paisagem (mm) — expande na horizontal conforme necessário
  minHeight: 210, // Mínimo A4 Paisagem (mm) — expande na vertical conforme necessário
  marginX: 14,
  marginTop: 14,
  marginBottom: 18,
  labelColWidth: 64,
  rowHeight: 11.5,
  barHeight: 7,
  barCornerRadius: 3.2, // Curvas arredondadas nas barras de tarefas
  minBarWidth: 12,
  bannerHeight: 12,
  legendHeight: 8.5,
  monthHeaderHeight: 6.5,
  tickHeaderHeight: 7,
} as const;

export interface GanttPdfMonthSpan {
  label: string;
  x: number;
  width: number;
}

export interface GanttPdfTick {
  label: string;
  x: number;
  day: number;
}

export interface GanttPdfRow {
  id: string;
  index: number;
  title: string;
  sectorLabel: string;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  rowY: number;
  barX: number;
  barY: number;
  barWidth: number;
  barHeight: number;
  cornerRadius: number;
  highlighted: boolean;
  hasConflict: boolean;
}

export interface GanttPdfConnector {
  predecessorId: string;
  successorId: string;
  points: { x: number; y: number }[];
  highlighted: boolean;
  conflict: boolean;
}

export interface GanttPdfLayoutResult {
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
  title: string;
  periodLabel: string;
  banner: {
    x: number;
    y: number;
    width: number;
    height: number;
    chamfer: number;
  };
  legendY: number;
  tableX: number;
  tableY: number;
  tableWidth: number;
  tableHeight: number;
  timelineX: number;
  timelineWidth: number;
  months: GanttPdfMonthSpan[];
  ticks: GanttPdfTick[];
  rows: GanttPdfRow[];
  connectors: GanttPdfConnector[];
}

export interface ComputeGanttPdfLayoutParams {
  tasks: TaskRecord[];
  edges?: TaskEdge[];
  highlightedPath?: TaskRisk;
  teamName?: string;
  locale?: AppLocale;
}

const MONTH_ABBR_PT = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
] as const;

const MONTH_ABBR_EN = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

function resolveTimelineScale(spanDays: number): { dayWidth: number; tickStep: number } {
  if (spanDays <= 35) return { dayWidth: 8.5, tickStep: 1 };
  if (spanDays <= 75) return { dayWidth: 5.8, tickStep: 2 };
  if (spanDays <= 140) return { dayWidth: 4.0, tickStep: 7 };
  return { dayWidth: 2.8, tickStep: 14 };
}

function buildMonthSpans(
  fromDay: number,
  spanDays: number,
  timelineX: number,
  dayWidth: number,
  locale: AppLocale = "pt-BR"
): GanttPdfMonthSpan[] {
  const monthAbbr = locale === "en-US" ? MONTH_ABBR_EN : MONTH_ABBR_PT;
  const spans: GanttPdfMonthSpan[] = [];
  let currentKey = "";
  let currentStartOffset = 0;

  for (let offset = 0; offset < spanDays; offset += 1) {
    const iso = dayLabel(fromDay + offset);
    const [year, month] = iso.split("-");
    const key = `${year}-${month}`;

    if (key !== currentKey) {
      if (currentKey) {
        const [prevYear, prevMonth] = currentKey.split("-");
        const monthIdx = Math.max(0, Math.min(11, Number.parseInt(prevMonth, 10) - 1));
        spans.push({
          label: `${monthAbbr[monthIdx]} ${prevYear}`,
          x: timelineX + currentStartOffset * dayWidth,
          width: (offset - currentStartOffset) * dayWidth,
        });
      }
      currentKey = key;
      currentStartOffset = offset;
    }
  }

  if (currentKey) {
    const [lastYear, lastMonth] = currentKey.split("-");
    const monthIdx = Math.max(0, Math.min(11, Number.parseInt(lastMonth, 10) - 1));
    spans.push({
      label: `${monthAbbr[monthIdx]} ${lastYear}`,
      x: timelineX + currentStartOffset * dayWidth,
      width: (spanDays - currentStartOffset) * dayWidth,
    });
  }

  return spans;
}

function buildConnectorPoints(
  source: GanttPdfRow,
  target: GanttPdfRow
): { x: number; y: number }[] {
  const x1 = source.barX + source.barWidth;
  const y1 = source.barY + source.barHeight / 2;
  const x2 = target.barX;
  const y2 = target.barY + target.barHeight / 2;

  if (x2 >= x1 + 4) {
    const midX = x1 + (x2 - x1) / 2;
    return [
      { x: x1, y: y1 },
      { x: midX, y: y1 },
      { x: midX, y: y2 },
      { x: x2, y: y2 },
    ];
  }

  const outX = x1 + 3.2;
  const inX = Math.max(GANTT_PDF_PAGE.marginX + GANTT_PDF_PAGE.labelColWidth + 1.5, x2 - 3.2);
  const midY = y1 < y2 ? source.rowY + GANTT_PDF_PAGE.rowHeight : source.rowY;

  return [
    { x: x1, y: y1 },
    { x: outX, y: y1 },
    { x: outX, y: midY },
    { x: inX, y: midY },
    { x: inX, y: y2 },
    { x: x2, y: y2 },
  ];
}

/**
 * Calcula o layout vetorial completo do Cronograma de Gantt em PÁGINA ÚNICA,
 * expandindo dinamicamente a largura horizontal e a altura vertical para
 * comportar todas as tarefas com barras de curvas arredondadas e dependências.
 */
export function computeGanttPdfLayout({
  tasks,
  edges = [],
  highlightedPath,
  teamName,
  locale = "pt-BR",
}: ComputeGanttPdfLayoutParams): GanttPdfLayoutResult {
  const isEn = locale === "en-US";
  if (tasks.length === 0) {
    return {
      pageCount: 0,
      pageWidth: 0,
      pageHeight: 0,
      title: "",
      periodLabel: "",
      banner: { x: 0, y: 0, width: 0, height: 0, chamfer: 0 },
      legendY: 0,
      tableX: 0,
      tableY: 0,
      tableWidth: 0,
      tableHeight: 0,
      timelineX: 0,
      timelineWidth: 0,
      months: [],
      ticks: [],
      rows: [],
      connectors: [],
    };
  }

  const ranges = tasks.map((task) => ({
    task,
    start: taskDay(task.startDate),
    end: taskDay(task.endDate),
  }));

  const fromDay = ranges.reduce((min, item) => Math.min(min, item.start), ranges[0].start);
  const toDay = ranges.reduce((max, item) => Math.max(max, item.end), ranges[0].end);
  const spanDays = Math.max(1, toDay - fromDay + 1);

  const { dayWidth: baseDayWidth, tickStep } = resolveTimelineScale(spanDays);
  const minTimelineWidth =
    GANTT_PDF_PAGE.minWidth - GANTT_PDF_PAGE.marginX * 2 - GANTT_PDF_PAGE.labelColWidth;

  // Expande na horizontal quando necessário; se curto, preenche a largura mínima A4 Paisagem
  const rawTimelineWidth = spanDays * baseDayWidth + 14;
  const timelineWidth = Number(Math.max(minTimelineWidth, rawTimelineWidth).toFixed(2));
  const dayWidth = (timelineWidth - 14) / spanDays;

  const tableWidth = Number((GANTT_PDF_PAGE.labelColWidth + timelineWidth).toFixed(2));
  const pageWidth = Number(
    Math.max(GANTT_PDF_PAGE.minWidth, tableWidth + GANTT_PDF_PAGE.marginX * 2).toFixed(2)
  );

  const tableX = (pageWidth - tableWidth) / 2;
  const timelineX = tableX + GANTT_PDF_PAGE.labelColWidth;

  // Banner superior no estilo WBS
  const scheduleTitle = isEn ? "Gantt Schedule" : "Cronograma de Gantt";
  const title = teamName?.trim()
    ? `${teamName.trim()} — ${scheduleTitle}`
    : scheduleTitle;
  const bannerWidth = Math.min(Math.max(130, tableWidth * 0.45), 220);
  const banner = {
    x: (pageWidth - bannerWidth) / 2,
    y: GANTT_PDF_PAGE.marginTop,
    width: bannerWidth,
    height: GANTT_PDF_PAGE.bannerHeight,
    chamfer: 3.2,
  };

  const legendY = banner.y + banner.height + 5.5;
  const tableY = legendY + GANTT_PDF_PAGE.legendHeight;
  const headerTotalHeight = GANTT_PDF_PAGE.monthHeaderHeight + GANTT_PDF_PAGE.tickHeaderHeight;
  const rowsStartY = tableY + headerTotalHeight;

  const highlightedTasks = new Set(highlightedPath?.taskIds ?? []);
  const highlightedEdges = new Set(
    pathEdges(highlightedPath?.taskIds ?? []).map(edgeKey)
  );

  const byId = new Map(tasks.map((task) => [task.id, task]));
  const visibleIds = new Set(tasks.map((task) => task.id));
  const visibleEdges = edges.filter(
    (edge) => visibleIds.has(edge.predecessorId) && visibleIds.has(edge.successorId)
  );

  const conflictTaskIds = new Set(
    visibleEdges
      .filter((edge) => {
        const pred = byId.get(edge.predecessorId);
        const succ = byId.get(edge.successorId);
        return pred && succ && scheduleConflict(pred.endDate, succ.startDate);
      })
      .map((edge) => edge.successorId)
  );

  const rows: GanttPdfRow[] = ranges.map(({ task, start, end }, index) => {
    const rowY = rowsStartY + index * GANTT_PDF_PAGE.rowHeight;
    const rawBarWidth = (end - start + 1) * dayWidth;
    const barWidth = Number(Math.max(GANTT_PDF_PAGE.minBarWidth, rawBarWidth).toFixed(2));
    const barX = Number((timelineX + (start - fromDay) * dayWidth).toFixed(2));
    const barY = Number(
      (rowY + (GANTT_PDF_PAGE.rowHeight - GANTT_PDF_PAGE.barHeight) / 2).toFixed(2)
    );

    const rawSector = DELIVERY_GROUP_LABELS[task.deliveryGroup] || task.deliveryGroup;
    return {
      id: task.id,
      index,
      title: task.title,
      sectorLabel: isEn ? translateUiText(rawSector, locale) : rawSector,
      status: task.status,
      startDate: task.startDate,
      endDate: task.endDate,
      rowY,
      barX,
      barY,
      barWidth,
      barHeight: GANTT_PDF_PAGE.barHeight,
      cornerRadius: GANTT_PDF_PAGE.barCornerRadius,
      highlighted: highlightedTasks.has(task.id),
      hasConflict: conflictTaskIds.has(task.id),
    };
  });

  const rowById = new Map(rows.map((row) => [row.id, row]));
  const connectors: GanttPdfConnector[] = [];

  for (const edge of visibleEdges) {
    const source = rowById.get(edge.predecessorId);
    const target = rowById.get(edge.successorId);
    if (!source || !target) continue;

    connectors.push({
      predecessorId: edge.predecessorId,
      successorId: edge.successorId,
      points: buildConnectorPoints(source, target),
      highlighted: highlightedEdges.has(edgeKey(edge)),
      conflict: scheduleConflict(source.endDate, target.startDate),
    });
  }

  const months = buildMonthSpans(fromDay, spanDays, timelineX, dayWidth, locale);
  const ticks: GanttPdfTick[] = [];
  for (let offset = 0; offset < spanDays; offset += tickStep) {
    const day = fromDay + offset;
    ticks.push({
      day,
      label: formatTaskDate(dayLabel(day)).slice(0, 5),
      x: Number((timelineX + offset * dayWidth).toFixed(2)),
    });
  }

  const tableHeight = headerTotalHeight + rows.length * GANTT_PDF_PAGE.rowHeight;
  const pageHeight = Number(
    Math.max(
      GANTT_PDF_PAGE.minHeight,
      tableY + tableHeight + GANTT_PDF_PAGE.marginBottom
    ).toFixed(2)
  );

  const taskUnit = isEn
    ? tasks.length === 1
      ? "task"
      : "tasks"
    : tasks.length === 1
      ? "tarefa"
      : "tarefas";
  const periodLabel = `${formatTaskDate(dayLabel(fromDay))} — ${formatTaskDate(dayLabel(toDay))} • ${tasks.length} ${taskUnit}`;

  return {
    pageCount: 1,
    pageWidth,
    pageHeight,
    title,
    periodLabel,
    banner,
    legendY,
    tableX,
    tableY,
    tableWidth,
    tableHeight,
    timelineX,
    timelineWidth,
    months,
    ticks,
    rows,
    connectors,
  };
}

/**
 * Gera um nome de arquivo sanitizado e padronizado para o PDF do Gantt.
 */
export function buildGanttPdfFilename(
  teamName?: string,
  date = new Date(),
  locale: AppLocale = "pt-BR"
): string {
  const slug =
    (teamName || "equipe")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "equipe";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const prefix = locale === "en-US" ? "gantt-schedule" : "gantt";

  return `${prefix}-${slug}-${yyyy}-${mm}-${dd}.pdf`;
}
