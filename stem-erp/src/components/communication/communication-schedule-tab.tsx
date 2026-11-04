"use client";

import { useMemo, useState } from "react";
import { tv } from "tailwind-variants";
import { CalendarClock, ChevronLeft, ChevronRight, Clock, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildMonthlyScheduleCalendar } from "@/lib/communication-schedule";
import type { CalendarDayScheduleDTO, StakeholderWithRelations } from "@/types/communication";

const scheduleCalendarStyles = tv({
  slots: {
    gridHeader:
      "grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground pb-2",
    gridBody: "grid grid-cols-7 gap-1.5 sm:gap-2",
    dayCell:
      "group relative flex min-h-[76px] sm:min-h-[92px] flex-col items-center justify-between rounded-xl border p-2 transition-all focus-within:ring-2 focus-within:ring-ring select-none",
    dayNumber:
      "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs sm:text-sm transition-transform",
    popup:
      "pointer-events-none invisible opacity-0 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 absolute z-50 w-64 sm:w-72 rounded-xl border border-border bg-popover p-3 text-left text-popover-foreground shadow-2xl transition-all duration-150",
  },
  variants: {
    isCurrentMonth: {
      true: { dayCell: "bg-card/80 border-border/80", dayNumber: "text-foreground font-medium" },
      false: { dayCell: "bg-muted/20 border-border/40 opacity-50", dayNumber: "text-muted-foreground" },
    },
    hasScheduledReports: {
      true: {
        dayCell: "border-primary/40 bg-primary/5 hover:border-primary/70 cursor-pointer",
        dayNumber:
          "rounded-full border border-primary/60 bg-primary/15 font-bold text-primary shadow-xs group-hover:scale-105",
      },
      false: {},
    },
    placement: {
      top: {
        popup: "top-[calc(100%+6px)] left-1/2 -translate-x-1/2",
      },
      bottom: {
        popup: "bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2",
      },
    },
  },
  defaultVariants: {
    placement: "top",
  },
});

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

interface CommunicationScheduleTabProps {
  stakeholders: StakeholderWithRelations[];
  senderEmail?: string;
  onSelectStakeholderForReport?: (stakeholderId: string) => void;
}

export function CommunicationScheduleTab({
  stakeholders,
  senderEmail = "genesisteamracing@gmail.com",
  onSelectStakeholderForReport,
}: CommunicationScheduleTabProps) {
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => now.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(() => now.getUTCMonth());
  const [selectedDayForDrawer, setSelectedDayForDrawer] = useState<CalendarDayScheduleDTO | null>(null);

  const calendar = useMemo(
    () => buildMonthlyScheduleCalendar(stakeholders, viewYear, viewMonth, now),
    [stakeholders, viewYear, viewMonth, now]
  );

  const styles = scheduleCalendarStyles();
  const handlePrevMonth = () => (viewMonth === 0 ? (setViewYear((y) => y - 1), setViewMonth(11)) : setViewMonth((m) => m - 1));
  const handleNextMonth = () => (viewMonth === 11 ? (setViewYear((y) => y + 1), setViewMonth(0)) : setViewMonth((m) => m + 1));

  return (
    <Card className="border-border/80 bg-card/60">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span>Calendário de Agendamentos Automáticos</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Projeção automática de envios do Relatório Executivo Completo pela periodicidade • Remetente:{" "}
            <strong className="text-foreground">{senderEmail}</strong>
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center text-sm font-bold text-foreground">{calendar.monthLabel}</span>
          <Button type="button" variant="outline" size="icon" onClick={handleNextMonth} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className={styles.gridHeader()}>
          {WEEKDAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className={styles.gridBody()}>
          {calendar.days.map((day, index) => {
            const placement = index >= 21 ? "bottom" : "top";
            const cellStyles = scheduleCalendarStyles({
              isCurrentMonth: day.isCurrentMonth,
              hasScheduledReports: day.hasScheduledReports,
              placement,
            });

            return (
              <div
                key={day.dateKey}
                tabIndex={day.hasScheduledReports ? 0 : -1}
                onClick={() => {
                  if (day.hasScheduledReports) {
                    setSelectedDayForDrawer(day);
                  }
                }}
                onKeyDown={(e) => {
                  if (day.hasScheduledReports && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setSelectedDayForDrawer(day);
                  }
                }}
                className={cellStyles.dayCell()}
                role={day.hasScheduledReports ? "button" : undefined}
                aria-haspopup={day.hasScheduledReports ? "dialog" : undefined}
                aria-label={
                  day.hasScheduledReports
                    ? `Dia ${day.dayOfMonth}, ${day.scheduledItems.length} agendamentos. Clique para abrir detalhes.`
                    : `Dia ${day.dayOfMonth}`
                }
              >
                <span className={cellStyles.dayNumber()}>
                  {day.dayOfMonth}
                </span>

                {day.hasScheduledReports && (
                  <>
                    <span className="truncate max-w-full rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {day.scheduledItems.length} {day.scheduledItems.length === 1 ? "envio" : "envios"}
                    </span>

                    <div role="tooltip" className={cellStyles.popup()}>
                      <p className="flex items-center gap-1.5 text-xs font-bold text-primary">
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <span>Agendado para {day.dateKey.split("-").reverse().join("/")}</span>
                      </p>

                      <div className="mt-2 space-y-2 border-t border-border pt-2 max-h-[190px] overflow-y-auto pr-1">
                        {day.scheduledItems.map((item) => (
                          <div key={item.id} className="space-y-1 rounded-lg bg-muted/40 p-2 text-[11px]">
                            <p className="font-bold text-foreground">
                              {item.stakeholderName} {item.organization ? `• ${item.organization}` : ""}
                            </p>
                            <p className="text-muted-foreground">
                              Envio automático: <strong className="text-foreground">{item.reportTitle}</strong>
                            </p>
                            <p className="flex items-center gap-1 text-primary font-medium">
                              <Clock className="h-3 w-3" />
                              <span>Periodicidade: {item.frequencyLabel} ({item.occurrenceNumber}º ciclo)</span>
                            </p>
                            <p className="flex items-center gap-1 text-muted-foreground truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{item.recipientEmail || "Sem e-mail cadastrado"}</span>
                            </p>
                          </div>
                        ))}
                      </div>

                      <p className="mt-2 text-[10px] text-muted-foreground text-center pt-1 border-t border-border/50">
                        Clique para ver na cortina lateral →
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Cortina lateral (Sheet) com todos os agendamentos do dia selecionado */}
      <Sheet
        open={Boolean(selectedDayForDrawer)}
        onOpenChange={(open) => {
          if (!open) setSelectedDayForDrawer(null);
        }}
      >
        <SheetContent side="right" className="w-[85vw] sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-4 sm:p-6 border-b border-border bg-card">
            <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-foreground">
              <CalendarClock className="h-5 w-5 text-primary" />
              <span>Agendamentos do Dia</span>
            </SheetTitle>
            <SheetDescription className="text-xs sm:text-sm text-muted-foreground">
              {selectedDayForDrawer && (
                <>
                  Data: <strong>{selectedDayForDrawer.dateKey.split("-").reverse().join("/")}</strong> •{" "}
                  {selectedDayForDrawer.scheduledItems.length}{" "}
                  {selectedDayForDrawer.scheduledItems.length === 1
                    ? "relatório executivo agendado"
                    : "relatórios executivos agendados"}
                </>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {selectedDayForDrawer?.scheduledItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4 space-y-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {item.stakeholderName}
                    </h4>
                    {item.organization && (
                      <p className="text-xs text-muted-foreground">{item.organization}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-primary/15 border border-primary/40 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                    {item.frequencyLabel}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-muted-foreground">
                    Relatório: <strong className="text-foreground">{item.reportTitle}</strong>
                  </p>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      {item.occurrenceNumber}º ciclo automático • Cadastrado em{" "}
                      {item.registeredAtIso.split("-").reverse().join("/")}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5 text-muted-foreground truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {item.recipientEmail || "Sem e-mail cadastrado"}
                    </span>
                  </p>
                </div>

                {onSelectStakeholderForReport && (
                  <div className="pt-2 border-t border-border/60 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDayForDrawer(null);
                        onSelectStakeholderForReport(item.stakeholderId);
                      }}
                      className="text-xs gap-1.5 font-semibold text-primary"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Abrir no Gerador de Relatórios</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
