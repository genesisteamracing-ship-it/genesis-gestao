import type { AppLocale } from "@/lib/i18n/locale-types";
import { translateUiText } from "@/lib/i18n/translations";
import {
  formatIsoDateBR,
  formatTimeBR,
  formatWeekdayShortBR,
  getAttendanceSectorLabel,
} from "@/lib/training-attendance";
import { ATTENDANCE_PERIOD_LABELS } from "@/lib/validations/attendance";
import type {
  AttendanceAnalyticsDTO,
  AttendancePeriodFilter,
  AttendanceStatus,
  MemberAttendanceSummaryDTO,
} from "@/types/attendance";
import {
  STATEMENT_PDF_COLORS,
  type RgbColor,
} from "./financial-statement-pdf-layout";

export const ATTENDANCE_PDF_COLORS = STATEMENT_PDF_COLORS;

export const ATTENDANCE_PDF_BADGE_STYLES: Record<
  AttendanceStatus,
  { fill: RgbColor; border: RgbColor; text: RgbColor }
> = {
  PRESENT: {
    fill: [236, 253, 245],
    border: [5, 150, 105],
    text: [4, 120, 87],
  },
  ABSENT: {
    fill: [254, 242, 242],
    border: [220, 38, 38],
    text: [185, 28, 28],
  },
};

export interface IndividualAttendancePdfRow {
  dateLabel: string;
  weekdayLabel: string;
  timeLabel: string;
  status: AttendanceStatus;
  statusLabel: "Presente" | "Falta" | "Present" | "Absent";
  notes: string;
}

export interface IndividualAttendancePdfData {
  teamDisplayName: string;
  seasonLabel: string;
  periodLabel: string;
  memberName: string;
  memberEmail: string;
  sectorLabel: string;
  jobTitleLabel: string;
  totalTrainings: number;
  presencesCount: number;
  absencesCount: number;
  attendanceRateLabel: string;
  rows: IndividualAttendancePdfRow[];
}

export interface TeamAttendanceMemberPdfRow {
  userName: string;
  sectorLabel: string;
  totalTrainings: number;
  presencesCount: number;
  absencesCount: number;
  attendanceRateLabel: string;
}

export interface TeamAttendanceDailyPdfRow {
  dateLabel: string;
  weekdayLabel: string;
  presencesCount: number;
  absencesCount: number;
  attendanceRateLabel: string;
  absentNames: string;
}

export interface TeamAttendancePdfData {
  teamDisplayName: string;
  seasonLabel: string;
  periodLabel: string;
  totalTrainingDays: number;
  totalTrackedMembers: number;
  totalPresences: number;
  totalAbsences: number;
  overallAttendanceRateLabel: string;
  memberRows: TeamAttendanceMemberPdfRow[];
  dailyRows: TeamAttendanceDailyPdfRow[];
}

function slugifyText(value: string | undefined, fallback: string): string {
  const slug = (value || fallback)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function formatDateStamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const ATTENDANCE_PERIOD_LABELS_EN: Record<AttendancePeriodFilter, string> = {
  ALL: "All history",
  LAST_7_DAYS: "Last 7 days",
  LAST_30_DAYS: "Last 30 days",
  CURRENT_MONTH: "Current month",
};

const WEEKDAY_PT_TO_EN: Readonly<Record<string, string>> = {
  Dom: "Sun",
  Seg: "Mon",
  Ter: "Tue",
  Qua: "Wed",
  Qui: "Thu",
  Sex: "Fri",
  "Sáb": "Sat",
};

function formatWeekdayForLocale(isoDate: string, locale: AppLocale): string {
  const pt = formatWeekdayShortBR(isoDate);
  if (locale === "pt-BR") return pt;
  return WEEKDAY_PT_TO_EN[pt] ?? pt;
}

export function buildIndividualAttendancePdfData({
  memberSummary,
  teamName,
  seasonLabel,
  period = "ALL",
  locale = "pt-BR",
}: {
  memberSummary: MemberAttendanceSummaryDTO;
  teamName?: string;
  seasonLabel?: string;
  period?: AttendancePeriodFilter;
  locale?: AppLocale;
}): IndividualAttendancePdfData {
  const isEn = locale === "en-US";
  const teamDisplayName = teamName?.trim() || "Equipe Gênesis";
  const rawSeason =
    seasonLabel?.trim() || (isEn ? "Current Season" : "Temporada Atual");
  const resolvedSeason = isEn ? translateUiText(rawSeason, locale) : rawSeason;
  const periodLabel = isEn
    ? ATTENDANCE_PERIOD_LABELS_EN[period] ?? "All history"
    : ATTENDANCE_PERIOD_LABELS[period] ?? "Todo o histórico";

  const rows: IndividualAttendancePdfRow[] = [...memberSummary.records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((record) => ({
      dateLabel: formatIsoDateBR(record.date),
      weekdayLabel: formatWeekdayForLocale(record.date, locale),
      timeLabel: formatTimeBR(record.checkedAt),
      status: record.status,
      statusLabel:
        record.status === "PRESENT"
          ? isEn
            ? "Present"
            : "Presente"
          : isEn
            ? "Absent"
            : "Falta",
      notes:
        record.status === "ABSENT"
          ? isEn
            ? "No check-in recorded"
            : "Sem registro de presença"
          : record.notes?.trim() || "—",
    }));

  const rawSector = getAttendanceSectorLabel(memberSummary.deliveryGroup);

  return {
    teamDisplayName,
    seasonLabel: resolvedSeason,
    periodLabel,
    memberName: memberSummary.userName,
    memberEmail: memberSummary.email || "—",
    sectorLabel: isEn ? translateUiText(rawSector, locale) : rawSector,
    jobTitleLabel:
      memberSummary.jobTitle?.trim() || (isEn ? "Member" : "Integrante"),
    totalTrainings: memberSummary.totalTrainings,
    presencesCount: memberSummary.presencesCount,
    absencesCount: memberSummary.absencesCount,
    attendanceRateLabel: `${memberSummary.attendanceRate.toFixed(1)}%`,
    rows,
  };
}

export function buildTeamAttendancePdfData({
  analytics,
  teamName,
  seasonLabel,
  period = "ALL",
  locale = "pt-BR",
}: {
  analytics: AttendanceAnalyticsDTO;
  teamName?: string;
  seasonLabel?: string;
  period?: AttendancePeriodFilter;
  locale?: AppLocale;
}): TeamAttendancePdfData {
  const isEn = locale === "en-US";
  const teamDisplayName = teamName?.trim() || "Equipe Gênesis";
  const rawSeason =
    seasonLabel?.trim() || (isEn ? "Current Season" : "Temporada Atual");
  const resolvedSeason = isEn ? translateUiText(rawSeason, locale) : rawSeason;
  const periodLabel = isEn
    ? ATTENDANCE_PERIOD_LABELS_EN[period] ?? "All history"
    : ATTENDANCE_PERIOD_LABELS[period] ?? "Todo o histórico";

  const memberRows: TeamAttendanceMemberPdfRow[] = analytics.memberSummaries.map(
    (member) => {
      const rawSector = getAttendanceSectorLabel(member.deliveryGroup);
      return {
        userName: member.userName,
        sectorLabel: isEn ? translateUiText(rawSector, locale) : rawSector,
        totalTrainings: member.totalTrainings,
        presencesCount: member.presencesCount,
        absencesCount: member.absencesCount,
        attendanceRateLabel: `${member.attendanceRate.toFixed(1)}%`,
      };
    }
  );

  const absentByDate = new Map<string, string[]>();
  for (const record of analytics.records) {
    if (record.status !== "ABSENT") continue;
    const list = absentByDate.get(record.date) ?? [];
    list.push(record.userName);
    absentByDate.set(record.date, list);
  }

  const dailyRows: TeamAttendanceDailyPdfRow[] = [...analytics.dailySeries]
    .reverse()
    .map((day) => {
      const absentList = (absentByDate.get(day.date) ?? []).sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      );
      return {
        dateLabel: day.fullDateLabel,
        weekdayLabel: formatWeekdayForLocale(day.date, locale),
        presencesCount: day.presences,
        absencesCount: day.absences,
        attendanceRateLabel: `${day.attendanceRate.toFixed(1)}%`,
        absentNames:
          absentList.length > 0
            ? absentList.join(", ")
            : isEn
              ? "All present"
              : "Todos presentes",
      };
    });

  return {
    teamDisplayName,
    seasonLabel: resolvedSeason,
    periodLabel,
    totalTrainingDays: analytics.totalTrainingDays,
    totalTrackedMembers: analytics.totalTrackedMembers,
    totalPresences: analytics.totalPresences,
    totalAbsences: analytics.totalAbsences,
    overallAttendanceRateLabel: `${analytics.overallAttendanceRate.toFixed(1)}%`,
    memberRows,
    dailyRows,
  };
}

export function buildIndividualAttendancePdfFilename(
  memberName: string,
  teamName?: string,
  date = new Date(),
  locale: AppLocale = "pt-BR"
): string {
  const memberSlug = slugifyText(memberName, "integrante");
  const teamSlug = slugifyText(teamName, "equipe-genesis");
  const prefix =
    locale === "en-US" ? "attendance-report" : "relatorio-presenca";
  return `${prefix}-${memberSlug}-${teamSlug}-${formatDateStamp(date)}.pdf`;
}

export function buildTeamAttendancePdfFilename(
  teamName?: string,
  date = new Date(),
  locale: AppLocale = "pt-BR"
): string {
  const teamSlug = slugifyText(teamName, "equipe-genesis");
  const prefix =
    locale === "en-US" ? "team-attendance-report" : "relatorio-presenca-geral";
  return `${prefix}-${teamSlug}-${formatDateStamp(date)}.pdf`;
}

export function buildIndividualAttendanceCsvData(
  memberSummary: MemberAttendanceSummaryDTO,
  date = new Date()
): {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
} {
  const memberSlug = slugifyText(memberSummary.userName, "integrante");
  const sector = getAttendanceSectorLabel(memberSummary.deliveryGroup);
  const headers = [
    "Data",
    "Dia",
    "Integrante",
    "Setor",
    "Horário",
    "Status",
    "Observação",
  ];

  const rows = [...memberSummary.records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((record) => [
      formatIsoDateBR(record.date),
      formatWeekdayShortBR(record.date),
      memberSummary.userName,
      sector,
      formatTimeBR(record.checkedAt),
      record.status === "PRESENT" ? "Presente" : "Falta",
      record.status === "ABSENT"
        ? "Sem registro de presença"
        : record.notes?.trim() || "",
    ]);

  return {
    filename: `historico-presenca-${memberSlug}-${formatDateStamp(date)}.csv`,
    headers,
    rows,
  };
}

export function buildTeamAttendanceCsvData(
  analytics: AttendanceAnalyticsDTO,
  teamName?: string,
  date = new Date()
): {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
} {
  const teamSlug = slugifyText(teamName, "equipe-genesis");
  const headers = [
    "Data",
    "Dia",
    "Integrante",
    "Setor",
    "Cargo",
    "Horário",
    "Status",
    "Observação",
  ];

  const rows = analytics.records.map((record) => [
    formatIsoDateBR(record.date),
    formatWeekdayShortBR(record.date),
    record.userName,
    getAttendanceSectorLabel(record.deliveryGroup),
    record.jobTitle || "Integrante",
    formatTimeBR(record.checkedAt),
    record.status === "PRESENT" ? "Presente" : "Falta",
    record.status === "ABSENT"
      ? "Sem registro de presença"
      : record.notes?.trim() || "",
  ]);

  return {
    filename: `relatorio-presenca-geral-${teamSlug}-${formatDateStamp(date)}.csv`,
    headers,
    rows,
  };
}
