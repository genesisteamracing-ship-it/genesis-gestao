"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileDown, Loader2 } from "lucide-react";
import { buildAttendanceAnalytics } from "@/lib/training-attendance";
import {
  ATTENDANCE_PERIOD_LABELS,
  ATTENDANCE_PERIOD_VALUES,
  ATTENDANCE_REPORT_FORMAT_VALUES,
  individualAttendanceReportSchema,
  type IndividualAttendanceReportInput,
} from "@/lib/validations/attendance";
import type {
  AttendancePeriodFilter,
  AttendanceTrackedMemberDTO,
  MemberAttendanceSummaryDTO,
} from "@/types/attendance";
import type { OfficeAttendanceDTO } from "@/types/office";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IndividualAttendanceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: AttendanceTrackedMemberDTO[];
  memberSummaries: MemberAttendanceSummaryDTO[];
  rawAttendances: OfficeAttendanceDTO[];
  todayIso?: string;
  defaultPeriod: AttendancePeriodFilter;
  isExporting: boolean;
  onSubmitReport: (input: IndividualAttendanceReportInput) => Promise<void>;
}

export function IndividualAttendanceReportDialog({
  open,
  onOpenChange,
  members,
  memberSummaries,
  rawAttendances,
  todayIso,
  defaultPeriod,
  isExporting,
  onSubmitReport,
}: IndividualAttendanceReportDialogProps) {
  const memberOptions = React.useMemo(
    () =>
      [...memberSummaries].sort((a, b) =>
        a.userName.localeCompare(b.userName, "pt-BR")
      ),
    [memberSummaries]
  );

  const defaultMemberId = memberOptions[0]?.userId ?? "";

  const form = useForm<IndividualAttendanceReportInput>({
    resolver: zodResolver(individualAttendanceReportSchema),
    defaultValues: {
      memberId: defaultMemberId,
      period: defaultPeriod,
      format: "PDF",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    const currentMemberId = form.getValues("memberId");
    const hasCurrentMember = memberOptions.some(
      (m) => m.userId === currentMemberId
    );
    form.reset({
      memberId: hasCurrentMember ? currentMemberId : defaultMemberId,
      period: defaultPeriod,
      format: form.getValues("format") || "PDF",
    });
  }, [defaultMemberId, defaultPeriod, form, memberOptions, open]);

  const watchedMemberId = useWatch({
    control: form.control,
    name: "memberId",
  });
  const watchedPeriod = useWatch({
    control: form.control,
    name: "period",
  });

  const previewSummary = React.useMemo(() => {
    if (!watchedMemberId) return null;
    const scoped = buildAttendanceAnalytics({
      members,
      attendances: rawAttendances,
      period: watchedPeriod ?? defaultPeriod,
      todayIso,
    });
    return (
      scoped.memberSummaries.find((m) => m.userId === watchedMemberId) ?? null
    );
  }, [
    defaultPeriod,
    members,
    rawAttendances,
    todayIso,
    watchedMemberId,
    watchedPeriod,
  ]);

  async function handleFormSubmit(values: IndividualAttendanceReportInput) {
    await onSubmitReport(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Relatório Individual</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">
                    Integrante
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger aria-label="Selecionar integrante do relatório">
                        <SelectValue placeholder="Selecione um integrante" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {memberOptions.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.userName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-between space-y-1.5">
                    <FormLabel className="text-xs font-semibold leading-tight min-h-[2rem] flex items-end">
                      Período do Relatório
                    </FormLabel>
                    <div className="mt-auto">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger aria-label="Selecionar período do relatório">
                            <SelectValue placeholder="Período" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ATTENDANCE_PERIOD_VALUES.map((periodKey) => (
                            <SelectItem key={periodKey} value={periodKey}>
                              {ATTENDANCE_PERIOD_LABELS[periodKey]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-between space-y-1.5">
                    <FormLabel className="text-xs font-semibold leading-tight min-h-[2rem] flex items-end">
                      Formato de Exportação
                    </FormLabel>
                    <div className="mt-auto">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger aria-label="Selecionar formato do relatório">
                            <SelectValue placeholder="Formato" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ATTENDANCE_REPORT_FORMAT_VALUES.map((fmt) => (
                            <SelectItem key={fmt} value={fmt}>
                              {fmt === "PDF" ? "PDF (Documento)" : "CSV (Planilha)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {previewSummary && (
              <div className="grid grid-cols-4 gap-2 rounded-xl border border-border bg-muted/40 p-3 text-center">
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {previewSummary.totalTrainings}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Treinos
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-success">
                    {previewSummary.presencesCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Presenças
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-destructive">
                    {previewSummary.absencesCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Faltas
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">
                    {previewSummary.attendanceRate.toFixed(0)}%
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Frequência
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isExporting}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isExporting || !watchedMemberId}
                className="w-full sm:w-auto gap-1.5"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                <span>Exportar Relatório</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
