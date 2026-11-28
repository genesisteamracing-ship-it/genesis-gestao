"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  exportIndividualAttendanceToPdf,
  exportTeamAttendanceToPdf,
} from "@/lib/attendance-pdf-export";
import {
  buildIndividualAttendanceCsvData,
  buildTeamAttendanceCsvData,
} from "@/lib/attendance-pdf-layout";
import { downloadCsvFile } from "@/lib/export-utils";
import { buildAttendanceAnalytics } from "@/lib/training-attendance";
import type {
  AttendanceAnalyticsDTO,
  AttendancePeriodFilter,
  AttendanceTrackedMemberDTO,
  MemberAttendanceSummaryDTO,
} from "@/types/attendance";
import type { OfficeAttendanceDTO } from "@/types/office";

interface UseAttendanceReportsParams {
  analytics: AttendanceAnalyticsDTO;
  allMembers: AttendanceTrackedMemberDTO[];
  rawAttendances: OfficeAttendanceDTO[];
  currentPeriod: AttendancePeriodFilter;
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

export function useAttendanceReports({
  analytics,
  allMembers,
  rawAttendances,
  currentPeriod,
  todayIso,
  teamName,
  seasonLabel,
  onExportIndividualPdfOverride,
  onExportIndividualCsvOverride,
  onExportTeamPdfOverride,
}: UseAttendanceReportsParams) {
  const [isExportingTeamPdf, setIsExportingTeamPdf] = React.useState(false);
  const [exportingMemberId, setExportingMemberId] = React.useState<string | null>(
    null
  );

  const resolveMemberSummary = React.useCallback(
    (
      memberId: string,
      periodOverride?: AttendancePeriodFilter
    ): {
      summary: MemberAttendanceSummaryDTO | null;
      resolvedPeriod: AttendancePeriodFilter;
    } => {
      const resolvedPeriod = periodOverride ?? currentPeriod;
      const targetAnalytics =
        resolvedPeriod === currentPeriod
          ? analytics
          : buildAttendanceAnalytics({
              members: allMembers,
              attendances: rawAttendances,
              period: resolvedPeriod,
              todayIso,
            });

      const summary =
        targetAnalytics.memberSummaries.find((m) => m.userId === memberId) ??
        null;

      return { summary, resolvedPeriod };
    },
    [allMembers, analytics, currentPeriod, rawAttendances, todayIso]
  );

  const handleExportTeamPdf = React.useCallback(async () => {
    if (analytics.totalTrainingDays === 0) {
      toast.error("Não há treinos registrados para exportar.");
      return;
    }

    try {
      setIsExportingTeamPdf(true);
      if (onExportTeamPdfOverride) {
        await onExportTeamPdfOverride({ analytics, period: currentPeriod });
        toast.success("Relatório geral de presença exportado.");
        return;
      }
      const { filename } = await exportTeamAttendanceToPdf({
        analytics,
        teamName,
        seasonLabel,
        period: currentPeriod,
      });
      toast.success(`Relatório geral exportado: ${filename}`);
    } catch {
      toast.error("Não foi possível gerar o relatório geral em PDF.");
    } finally {
      setIsExportingTeamPdf(false);
    }
  }, [
    analytics,
    currentPeriod,
    onExportTeamPdfOverride,
    seasonLabel,
    teamName,
  ]);

  const handleExportTeamCsv = React.useCallback(() => {
    if (analytics.records.length === 0) {
      toast.error("Não há registros de presença para exportar.");
      return;
    }

    const csv = buildTeamAttendanceCsvData(analytics, teamName);
    downloadCsvFile(csv.filename, csv.headers, csv.rows);
    toast.success(`Planilha CSV exportada: ${csv.filename}`);
  }, [analytics, teamName]);

  const handleExportIndividualPdf = React.useCallback(
    async (memberId: string, periodOverride?: AttendancePeriodFilter) => {
      const { summary, resolvedPeriod } = resolveMemberSummary(
        memberId,
        periodOverride
      );

      if (!summary || summary.totalTrainings === 0) {
        toast.error(
          "Não há treinos registrados no período selecionado para este integrante."
        );
        return;
      }

      try {
        setExportingMemberId(memberId);
        if (onExportIndividualPdfOverride) {
          await onExportIndividualPdfOverride({
            memberSummary: summary,
            period: resolvedPeriod,
          });
          toast.success(
            `Relatório individual exportado: ${summary.userName}`
          );
          return;
        }
        const { filename } = await exportIndividualAttendanceToPdf({
          memberSummary: summary,
          teamName,
          seasonLabel,
          period: resolvedPeriod,
        });
        toast.success(`Relatório individual exportado: ${filename}`);
      } catch {
        toast.error("Não foi possível gerar o relatório individual em PDF.");
      } finally {
        setExportingMemberId(null);
      }
    },
    [
      onExportIndividualPdfOverride,
      resolveMemberSummary,
      seasonLabel,
      teamName,
    ]
  );

  const handleExportIndividualCsv = React.useCallback(
    async (memberId: string, periodOverride?: AttendancePeriodFilter) => {
      const { summary, resolvedPeriod } = resolveMemberSummary(
        memberId,
        periodOverride
      );

      if (!summary || summary.totalTrainings === 0) {
        toast.error(
          "Não há treinos registrados no período selecionado para este integrante."
        );
        return;
      }

      try {
        setExportingMemberId(memberId);
        if (onExportIndividualCsvOverride) {
          await onExportIndividualCsvOverride({
            memberSummary: summary,
            period: resolvedPeriod,
          });
          toast.success(
            `Histórico individual exportado: ${summary.userName}`
          );
          return;
        }
        const csv = buildIndividualAttendanceCsvData(summary);
        downloadCsvFile(csv.filename, csv.headers, csv.rows);
        toast.success(`Histórico individual exportado: ${csv.filename}`);
      } catch {
        toast.error("Não foi possível gerar o histórico individual em CSV.");
      } finally {
        setExportingMemberId(null);
      }
    },
    [onExportIndividualCsvOverride, resolveMemberSummary]
  );

  return {
    isExportingTeamPdf,
    exportingMemberId,
    handleExportTeamPdf,
    handleExportTeamCsv,
    handleExportIndividualPdf,
    handleExportIndividualCsv,
  };
}
