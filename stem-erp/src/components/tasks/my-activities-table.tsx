"use client";

import type { TaskStatus } from "@prisma/client";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  Clock,
  Eye,
  Settings,
} from "lucide-react";
import { tv } from "tailwind-variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import type { DeadlineUrgency, MyActivityItem } from "@/lib/my-activities";
import { formatTaskDate } from "@/lib/task-schedule";
import { TASK_STATUS_LABELS, type TaskRecord } from "@/types/tasks";

const urgencyBadgeStyles = tv({
  base: "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  variants: {
    urgency: {
      OVERDUE: "bg-destructive/15 text-destructive",
      DUE_TODAY: "bg-warning/20 text-warning-foreground dark:text-warning",
      DUE_SOON: "bg-primary/15 text-primary",
      ON_TRACK: "bg-muted text-muted-foreground",
      COMPLETED: "bg-success/15 text-success",
      CANCELLED: "bg-muted text-muted-foreground line-through",
    } satisfies Record<DeadlineUrgency, string>,
  },
});

const STATUS_ITEMS: { value: TaskStatus; label: string; icon: typeof Circle }[] = [
  { value: "TODO", label: TASK_STATUS_LABELS.TODO, icon: Circle },
  { value: "IN_PROGRESS", label: TASK_STATUS_LABELS.IN_PROGRESS, icon: Clock },
  { value: "DONE", label: TASK_STATUS_LABELS.DONE, icon: CheckCircle2 },
  { value: "CANCELLED", label: TASK_STATUS_LABELS.CANCELLED, icon: Ban },
];

type MyActivitiesTableProps = {
  items: MyActivityItem[];
  canEdit: boolean;
  pendingTaskId: string | null;
  pageIndex: number;
  totalPages: number;
  totalFiltered: number;
  startRow: number;
  endRow: number;
  onPageChange: (nextPage: number) => void;
  onStatusChange: (task: TaskRecord, status: TaskStatus) => void;
  onOpenDetail: (taskId: string) => void;
};

export function MyActivitiesTable({
  items,
  canEdit,
  pendingTaskId,
  pageIndex,
  totalPages,
  totalFiltered,
  startRow,
  endRow,
  onPageChange,
  onStatusChange,
  onOpenDetail,
}: MyActivitiesTableProps) {
  const canPrevious = pageIndex > 0;
  const canNext = pageIndex + 1 < totalPages;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table aria-label="Minhas atividades">
          <TableHeader>
            <TableRow>
              <TableHead>Atividade</TableHead>
              <TableHead>Prazo limite</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(({ task, urgency, deadlineLabel }) => {
              const isPending = pendingTaskId === task.id;
              return (
                <TableRow key={task.id}>
                  <TableCell className="min-w-[200px]">
                    <div className="font-medium text-foreground">{task.title}</div>
                    <div className="text-xs text-muted-foreground">{DELIVERY_GROUP_LABELS[task.deliveryGroup]}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{formatTaskDate(task.endDate)}</div>
                    <span className={urgencyBadgeStyles({ urgency })}>{deadlineLabel}</span>
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Select
                        value={task.status}
                        disabled={isPending}
                        onValueChange={(value) => onStatusChange(task, value as TaskStatus)}
                      >
                        <SelectTrigger
                          className="h-9 min-h-[44px] sm:min-h-0 w-[150px] text-xs font-medium"
                          aria-label={`Status de ${task.title}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ITEMS.map(({ value, label }) => (
                            <SelectItem key={value} value={value} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">{TASK_STATUS_LABELS[task.status]}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={isPending}
                          className="h-8 w-8 rounded-lg border-border/80 bg-card hover:bg-muted/80 hover:text-foreground cursor-pointer"
                          aria-label={`Ações para ${task.title}`}
                        >
                          <Settings className="h-4 w-4 text-foreground transition-transform duration-200 hover:rotate-45" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {canEdit &&
                          STATUS_ITEMS.map(({ value, label, icon: Icon }) => (
                            <DropdownMenuItem
                              key={value}
                              disabled={task.status === value || isPending}
                              onSelect={() => onStatusChange(task, value)}
                              className="cursor-pointer gap-2 text-xs font-medium"
                            >
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Marcar: {label}</span>
                            </DropdownMenuItem>
                          ))}
                        {canEdit && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          onSelect={() => onOpenDetail(task.id)}
                          className="cursor-pointer gap-2 text-xs font-medium"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Ver detalhes</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 px-1 pt-1 sm:flex-row">
        <p className="text-center text-xs font-medium text-muted-foreground sm:text-left sm:text-sm">
          Mostrando {startRow}-{endRow} de {totalFiltered} atividades
        </p>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs font-medium text-muted-foreground sm:text-sm">
            Página {pageIndex + 1} de {totalPages}
          </span>
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
            <button
              type="button"
              onClick={() => onPageChange(0)}
              disabled={!canPrevious}
              aria-label="Primeira página"
              title="Primeira página"
              className="flex h-8 w-8 cursor-pointer items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(pageIndex - 1)}
              disabled={!canPrevious}
              aria-label="Página anterior"
              title="Página anterior"
              className="flex h-8 w-8 cursor-pointer items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(pageIndex + 1)}
              disabled={!canNext}
              aria-label="Próxima página"
              title="Próxima página"
              className="flex h-8 w-8 cursor-pointer items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(totalPages - 1)}
              disabled={!canNext}
              aria-label="Última página"
              title="Última página"
              className="flex h-8 w-8 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
