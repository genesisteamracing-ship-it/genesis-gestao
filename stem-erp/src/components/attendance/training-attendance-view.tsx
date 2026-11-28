"use client";

import * as React from "react";
import {
  AlertCircle,
  CalendarCheck2,
  FileText,
  Loader2,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import {
  ATTENDANCE_PERIOD_LABELS,
  ATTENDANCE_PERIOD_VALUES,
} from "@/lib/validations/attendance";
import type {
  AttendanceAnalyticsDTO,
  AttendancePeriodFilter,
  AttendanceTrackedMemberDTO,
  MemberAttendanceSummaryDTO,
} from "@/types/attendance";
import type { OfficeAttendanceDTO } from "@/types/office";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceCharts } from "./attendance-charts";
import { AttendanceDailyTable } from "./attendance-daily-table";
import { AttendanceKpis } from "./attendance-kpis";
import { AttendanceMembersTable } from "./attendance-members-table";
import { IndividualAttendanceReportDialog } from "./individual-attendance-report-dialog";
import {
  useAttendanceView,
  type AttendanceViewTab,
} from "./use-attendance-view";

export interface TrainingAttendanceViewProps {
  members: AttendanceTrackedMemberDTO[];
  attendances: OfficeAttendanceDTO[];
  todayIso?: string;
  teamName?: string;
  seasonLabel?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
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

export function TrainingAttendanceView({
  members,
  attendances,
  todayIso,
  teamName,
  seasonLabel,
  isLoading = false,
  error = null,
  onRetry,
  onExportIndividualPdfOverride,
  onExportIndividualCsvOverride,
  onExportTeamPdfOverride,
}: TrainingAttendanceViewProps) {
  const view = useAttendanceView({
    members,
    attendances,
    todayIso,
    teamName,
    seasonLabel,
    onExportIndividualPdfOverride,
    onExportIndividualCsvOverride,
    onExportTeamPdfOverride,
  });

  if (isLoading) {
    return (
      <section
        aria-label="Carregando presença nos treinos"
        className="space-y-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-40 rounded-xl" />
            <Skeleton className="h-9 w-40 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Skeleton className="h-72 rounded-2xl lg:col-span-8" />
          <Skeleton className="h-72 rounded-2xl lg:col-span-4" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </section>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl border border-destructive/30 bg-card shadow-xs">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h2 className="text-base font-bold text-foreground">
              Não foi possível carregar os registros de presença
            </h2>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tentar novamente</span>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (attendances.length === 0) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-xs">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <CalendarCheck2 className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h2 className="text-base font-bold text-foreground">
              Nenhuma presença registrada ainda
            </h2>
            <p className="text-xs text-muted-foreground">
              Quando integrantes marcarem presença nos treinos, os indicadores e faltas automáticas aparecerão aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-5">
      {/* Barra superior: Filtro de período + Exportação de relatórios */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-52">
          <Select
            value={view.period}
            onValueChange={(val) =>
              view.setPeriod(val as AttendancePeriodFilter)
            }
          >
            <SelectTrigger
              aria-label="Filtrar período dos dashboards"
              className="h-9 text-xs font-medium"
            >
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {ATTENDANCE_PERIOD_VALUES.map((periodKey) => (
                <SelectItem key={periodKey} value={periodKey}>
                  {ATTENDANCE_PERIOD_LABELS[periodKey]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => view.setIsIndividualDialogOpen(true)}
            disabled={view.analytics.memberSummaries.length === 0}
            className="h-9 gap-1.5 text-xs font-semibold w-full sm:w-auto cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Relatório Individual</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => void view.reports.handleExportTeamPdf()}
            disabled={
              view.reports.isExportingTeamPdf ||
              view.analytics.totalTrainingDays === 0
            }
            className="h-9 gap-1.5 text-xs font-semibold w-full sm:w-auto cursor-pointer"
          >
            {view.reports.isExportingTeamPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            <span>
              {view.reports.isExportingTeamPdf
                ? "Exportando..."
                : "Relatório Geral (PDF)"}
            </span>
          </Button>
        </div>
      </div>

      {/* 4 Cards KPI Executivos */}
      <AttendanceKpis analytics={view.analytics} />

      {/* Gráficos de Presenças e Faltas */}
      <AttendanceCharts analytics={view.analytics} />

      {/* Tabelas com Faltas Automáticas e Ações Individuais */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs">
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                Presenças e Faltas nos Treinos
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {view.analytics.totalPresences} presenças ·{" "}
                {view.analytics.totalAbsences} faltas no período
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={view.activeTab}
            onValueChange={(val) => view.setActiveTab(val as AttendanceViewTab)}
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="daily" className="flex-1 sm:flex-initial text-xs">
                Registros por Treino
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-1 sm:flex-initial text-xs">
                Resumo por Integrante
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              <AttendanceDailyTable
                records={view.analytics.records}
                trainingDates={view.analytics.trainingDates}
                memberSummaries={view.analytics.memberSummaries}
                exportingMemberId={view.reports.exportingMemberId}
                onExportIndividualPdf={(memberId) =>
                  void view.reports.handleExportIndividualPdf(memberId)
                }
                onExportIndividualCsv={(memberId) =>
                  void view.reports.handleExportIndividualCsv(memberId)
                }
              />
            </TabsContent>

            <TabsContent value="members">
              <AttendanceMembersTable
                memberSummaries={view.analytics.memberSummaries}
                exportingMemberId={view.reports.exportingMemberId}
                onExportIndividualPdf={(memberId) =>
                  void view.reports.handleExportIndividualPdf(memberId)
                }
                onExportIndividualCsv={(memberId) =>
                  void view.reports.handleExportIndividualCsv(memberId)
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <IndividualAttendanceReportDialog
        open={view.isIndividualDialogOpen}
        onOpenChange={view.setIsIndividualDialogOpen}
        members={members}
        memberSummaries={view.analytics.memberSummaries}
        rawAttendances={attendances}
        todayIso={todayIso}
        defaultPeriod={view.period}
        isExporting={view.reports.exportingMemberId !== null}
        onSubmitReport={view.handleIndividualDialogSubmit}
      />
    </section>
  );
}
