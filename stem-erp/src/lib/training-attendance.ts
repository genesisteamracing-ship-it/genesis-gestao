import type { DeliveryGroup } from "@prisma/client";
import { DELIVERY_GROUP_SHORT_LABELS } from "@/lib/constants";
import type {
  AttendanceAnalyticsDTO,
  AttendancePeriodFilter,
  AttendanceTrackedMemberDTO,
  DailyAttendancePointDTO,
  MemberAttendanceSummaryDTO,
  SectorAttendanceSummaryDTO,
  TrainingAttendanceRecordDTO,
} from "@/types/attendance";
import type { OfficeAttendanceDTO } from "@/types/office";

const WEEKDAY_SHORT_LABELS = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseIsoDateToUtcMs(isoDate: string): number | null {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return ms;
}

function getTodayUtcIso(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatIsoDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export function formatShortDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}`;
}

export function formatWeekdayShortBR(isoDate: string): string {
  const ms = parseIsoDateToUtcMs(isoDate);
  if (ms === null) return "—";
  const dayIndex = new Date(ms).getUTCDay();
  return WEEKDAY_SHORT_LABELS[dayIndex] ?? "—";
}

export function formatTimeBR(isoTimestamp: string | null): string {
  if (!isoTimestamp) return "—";
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getAttendanceSectorLabel(
  deliveryGroup: DeliveryGroup | "GENERAL" | null | undefined
): string {
  if (!deliveryGroup || deliveryGroup === "GENERAL") return "Geral";
  return DELIVERY_GROUP_SHORT_LABELS[deliveryGroup] ?? "Geral";
}

export function isIsoDateInPeriod(
  isoDate: string,
  period: AttendancePeriodFilter,
  referenceIso?: string
): boolean {
  if (period === "ALL") return true;

  const itemMs = parseIsoDateToUtcMs(isoDate);
  if (itemMs === null) return false;

  const resolvedRef =
    referenceIso && parseIsoDateToUtcMs(referenceIso) !== null
      ? referenceIso
      : getTodayUtcIso();

  if (period === "CURRENT_MONTH") {
    return isoDate.slice(0, 7) === resolvedRef.slice(0, 7);
  }

  const refMs = parseIsoDateToUtcMs(resolvedRef);
  if (refMs === null) return false;

  const diffDays = Math.floor((refMs - itemMs) / MS_PER_DAY);
  if (period === "LAST_7_DAYS") {
    return diffDays >= 0 && diffDays < 7;
  }
  if (period === "LAST_30_DAYS") {
    return diffDays >= 0 && diffDays < 30;
  }

  return true;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function resolveMandatoryMembers(
  members: AttendanceTrackedMemberDTO[] | undefined,
  attendances: OfficeAttendanceDTO[]
): AttendanceTrackedMemberDTO[] {
  if (members && members.length > 0) {
    const operational = members.filter(
      (m) => m.role !== "AUDITOR" && m.role !== "SUPER_ADMIN"
    );
    if (operational.length > 0) return operational;
    return members.filter((m) => m.role !== "AUDITOR");
  }

  const derivedMap = new Map<string, AttendanceTrackedMemberDTO>();
  for (const att of attendances) {
    if (!derivedMap.has(att.userId)) {
      derivedMap.set(att.userId, {
        id: att.userId,
        name: att.userName,
        email: "",
        deliveryGroup: att.deliveryGroup,
        jobTitle: att.jobTitle,
        role: "TEAM_LEAD",
      });
    }
  }
  return Array.from(derivedMap.values());
}

export function buildAttendanceAnalytics({
  members,
  attendances,
  period = "ALL",
  todayIso,
}: {
  members?: AttendanceTrackedMemberDTO[];
  attendances: OfficeAttendanceDTO[];
  period?: AttendancePeriodFilter;
  todayIso?: string;
}): AttendanceAnalyticsDTO {
  const mandatoryMembers = resolveMandatoryMembers(members, attendances);

  const latestRawDate = attendances.reduce<string | undefined>((latest, item) => {
    if (!latest || item.date > latest) return item.date;
    return latest;
  }, undefined);

  const referenceIso =
    todayIso && parseIsoDateToUtcMs(todayIso) !== null
      ? todayIso
      : latestRawDate ?? getTodayUtcIso();

  const filteredAttendances = attendances.filter((item) =>
    isIsoDateInPeriod(item.date, period, referenceIso)
  );

  const trainingDates = Array.from(
    new Set(filteredAttendances.map((item) => item.date))
  ).sort((a, b) => b.localeCompare(a));

  const memberById = new Map<string, AttendanceTrackedMemberDTO>();
  for (const member of mandatoryMembers) {
    memberById.set(member.id, member);
  }
  if (members) {
    for (const member of members) {
      if (!memberById.has(member.id)) {
        memberById.set(member.id, member);
      }
    }
  }

  const records: TrainingAttendanceRecordDTO[] = [];
  const dailyMap = new Map<
    string,
    { presences: number; absences: number }
  >();

  for (const date of trainingDates) {
    const presentByUser = new Map<string, OfficeAttendanceDTO>();
    for (const item of filteredAttendances) {
      if (item.date !== date) continue;
      if (!presentByUser.has(item.userId)) {
        presentByUser.set(item.userId, item);
      }
    }

    let dayPresences = 0;
    let dayAbsences = 0;

    for (const present of presentByUser.values()) {
      dayPresences += 1;
      records.push({
        id: present.id,
        userId: present.userId,
        userName: present.userName,
        deliveryGroup: present.deliveryGroup,
        jobTitle: present.jobTitle,
        date: present.date,
        checkedAt: present.checkedAt,
        status: "PRESENT",
        notes: present.notes,
      });
    }

    for (const member of mandatoryMembers) {
      if (presentByUser.has(member.id)) continue;
      dayAbsences += 1;
      records.push({
        id: `absent:${date}:${member.id}`,
        userId: member.id,
        userName: member.name,
        deliveryGroup: member.deliveryGroup,
        jobTitle: member.jobTitle,
        date,
        checkedAt: null,
        status: "ABSENT",
        notes: null,
      });
    }

    dailyMap.set(date, { presences: dayPresences, absences: dayAbsences });
  }

  records.sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    if (a.status !== b.status) {
      return a.status === "PRESENT" ? -1 : 1;
    }
    return a.userName.localeCompare(b.userName, "pt-BR");
  });

  const recordsByUser = new Map<string, TrainingAttendanceRecordDTO[]>();
  for (const member of mandatoryMembers) {
    recordsByUser.set(member.id, []);
  }
  for (const record of records) {
    const bucket = recordsByUser.get(record.userId) ?? [];
    bucket.push(record);
    recordsByUser.set(record.userId, bucket);
  }

  const memberSummaries: MemberAttendanceSummaryDTO[] = [];
  for (const [userId, userRecords] of recordsByUser.entries()) {
    const memberMeta = memberById.get(userId);
    const chronological = [...userRecords].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const presencesCount = chronological.filter(
      (r) => r.status === "PRESENT"
    ).length;
    const absencesCount = chronological.filter(
      (r) => r.status === "ABSENT"
    ).length;
    const totalTrainings = chronological.length;
    const attendanceRate =
      totalTrainings > 0
        ? roundOneDecimal((presencesCount / totalTrainings) * 100)
        : 0;

    let lastPresenceDate: string | null = null;
    let lastAbsenceDate: string | null = null;
    for (const r of chronological) {
      if (r.status === "PRESENT") lastPresenceDate = r.date;
      if (r.status === "ABSENT") lastAbsenceDate = r.date;
    }

    const firstRecord = chronological[0];
    memberSummaries.push({
      userId,
      userName: memberMeta?.name ?? firstRecord?.userName ?? "Integrante",
      email: memberMeta?.email ?? "",
      deliveryGroup:
        memberMeta?.deliveryGroup ?? firstRecord?.deliveryGroup ?? null,
      jobTitle: memberMeta?.jobTitle ?? firstRecord?.jobTitle ?? null,
      totalTrainings,
      presencesCount,
      absencesCount,
      attendanceRate,
      lastPresenceDate,
      lastAbsenceDate,
      records: chronological,
    });
  }

  memberSummaries.sort((a, b) => {
    if (b.attendanceRate !== a.attendanceRate) {
      return b.attendanceRate - a.attendanceRate;
    }
    if (b.presencesCount !== a.presencesCount) {
      return b.presencesCount - a.presencesCount;
    }
    return a.userName.localeCompare(b.userName, "pt-BR");
  });

  const dailySeries: DailyAttendancePointDTO[] = [...trainingDates]
    .reverse()
    .map((date) => {
      const counts = dailyMap.get(date) ?? { presences: 0, absences: 0 };
      const totalMembers = counts.presences + counts.absences;
      return {
        date,
        dateLabel: formatShortDateBR(date),
        fullDateLabel: formatIsoDateBR(date),
        presences: counts.presences,
        absences: counts.absences,
        totalMembers,
        attendanceRate:
          totalMembers > 0
            ? roundOneDecimal((counts.presences / totalMembers) * 100)
            : 0,
      };
    });

  const sectorAccumulator = new Map<
    DeliveryGroup | "GENERAL",
    { membersCount: number; presences: number; absences: number }
  >();

  for (const summary of memberSummaries) {
    const key: DeliveryGroup | "GENERAL" = summary.deliveryGroup ?? "GENERAL";
    const current = sectorAccumulator.get(key) ?? {
      membersCount: 0,
      presences: 0,
      absences: 0,
    };
    current.membersCount += 1;
    current.presences += summary.presencesCount;
    current.absences += summary.absencesCount;
    sectorAccumulator.set(key, current);
  }

  const sectorBreakdown: SectorAttendanceSummaryDTO[] = Array.from(
    sectorAccumulator.entries()
  )
    .map(([sectorKey, counts]) => {
      const total = counts.presences + counts.absences;
      return {
        sectorKey,
        sectorLabel: getAttendanceSectorLabel(sectorKey),
        membersCount: counts.membersCount,
        presences: counts.presences,
        absences: counts.absences,
        attendanceRate:
          total > 0 ? roundOneDecimal((counts.presences / total) * 100) : 0,
      };
    })
    .sort((a, b) => {
      if (b.attendanceRate !== a.attendanceRate) {
        return b.attendanceRate - a.attendanceRate;
      }
      return a.sectorLabel.localeCompare(b.sectorLabel, "pt-BR");
    });

  const totalPresences = records.filter((r) => r.status === "PRESENT").length;
  const totalAbsences = records.filter((r) => r.status === "ABSENT").length;
  const totalRecords = records.length;
  const overallAttendanceRate =
    totalRecords > 0
      ? roundOneDecimal((totalPresences / totalRecords) * 100)
      : 0;

  const latestTrainingDate = trainingDates[0] ?? null;
  const latestDailyPoint =
    dailySeries.length > 0 ? dailySeries[dailySeries.length - 1] : null;

  const membersWithAbsencesCount = memberSummaries.filter(
    (m) => m.absencesCount > 0
  ).length;
  const perfectAttendanceMembersCount =
    trainingDates.length > 0
      ? memberSummaries.filter(
          (m) => m.totalTrainings > 0 && m.absencesCount === 0
        ).length
      : 0;

  return {
    totalTrainingDays: trainingDates.length,
    totalTrackedMembers: mandatoryMembers.length,
    totalRecords,
    totalPresences,
    totalAbsences,
    overallAttendanceRate,
    latestTrainingDate,
    latestTrainingPresences: latestDailyPoint?.presences ?? 0,
    latestTrainingAbsences: latestDailyPoint?.absences ?? 0,
    membersWithAbsencesCount,
    perfectAttendanceMembersCount,
    trainingDates,
    records,
    memberSummaries,
    dailySeries,
    sectorBreakdown,
  };
}
