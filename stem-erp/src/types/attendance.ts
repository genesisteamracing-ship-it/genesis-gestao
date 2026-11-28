import type { DeliveryGroup, UserRole } from "@prisma/client";

export type AttendanceStatus = "PRESENT" | "ABSENT";

export type AttendancePeriodFilter =
  | "ALL"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "CURRENT_MONTH";

export type AttendanceReportFormat = "PDF" | "CSV";

export interface AttendanceTrackedMemberDTO {
  id: string;
  name: string;
  email: string;
  deliveryGroup: DeliveryGroup | null;
  jobTitle: string | null;
  role: UserRole;
}

export interface TrainingAttendanceRecordDTO {
  id: string;
  userId: string;
  userName: string;
  deliveryGroup: DeliveryGroup | null;
  jobTitle: string | null;
  date: string; // YYYY-MM-DD
  checkedAt: string | null; // ISO timestamp ou null quando falta automática
  status: AttendanceStatus;
  notes: string | null;
}

export interface MemberAttendanceSummaryDTO {
  userId: string;
  userName: string;
  email: string;
  deliveryGroup: DeliveryGroup | null;
  jobTitle: string | null;
  totalTrainings: number;
  presencesCount: number;
  absencesCount: number;
  attendanceRate: number;
  lastPresenceDate: string | null;
  lastAbsenceDate: string | null;
  records: TrainingAttendanceRecordDTO[];
}

export interface DailyAttendancePointDTO {
  date: string;
  dateLabel: string;
  fullDateLabel: string;
  presences: number;
  absences: number;
  totalMembers: number;
  attendanceRate: number;
}

export interface SectorAttendanceSummaryDTO {
  sectorKey: DeliveryGroup | "GENERAL";
  sectorLabel: string;
  membersCount: number;
  presences: number;
  absences: number;
  attendanceRate: number;
}

export interface AttendanceAnalyticsDTO {
  totalTrainingDays: number;
  totalTrackedMembers: number;
  totalRecords: number;
  totalPresences: number;
  totalAbsences: number;
  overallAttendanceRate: number;
  latestTrainingDate: string | null;
  latestTrainingPresences: number;
  latestTrainingAbsences: number;
  membersWithAbsencesCount: number;
  perfectAttendanceMembersCount: number;
  trainingDates: string[];
  records: TrainingAttendanceRecordDTO[];
  memberSummaries: MemberAttendanceSummaryDTO[];
  dailySeries: DailyAttendancePointDTO[];
  sectorBreakdown: SectorAttendanceSummaryDTO[];
}
