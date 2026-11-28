"use client";

import { useMemo } from "react";
import { Diamond, Plus } from "lucide-react";
import { tv } from "tailwind-variants";
import {
  evaluateMilestoneSummary,
  MILESTONE_OVERALL_STATUS_LABELS,
} from "@/lib/task-milestone-metrics";
import { dayLabel, formatTaskDate, parseTaskDate, taskDay } from "@/lib/task-schedule";
import type { TaskMilestoneRecord } from "@/types/tasks";

export const milestoneDiamondStyles = tv({
  base: "h-3.5 w-3.5 shrink-0 rotate-45 border-2 transition-transform group-hover/milestone:scale-125 shadow-2xs",
  variants: {
    status: {
      NO_TASKS: "border-primary bg-card",
      PENDING: "border-warning bg-warning/85",
      APPROVED: "border-success bg-success",
      REJECTED: "border-destructive bg-destructive",
      OVERDUE: "border-destructive bg-card ring-2 ring-destructive/40",
    },
  },
  defaultVariants: {
    status: "NO_TASKS",
  },
});

export interface TaskGanttMilestoneTrackProps {
  milestones: TaskMilestoneRecord[];
  fromDay: number;
  dayWidth: number;
  ticks: number[];
  tickStep: number;
  labelWidth: number;
  todayIso: string;
  canEdit: boolean;
  onAddAtDate: (isoDate: string) => void;
  onSelectMilestone: (milestoneId: string) => void;
}

export function TaskGanttMilestoneTrack({
  milestones,
  fromDay,
  dayWidth,
  ticks,
  tickStep,
  labelWidth,
  todayIso,
  canEdit,
  onAddAtDate,
  onSelectMilestone,
}: TaskGanttMilestoneTrackProps) {
  const positioned = useMemo(() => {
    const countByDate = new Map<string, number>();

    return milestones
      .filter((item) => parseTaskDate(item.targetDate) !== null)
      .map((item) => {
        const sameDateIndex = countByDate.get(item.targetDate) ?? 0;
        countByDate.set(item.targetDate, sameDateIndex + 1);

        const day = taskDay(item.targetDate);
        const x = Math.max(8, (day - fromDay) * dayWidth + dayWidth / 2 + sameDateIndex * 22);
        const summary = evaluateMilestoneSummary(item, todayIso);

        return { milestone: item, x, summary };
      });
  }, [milestones, fromDay, dayWidth, todayIso]);

  return (
    <div
      aria-label="Marcos do cronograma"
      className="sticky top-10 z-[25] flex h-11 border-b border-border bg-muted/25 text-xs"
    >
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center justify-between gap-2 border-r border-border bg-card px-2.5"
        style={{ width: labelWidth }}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Diamond className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate font-semibold text-foreground">Marcos</span>
          {milestones.length > 0 && (
            <span className="text-[11px] font-medium text-muted-foreground">
              ({milestones.length})
            </span>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => onAddAtDate(todayIso)}
            aria-label="Novo marco"
            title="Adicionar novo marco"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div
        className="relative flex-1"
        style={{
          backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px)",
          backgroundSize: dayWidth * tickStep + "px 100%",
        }}
      >
        {canEdit &&
          ticks.map((offset) => {
            const slotIso = dayLabel(fromDay + offset);
            const shortDate = formatTaskDate(slotIso).slice(0, 5);
            const slotWidth = Math.max(28, dayWidth * tickStep);

            return (
              <button
                key={offset}
                type="button"
                onClick={() => onAddAtDate(slotIso)}
                aria-label={`Adicionar marco na semana de ${shortDate}`}
                title={`Clique para adicionar marco em ${formatTaskDate(slotIso)}`}
                style={{ left: offset * dayWidth, width: slotWidth }}
                className="group/slot absolute inset-y-0 z-[5] flex items-center justify-center text-muted-foreground/0 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary focus-visible:outline-none cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 transition-transform group-hover/slot:scale-110" />
              </button>
            );
          })}

        {positioned.map(({ milestone, x, summary }) => {
          const statusLabel = MILESTONE_OVERALL_STATUS_LABELS[summary.status];
          const progressText =
            summary.totalTasks > 0 ? `${summary.approvedTasks}/${summary.totalTasks}` : "0/0";

          return (
            <button
              key={milestone.id}
              type="button"
              onClick={() => onSelectMilestone(milestone.id)}
              style={{ left: x - 11 }}
              aria-label={`Marco ${milestone.title} · ${formatTaskDate(milestone.targetDate)} · ${progressText} tarefas aprovadas · ${statusLabel}`}
              title={`${milestone.title} (${formatTaskDate(milestone.targetDate)}) · ${progressText} tarefas aprovadas · ${statusLabel}`}
              className="group/milestone absolute top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-card/90 focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
            >
              <span
                aria-hidden="true"
                className={milestoneDiamondStyles({ status: summary.status })}
              />
              <span className="inline-flex max-w-36 items-center gap-1 rounded border border-border/80 bg-card/95 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-foreground shadow-2xs">
                <span className="truncate">{milestone.title}</span>
                {summary.totalTasks > 0 && (
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                    {progressText}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
