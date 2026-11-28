"use client";

import { useState } from "react";
import { Check, Clock, Loader2, Pencil, Trash2, X } from "lucide-react";
import { tv } from "tailwind-variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import {
  evaluateMilestoneSummary,
  evaluateMilestoneTask,
  getMilestoneWeekRange,
  MILESTONE_CHECK_STATUS_LABELS,
  MILESTONE_OVERALL_STATUS_LABELS,
  MILESTONE_TASK_VERDICT_LABELS,
  type GanttMilestoneOverallStatus,
  type MilestoneTaskVerdict,
} from "@/lib/task-milestone-metrics";
import { formatTaskDate } from "@/lib/task-schedule";
import type {
  MilestoneCheckStatus,
  TaskMilestoneRecord,
  TaskRecord,
} from "@/types/tasks";
import { milestoneDiamondStyles } from "./task-gantt-milestone-track";

const checkOptionButton = tv({
  base: "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 cursor-pointer",
  variants: {
    option: {
      APPROVED: "",
      REJECTED: "",
      PENDING: "",
    },
    active: {
      true: "",
      false: "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    },
  },
  compoundVariants: [
    {
      option: "APPROVED",
      active: true,
      class: "border-success bg-success text-success-foreground",
    },
    {
      option: "REJECTED",
      active: true,
      class: "border-destructive bg-destructive text-destructive-foreground",
    },
    {
      option: "PENDING",
      active: true,
      class: "border-warning/80 bg-warning/20 text-foreground",
    },
  ],
  defaultVariants: {
    option: "PENDING",
    active: false,
  },
});

const verdictBadgeVariant: Record<
  MilestoneTaskVerdict,
  "success" | "destructive" | "warning"
> = {
  APPROVED: "success",
  REJECTED: "destructive",
  PENDING: "warning",
};

const overallBadgeVariant: Record<
  GanttMilestoneOverallStatus,
  "success" | "destructive" | "warning" | "outline"
> = {
  APPROVED: "success",
  REJECTED: "destructive",
  OVERDUE: "destructive",
  PENDING: "warning",
  NO_TASKS: "outline",
};

const CHECK_OPTIONS: readonly {
  status: MilestoneCheckStatus;
  label: string;
}[] = [
  { status: "APPROVED", label: MILESTONE_CHECK_STATUS_LABELS.APPROVED },
  { status: "REJECTED", label: MILESTONE_CHECK_STATUS_LABELS.REJECTED },
  { status: "PENDING", label: MILESTONE_CHECK_STATUS_LABELS.PENDING },
];

function CheckOptionIcon({ status }: { status: MilestoneCheckStatus }) {
  if (status === "APPROVED") return <Check className="h-3 w-3" aria-hidden="true" />;
  if (status === "REJECTED") return <X className="h-3 w-3" aria-hidden="true" />;
  return <Clock className="h-3 w-3" aria-hidden="true" />;
}

interface MilestoneTaskCardProps {
  milestone: TaskMilestoneRecord;
  task: TaskRecord;
  canEdit: boolean;
  pendingCheckKey: string | null;
  onToggleCheck: (params: {
    milestoneId: string;
    criterionId: string;
    taskId: string;
    status: MilestoneCheckStatus;
  }) => void;
}

function MilestoneTaskCard({
  milestone,
  task,
  canEdit,
  pendingCheckKey,
  onToggleCheck,
}: MilestoneTaskCardProps) {
  const evaluation = evaluateMilestoneTask(milestone, task.id);

  return (
    <article className="space-y-2.5 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-foreground">{task.title}</h4>
          <p className="text-xs text-muted-foreground">
            {DELIVERY_GROUP_LABELS[task.deliveryGroup]} · Término {formatTaskDate(task.endDate)} ·{" "}
            {evaluation.approvedCount}/{evaluation.totalCriteria} critérios
          </p>
        </div>
        <Badge variant={verdictBadgeVariant[evaluation.verdict]}>
          {MILESTONE_TASK_VERDICT_LABELS[evaluation.verdict]}
        </Badge>
      </div>

      <ul className="space-y-1.5">
        {milestone.criteria.map((criterion) => {
          const currentCheck = evaluation.checksByCriterionId[criterion.id];
          const currentStatus: MilestoneCheckStatus = currentCheck?.status ?? "PENDING";
          const cellKey = `${milestone.id}:${criterion.id}:${task.id}`;
          const isUpdating = pendingCheckKey === cellKey;

          return (
            <li
              key={criterion.id}
              className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-xs font-medium text-foreground">{criterion.title}</span>

              {canEdit ? (
                <div
                  role="group"
                  aria-label={`Avaliação do critério ${criterion.title} para ${task.title}`}
                  className="flex flex-wrap items-center gap-1 shrink-0"
                >
                  {CHECK_OPTIONS.map((opt) => {
                    const active = currentStatus === opt.status;
                    return (
                      <button
                        key={opt.status}
                        type="button"
                        disabled={isUpdating}
                        aria-pressed={active}
                        onClick={() =>
                          onToggleCheck({
                            milestoneId: milestone.id,
                            criterionId: criterion.id,
                            taskId: task.id,
                            status: opt.status,
                          })
                        }
                        className={checkOptionButton({
                          option: opt.status,
                          active,
                        })}
                      >
                        <CheckOptionIcon status={opt.status} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Badge variant="outline" className="shrink-0">
                  {MILESTONE_CHECK_STATUS_LABELS[currentStatus]}
                </Badge>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export interface TaskGanttMilestoneVerifyDialogProps {
  milestone: TaskMilestoneRecord | null;
  tasks: TaskRecord[];
  todayIso: string;
  canEdit: boolean;
  pendingCheckKey: string | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (milestone: TaskMilestoneRecord) => void;
  onDelete: (milestoneId: string) => void;
  onToggleCheck: (params: {
    milestoneId: string;
    criterionId: string;
    taskId: string;
    status: MilestoneCheckStatus;
  }) => void;
}

export function TaskGanttMilestoneVerifyDialog({
  milestone,
  tasks,
  todayIso,
  canEdit,
  pendingCheckKey,
  isDeleting,
  onOpenChange,
  onEdit,
  onDelete,
  onToggleCheck,
}: TaskGanttMilestoneVerifyDialogProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setConfirmingDelete(false);
    onOpenChange(nextOpen);
  };

  if (!milestone) {
    return <Dialog open={false} onOpenChange={handleOpenChange} />;
  }

  const summary = evaluateMilestoneSummary(milestone, todayIso);
  const weekInfo = getMilestoneWeekRange(milestone.targetDate);
  const taskMap = new Map(tasks.map((item) => [item.id, item]));
  const linkedTasks = milestone.taskIds
    .map((taskId) => taskMap.get(taskId))
    .filter((item): item is TaskRecord => Boolean(item));

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                aria-hidden="true"
                className={milestoneDiamondStyles({ status: summary.status })}
              />
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-bold">
                  {milestone.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {formatTaskDate(milestone.targetDate)} · {weekInfo.label}
                </DialogDescription>
              </div>
            </div>
            <Badge variant={overallBadgeVariant[summary.status]}>
              {MILESTONE_OVERALL_STATUS_LABELS[summary.status]}
            </Badge>
          </div>
          {milestone.description && (
            <p className="text-xs text-muted-foreground">{milestone.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-1.5 rounded-lg border border-border bg-muted/25 p-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-foreground">
              {summary.approvedTasks} de {summary.totalTasks}{" "}
              {summary.totalTasks === 1 ? "tarefa aprovada" : "tarefas aprovadas"}
            </span>
            <span className="text-muted-foreground">{summary.progressPercent}%</span>
          </div>
          <Progress
            value={summary.progressPercent}
            aria-label="Percentual de tarefas aprovadas no marco"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground">
              Verificação por tarefa ({milestone.criteria.length}{" "}
              {milestone.criteria.length === 1 ? "critério" : "critérios"})
            </h3>
            {canEdit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onEdit(milestone)}
                className="h-7 gap-1 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar marco
              </Button>
            )}
          </div>

          {linkedTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Nenhuma tarefa vinculada a este marco.
              </p>
              {canEdit && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(milestone)}
                  className="text-xs"
                >
                  Vincular tarefas
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {linkedTasks.map((task) => (
                <MilestoneTaskCard
                  key={task.id}
                  milestone={milestone}
                  task={task}
                  canEdit={canEdit}
                  pendingCheckKey={pendingCheckKey}
                  onToggleCheck={onToggleCheck}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
          {canEdit ? (
            confirmingDelete ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-destructive">Confirmar exclusão?</span>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => onDelete(milestone.id)}
                  className="gap-1.5 text-xs"
                >
                  {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Excluir definitivamente
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isDeleting}
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmingDelete(true)}
                className="w-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                Excluir marco
              </Button>
            )
          ) : (
            <span />
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
