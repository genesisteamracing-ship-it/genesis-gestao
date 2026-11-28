import { z } from "zod";
import type { AttendancePeriodFilter } from "@/types/attendance";

export const ATTENDANCE_PERIOD_VALUES = [
  "ALL",
  "LAST_7_DAYS",
  "LAST_30_DAYS",
  "CURRENT_MONTH",
] as const;

export const ATTENDANCE_REPORT_FORMAT_VALUES = ["PDF", "CSV"] as const;

export const ATTENDANCE_PERIOD_LABELS: Record<AttendancePeriodFilter, string> = {
  ALL: "Todo o histórico",
  LAST_7_DAYS: "Últimos 7 dias",
  LAST_30_DAYS: "Últimos 30 dias",
  CURRENT_MONTH: "Mês atual",
};

export const individualAttendanceReportSchema = z.object({
  memberId: z.string().min(1, "Selecione um integrante."),
  period: z.enum(ATTENDANCE_PERIOD_VALUES),
  format: z.enum(ATTENDANCE_REPORT_FORMAT_VALUES),
});

export type IndividualAttendanceReportInput = z.infer<
  typeof individualAttendanceReportSchema
>;
