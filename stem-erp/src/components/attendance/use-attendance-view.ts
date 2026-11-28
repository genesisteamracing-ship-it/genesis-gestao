"use client";

import * as React from "react";
import { useAttendanceReports } from "@/hooks/use-attendance-reports";
import { buildAttendanceAnalytics } from "@/lib/training-attendance";
import type { IndividualAttendanceReportInput } from "@/lib/validations/attendance";
import type {
  AttendanceAnalyticsDTO,
  AttendancePeriodFilter,
  AttendanceTrackedMemberDTO,
  MemberAttendanceSummaryDTO,
} from "@/types/attendance";
import type { OfficeAttendanceDTO } from "@/types/office";

export type AttendanceViewTab = "daily" | "members";

export interface UseAttendanceViewParams {
  members: AttendanceTrackedMemberDTO[];
  attendances: OfficeAttendanceDTO[];
  todayIso?: string;
  teamName?: string;
  seasonLabel?: string;
  onExportIndividualPdfOverride?: (params: {
    memberSummary: MemberAttendanceSummaryDTO;
    period: AttendancePeriodFilter;
  }) => Promise<void> | void;
  onExportIndividualCsvOverride?: (params: {
    memberSummary: MemberAttendanceSummaryDTO;
    period: AttendancePeriodFilter;
  }) => Promise<void> | void;
  onExportTeamPdfOverride?: (params: {
    analytics: AttendanceAnalyticsDTO;
    period: AttendancePeriodFilter;
  }) => Promise<void> | void;
}

export function useAttendanceView({
  members,
  attendances,
  todayIso,
  teamName,
  seasonLabel,
  onExportIndividualPdfOverride,
  onExportIndividualCsvOverride,
  onExportTeamPdfOverride,
}: UseAttendanceViewParams) {
  const [period, setPeriod] = React.useState<AttendancePeriodFilter>("ALL");
  const [activeTab, setActiveTab] = React.useState<AttendanceViewTab>("daily");
  const [isIndividualDialogOpen, setIsIndividualDialogOpen] =
    React.useState(false);

  const analytics = React.useMemo(
    () =>
      buildAttendanceAnalytics({
        members,
        attendances,
        period,
        todayIso,
      }),
    [attendances, members, period, todayIso]
  );

  const reports = useAttendanceReports({
    analytics,
    allMembers: members,
    rawAttendances: attendances,
    currentPeriod: period,
    todayIso,
    teamName,
    seasonLabel,
    onExportIndividualPdfOverride,
    onExportIndividualCsvOverride,
    onExportTeamPdfOverride,
  });

  const handleIndividualDialogSubmit = React.useCallback(
    async (values: IndividualAttendanceReportInput) => {
      if (values.format === "CSV") {
        await reports.handleExportIndividualCsv(values.memberId, values.period);
        return;
      }
      await reports.handleExportIndividualPdf(values.memberId, values.period);
    },
    [reports]
  );

  return {
    period,
    setPeriod,
    activeTab,
    setActiveTab,
    isIndividualDialogOpen,
    setIsIndividualDialogOpen,
    analytics,
    reports,
    handleIndividualDialogSubmit,
  };
}
