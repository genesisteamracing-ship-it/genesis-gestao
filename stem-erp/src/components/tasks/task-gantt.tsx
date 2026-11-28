"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Diamond, Link2, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import { addTaskDependencyAction, removeTaskDependencyAction, reorderTasksAction, rescheduleTaskAction } from "@/actions/tasks.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import {
  buildGanttTaskMetricsMap,
  computeGanttSummary,
  getTodayIsoLocal,
  resolveBaselineDates,
} from "@/lib/task-gantt-metrics";
import { evaluateMilestoneSummary } from "@/lib/task-milestone-metrics";
import {
  createsCycle,
  dayLabel,
  edgeKey,
  formatTaskDate,
  parseTaskDate,
  pathEdges,
  reorderItems,
  resizeTaskDates,
  type ResizeTaskEdge,
  scheduleConflict,
  taskDay,
} from "@/lib/task-schedule";
import {
  TASK_STATUS_LABELS,
  type TaskEdge,
  type TaskMilestoneRecord,
  type TaskRecord,
  type TaskRisk,
} from "@/types/tasks";
import { TaskGanttKpis } from "./task-gantt-kpis";
import { TaskGanttLegend } from "./task-gantt-legend";
import { TaskGanttMilestoneFormDialog } from "./task-gantt-milestone-form-dialog";
import { TaskGanttMilestoneTrack } from "./task-gantt-milestone-track";
import { TaskGanttMilestoneVerifyDialog } from "./task-gantt-milestone-verify-dialog";
import { useGanttMilestones } from "./use-gantt-milestones";

const ROW_HEIGHT = 64;
const LABEL_WIDTH = 216;
const ID_COLUMN_WIDTH = 44;

export const bar = tv({
  base: "relative z-10 flex h-full w-full items-center justify-between overflow-visible rounded-md border text-left text-xs font-semibold outline-offset-2 transition-all focus-visible:outline-2 shadow-2xs",
  variants: {
    signal: {
      ON_TRACK: "border-success/80 bg-success text-success-foreground",
      AT_RISK: "border-warning/80 bg-warning text-foreground",
      DELAYED: "border-destructive/80 bg-destructive text-destructive-foreground",
      COMPLETED: "border-success bg-success text-success-foreground",
      CANCELLED: "border-border bg-muted text-muted-foreground line-through opacity-75",
    },
    critical: {
      true: "border-destructive bg-destructive text-destructive-foreground",
    },
    highlighted: { true: "border-primary ring-2 ring-primary" },
    isConnectingSource: { true: "border-primary ring-2 ring-primary shadow-sm" },
    isDropTargetValid: { true: "border-primary ring-2 ring-primary bg-primary/25 text-foreground shadow-sm" },
    isDropTargetInvalid: { true: "border-destructive ring-2 ring-destructive/80 bg-destructive/15 text-foreground" },
  },
  compoundVariants: [
    {
      signal: "CANCELLED",
      critical: true,
      class: "border-border bg-muted text-muted-foreground",
    },
  ],
  defaultVariants: {
    signal: "ON_TRACK",
  },
});

const milestoneGuide = tv({
  base: "pointer-events-none absolute inset-y-0 z-[2] border-l border-dashed",
  variants: {
    status: {
      NO_TASKS: "border-primary/35",
      PENDING: "border-warning/45",
      APPROVED: "border-success/45",
      REJECTED: "border-destructive/45",
      OVERDUE: "border-destructive/45",
    },
  },
  defaultVariants: {
    status: "NO_TASKS",
  },
});

export const dependencyConnectorStyles = tv({
  slots: {
    stem: "pointer-events-none absolute left-full top-1/2 z-[5] h-px w-2 -translate-y-1/2 origin-left bg-primary/60 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
    handle:
      "absolute left-[calc(100%+8px)] top-1/2 z-[5] flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-card shadow-xs cursor-crosshair transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
  },
  variants: {
    state: {
      idle: {
        stem: "scale-x-0 opacity-0 group-hover/task:scale-x-100 group-hover/task:opacity-100 group-focus-within/task:scale-x-100 group-focus-within/task:opacity-100",
        handle:
          "pointer-events-none -translate-x-5 scale-75 opacity-0 group-hover/task:pointer-events-auto group-hover/task:translate-x-0 group-hover/task:scale-100 group-hover/task:opacity-100 group-focus-within/task:pointer-events-auto group-focus-within/task:translate-x-0 group-focus-within/task:scale-100 group-focus-within/task:opacity-100 hover:scale-125 focus-visible:scale-125",
      },
      active: {
        stem: "scale-x-100 opacity-100",
        handle:
          "pointer-events-auto translate-x-0 scale-125 opacity-100 ring-2 ring-primary/60",
      },
      suppressed: {
        stem: "scale-x-0 opacity-0",
        handle: "pointer-events-none -translate-x-5 scale-75 opacity-0",
      },
    },
  },
  defaultVariants: {
    state: "idle",
  },
});

const statusTag = tv({
  base: "pointer-events-none absolute top-1/2 -translate-y-1/2 z-10 inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-none shadow-2xs bg-card",
  variants: {
    tone: {
      ON_TRACK: "border-success/60 text-success",
      AT_RISK: "border-warning/80 text-warning",
      DELAYED: "border-destructive/70 text-destructive",
      COMPLETED: "border-success/70 text-success",
      CRITICAL: "border-destructive text-destructive",
      CANCELLED: "border-border text-muted-foreground",
    },
  },
  defaultVariants: {
    tone: "ON_TRACK",
  },
});

type ConnectingState = {
  sourceId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
};

type ResizingState = {
  taskId: string;
  edge: ResizeTaskEdge;
  startClientX: number;
  originalStartDate: string;
  originalEndDate: string;
  deltaDays: number;
};

type ReorderingState = {
  taskId: string;
  startX: number;
  startY: number;
  currentY: number;
  targetIndex: number;
  isDragging: boolean;
};

function calculateBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx >= 20) {
    const midX = x1 + dx / 2;
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  }
  const offset = Math.max(28, Math.abs(dy) * 0.4);
  return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
}

export function TaskGantt({
  visible,
  tasks,
  edges,
  milestones = [],
  path,
  open,
  teamId,
  canEdit = false,
}: {
  visible: TaskRecord[];
  tasks: TaskRecord[];
  edges: TaskEdge[];
  milestones?: TaskMilestoneRecord[];
  path?: TaskRisk;
  open: (id: string) => void;
  teamId?: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [week, setWeek] = useState(false);
  const todayIso = useMemo(() => getTodayIsoLocal(), []);
  const milestoneControls = useGanttMilestones({
    teamId,
    canEdit,
    milestones,
    defaultDate: todayIso,
  });
  const [optimistic, setOptimistic] = useState<{ forEdges: TaskEdge[]; list: TaskEdge[] }>({
    forEdges: edges,
    list: edges,
  });
  const [optimisticDates, setOptimisticDates] = useState<{
    forTasks: TaskRecord[];
    overrides: Record<string, { startDate: string; endDate: string }>;
  }>({
    forTasks: tasks,
    overrides: {},
  });
  const [optimisticOrder, setOptimisticOrder] = useState<{
    forVisible: TaskRecord[];
    list: TaskRecord[];
  }>({
    forVisible: visible,
    list: visible,
  });
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [resizing, setResizing] = useState<ResizingState | null>(null);
  const [reordering, setReordering] = useState<ReorderingState | null>(null);
  const [edgeToDelete, setEdgeToDelete] = useState<TaskEdge | null>(null);
  const [isDeletingEdge, setIsDeletingEdge] = useState(false);

  const marker = useId();
  const rowsContainerRef = useRef<HTMLDivElement>(null);
  const justReorderedRef = useRef(false);

  const currentEdges = optimistic.forEdges === edges ? optimistic.list : edges;
  const currentDateOverrides = useMemo(
    () => (optimisticDates.forTasks === tasks ? optimisticDates.overrides : {}),
    [optimisticDates, tasks]
  );
  const orderedVisible = useMemo(() => {
    const base = optimisticOrder.forVisible === visible ? optimisticOrder.list : visible;
    return base.map((task) => {
      const override = currentDateOverrides[task.id];
      return override ? { ...task, ...override } : task;
    });
  }, [optimisticOrder, visible, currentDateOverrides]);

  const byId = useMemo(
    () =>
      new Map(
        tasks.map((task) => {
          const override = currentDateOverrides[task.id];
          return [task.id, override ? { ...task, ...override } : task];
        })
      ),
    [tasks, currentDateOverrides]
  );

  const highlightedTasks = new Set(path?.taskIds);
  const highlightedEdges = new Set(pathEdges(path?.taskIds ?? []).map(edgeKey));

  const view = useMemo(() => {
    const ranges = orderedVisible.map((task) => {
      const { baselineStartDate, baselineEndDate } = resolveBaselineDates(task);
      const baseStart = taskDay(baselineStartDate);
      const baseEnd = taskDay(baselineEndDate);
      if (resizing && resizing.taskId === task.id) {
        const preview = resizeTaskDates({
          startDate: resizing.originalStartDate,
          endDate: resizing.originalEndDate,
          edge: resizing.edge,
          deltaDays: resizing.deltaDays,
        });
        return {
          task: { ...task, ...preview },
          start: taskDay(preview.startDate),
          end: taskDay(preview.endDate),
          baseStart,
          baseEnd,
        };
      }
      return {
        task,
        start: taskDay(task.startDate),
        end: taskDay(task.endDate),
        baseStart,
        baseEnd,
      };
    });
    const milestoneDays = milestoneControls.currentMilestones
      .filter((item) => parseTaskDate(item.targetDate) !== null)
      .map((item) => taskDay(item.targetDate));
    const initialFrom = ranges[0]
      ? Math.min(ranges[0].start, ranges[0].baseStart, ...(milestoneDays.length ? milestoneDays : [Infinity]))
      : milestoneDays[0] ?? 0;
    const from = ranges.reduce(
      (min, item) => Math.min(min, item.start, item.baseStart),
      initialFrom,
    );
    const lastFromRanges = ranges.reduce((max, item) => Math.max(max, item.end, item.baseEnd), from);
    const last = milestoneDays.reduce((max, day) => Math.max(max, day), lastFromRanges);
    const span = Math.max(1, last - from + 1);
    const dayWidth = Math.min(week ? 15 : 44, 160_000 / span);
    const tickStep = (week ? 7 : 1) * Math.max(1, Math.ceil(span / (week ? 1400 : 200)));
    const rows = ranges.map(({ task, start, end, baseStart, baseEnd }, index) => ({
      task,
      left: (start - from) * dayWidth,
      width: (end - start + 1) * dayWidth,
      baseLeft: (baseStart - from) * dayWidth,
      baseWidth: (baseEnd - baseStart + 1) * dayWidth,
      y: index * ROW_HEIGHT + 34,
    }));
    return { rows, span, from, dayWidth, tickStep };
  }, [orderedVisible, week, resizing, milestoneControls.currentMilestones]);

  const metricsMap = useMemo(
    () => buildGanttTaskMetricsMap(view.rows.map((row) => row.task), currentEdges, todayIso),
    [view.rows, currentEdges, todayIso],
  );
  const summary = useMemo(
    () => computeGanttSummary(view.rows.map((row) => row.task), currentEdges, todayIso),
    [view.rows, currentEdges, todayIso],
  );

  const width = view.span * view.dayWidth;
  const rows = useMemo(() => new Map(view.rows.map((row) => [row.task.id, row])), [view.rows]);
  const shown = currentEdges.filter((edge) => rows.has(edge.predecessorId) || rows.has(edge.successorId));

  const conflicts = useMemo(
    () =>
      new Set(
        shown
          .filter((edge) => {
            const predecessor = byId.get(edge.predecessorId);
            const successor = byId.get(edge.successorId);
            return predecessor && successor && scheduleConflict(predecessor.endDate, successor.startDate);
          })
          .map((edge) => edge.successorId)
      ),
    [shown, byId]
  );

  const ticks = Array.from({ length: Math.ceil(view.span / view.tickStep) }, (_, index) => index * view.tickStep);

  const handleAddEdge = useCallback(
    async (predecessorId: string, successorId: string) => {
      if (!teamId || !canEdit) return;
      const sourceTask = byId.get(predecessorId);
      const targetTask = byId.get(successorId);

      setOptimistic((prev) => {
        const base = prev.forEdges === edges ? prev.list : edges;
        return { forEdges: edges, list: [...base, { predecessorId, successorId }] };
      });

      try {
        const res = await addTaskDependencyAction({ teamId, predecessorId, successorId });
        if (res.ok) {
          toast.success(
            `Dependência criada: ${sourceTask?.title ?? "Tarefa"} → ${targetTask?.title ?? "Tarefa"}`
          );
          router.refresh();
        } else {
          setOptimistic({ forEdges: edges, list: edges });
          toast.error(res.message || "Não foi possível criar a dependência.");
        }
      } catch {
        setOptimistic({ forEdges: edges, list: edges });
        toast.error("Ocorreu um erro ao criar a dependência.");
      }
    },
    [teamId, canEdit, byId, edges, router]
  );

  const handleRemoveEdge = useCallback(
    async (edge: TaskEdge) => {
      if (!teamId || !canEdit) return;
      const sourceTask = byId.get(edge.predecessorId);
      const targetTask = byId.get(edge.successorId);

      setOptimistic((prev) => {
        const base = prev.forEdges === edges ? prev.list : edges;
        return {
          forEdges: edges,
          list: base.filter(
            (e) => !(e.predecessorId === edge.predecessorId && e.successorId === edge.successorId)
          ),
        };
      });

      try {
        const res = await removeTaskDependencyAction({ teamId, ...edge });
        if (res.ok) {
          toast.success(
            `Dependência removida: ${sourceTask?.title ?? "Tarefa"} → ${targetTask?.title ?? "Tarefa"}`
          );
          router.refresh();
        } else {
          setOptimistic({ forEdges: edges, list: edges });
          toast.error(res.message || "Não foi possível remover a dependência.");
        }
      } catch {
        setOptimistic({ forEdges: edges, list: edges });
        toast.error("Ocorreu um erro ao remover a dependência.");
      }
    },
    [teamId, canEdit, byId, edges, router]
  );

  const confirmDeleteEdge = async () => {
    if (!edgeToDelete) return;
    setIsDeletingEdge(true);
    await handleRemoveEdge(edgeToDelete);
    setIsDeletingEdge(false);
    setEdgeToDelete(null);
  };

  const handleRescheduleTask = useCallback(
    async (task: TaskRecord, nextStartDate: string, nextEndDate: string) => {
      if (!teamId || !canEdit) return;
      if (nextStartDate === task.startDate && nextEndDate === task.endDate) return;

      setOptimisticDates((prev) => {
        const base = prev.forTasks === tasks ? prev.overrides : {};
        return {
          forTasks: tasks,
          overrides: { ...base, [task.id]: { startDate: nextStartDate, endDate: nextEndDate } },
        };
      });

      try {
        const res = await rescheduleTaskAction({
          teamId,
          taskId: task.id,
          startDate: nextStartDate,
          endDate: nextEndDate,
          revision: task.revision,
        });
        if (res.ok) {
          toast.success(
            `Datas atualizadas: ${task.title} (${formatTaskDate(nextStartDate)} — ${formatTaskDate(nextEndDate)})`
          );
          router.refresh();
        } else {
          setOptimisticDates({ forTasks: tasks, overrides: {} });
          toast.error(res.message || "Não foi possível atualizar as datas da tarefa.");
        }
      } catch {
        setOptimisticDates({ forTasks: tasks, overrides: {} });
        toast.error("Ocorreu um erro ao atualizar as datas da tarefa.");
      }
    },
    [teamId, canEdit, tasks, router]
  );

  const handleReorderTasks = useCallback(
    async (sourceId: string, targetIndex: number) => {
      if (!teamId || !canEdit) return;
      const fromIndex = orderedVisible.findIndex((t) => t.id === sourceId);
      if (fromIndex === -1 || fromIndex === targetIndex) return;

      const previousList = orderedVisible;
      const nextList = reorderItems(orderedVisible, sourceId, targetIndex);
      setOptimisticOrder({ forVisible: visible, list: nextList });

      try {
        const res = await reorderTasksAction({
          teamId,
          taskIds: nextList.map((t) => t.id),
        });
        if (res.ok) {
          toast.success("Ordem das tarefas atualizada.");
          router.refresh();
        } else {
          setOptimisticOrder({ forVisible: visible, list: previousList });
          toast.error(res.message || "Não foi possível reordenar as tarefas.");
        }
      } catch {
        setOptimisticOrder({ forVisible: visible, list: previousList });
        toast.error("Ocorreu um erro ao reordenar as tarefas.");
      }
    },
    [teamId, canEdit, orderedVisible, visible, router]
  );

  // Resize bar edges (startDate / endDate)
  useEffect(() => {
    if (!resizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaDays = Math.round((e.clientX - resizing.startClientX) / view.dayWidth);
      setResizing((prev) => (prev && prev.deltaDays !== deltaDays ? { ...prev, deltaDays } : prev));
    };

    const handlePointerUp = () => {
      const next = resizeTaskDates({
        startDate: resizing.originalStartDate,
        endDate: resizing.originalEndDate,
        edge: resizing.edge,
        deltaDays: resizing.deltaDays,
      });
      const task = byId.get(resizing.taskId);
      setResizing(null);
      if (task && (next.startDate !== resizing.originalStartDate || next.endDate !== resizing.originalEndDate)) {
        void handleRescheduleTask(task, next.startDate, next.endDate);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setResizing(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [resizing, view.dayWidth, byId, handleRescheduleTask]);

  // Reorder rows vertically by dragging the inner body of the bar
  useEffect(() => {
    if (!reordering) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!rowsContainerRef.current) return;
      const rect = rowsContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - LABEL_WIDTH;
      const y = e.clientY - rect.top;
      const targetIndex = Math.max(0, Math.min(orderedVisible.length - 1, Math.floor(y / ROW_HEIGHT)));

      setReordering((prev) => {
        if (!prev) return null;
        const moved = Math.hypot(x - prev.startX, y - prev.startY);
        return {
          ...prev,
          currentY: y,
          targetIndex,
          isDragging: prev.isDragging || moved > 6,
        };
      });
    };

    const handlePointerUp = () => {
      if (reordering.isDragging) {
        justReorderedRef.current = true;
        window.setTimeout(() => {
          justReorderedRef.current = false;
        }, 50);
        void handleReorderTasks(reordering.taskId, reordering.targetIndex);
      }
      setReordering(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReordering(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [reordering, orderedVisible.length, handleReorderTasks]);

  // Drag and drop pointer listener
  useEffect(() => {
    if (!connecting) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!rowsContainerRef.current) return;
      const rect = rowsContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - LABEL_WIDTH;
      const y = e.clientY - rect.top;

      setConnecting((prev) => {
        if (!prev) return null;
        const moved = Math.hypot(x - prev.startX, y - prev.startY);
        return {
          ...prev,
          currentX: x,
          currentY: y,
          isDragging: prev.isDragging || moved > 6,
        };
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!rowsContainerRef.current) return;
      const rect = rowsContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - LABEL_WIDTH;
      const y = e.clientY - rect.top;

      const rowIndex = Math.floor(y / ROW_HEIGHT);
      const candidate = view.rows[rowIndex]?.task;

      setConnecting((prev) => {
        if (!prev) return null;
        const moved = Math.hypot(x - prev.startX, y - prev.startY);

        if (candidate && candidate.id !== prev.sourceId) {
          const alreadyExists = currentEdges.some(
            (edge) => edge.predecessorId === prev.sourceId && edge.successorId === candidate.id
          );
          const hasCycle = createsCycle(currentEdges, prev.sourceId, candidate.id);

          if (!alreadyExists && !hasCycle) {
            void handleAddEdge(prev.sourceId, candidate.id);
            return null;
          } else if (hasCycle) {
            toast.error("Esta dependência não pode ser criada porque causaria um ciclo.");
          } else if (alreadyExists) {
            toast.error("Esta dependência já existe.");
          }
        }

        // If moved very little (click rather than drag), keep click-to-connect active
        if (moved <= 6) {
          return { ...prev, isDragging: false };
        }
        return null;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnecting(null);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [connecting, currentEdges, view.rows, handleAddEdge]);

  // Handle bar clicking in connection mode vs view mode
  const handleTaskBarClick = (taskId: string) => {
    if (justReorderedRef.current) return;
    if (connecting) {
      if (taskId === connecting.sourceId) {
        setConnecting(null);
        return;
      }
      const alreadyExists = currentEdges.some(
        (edge) => edge.predecessorId === connecting.sourceId && edge.successorId === taskId
      );
      const hasCycle = createsCycle(currentEdges, connecting.sourceId, taskId);

      if (alreadyExists) {
        toast.error("Esta dependência já existe.");
        return;
      }
      if (hasCycle) {
        toast.error("Esta dependência criaria um ciclo.");
        return;
      }
      void handleAddEdge(connecting.sourceId, taskId);
      setConnecting(null);
      return;
    }
    open(taskId);
  };

  // Active hover evaluation during connecting
  const hoveredRowIndex = connecting ? Math.floor(connecting.currentY / ROW_HEIGHT) : -1;
  const hoveredCandidate =
    connecting && hoveredRowIndex >= 0 && hoveredRowIndex < view.rows.length
      ? view.rows[hoveredRowIndex]?.task
      : null;
  const isHoveredSelf = hoveredCandidate?.id === connecting?.sourceId;
  const isHoveredExisting =
    connecting && hoveredCandidate
      ? currentEdges.some(
          (edge) => edge.predecessorId === connecting.sourceId && edge.successorId === hoveredCandidate.id
        )
      : false;
  const isHoveredCycle =
    connecting && hoveredCandidate && !isHoveredSelf
      ? createsCycle(currentEdges, connecting.sourceId, hoveredCandidate.id)
      : false;
  const isValidTarget = Boolean(
    connecting && hoveredCandidate && !isHoveredSelf && !isHoveredExisting && !isHoveredCycle
  );

  const activeSourceTask = connecting ? byId.get(connecting.sourceId) : null;
  const targetRow = hoveredCandidate ? rows.get(hoveredCandidate.id) : null;

  const connectingEndX = isValidTarget && targetRow ? targetRow.left : connecting?.currentX ?? 0;
  const connectingEndY = isValidTarget && targetRow ? targetRow.y : connecting?.currentY ?? 0;

  const edgeToDeleteSource = edgeToDelete ? byId.get(edgeToDelete.predecessorId) : null;
  const edgeToDeleteTarget = edgeToDelete ? byId.get(edgeToDelete.successorId) : null;

  return (
    <section aria-label="Cronograma de Gantt" className="min-w-0 space-y-4">
      <TaskGanttKpis summary={summary} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant={week ? "outline" : "default"}
            aria-pressed={!week}
            onClick={() => setWeek(false)}
          >
            Dias
          </Button>
          <Button
            size="sm"
            variant={week ? "default" : "outline"}
            aria-pressed={week}
            onClick={() => setWeek(true)}
          >
            Semanas
          </Button>
          {canEdit && teamId && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => milestoneControls.openCreate(todayIso)}
              className="gap-1.5"
            >
              <Diamond className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Novo marco
            </Button>
          )}
          {path && <span className="text-sm font-medium text-primary">Caminho em destaque · {path.name}</span>}
        </div>

        <div className="min-w-0 flex-1">
          <TaskGanttLegend className="w-full" />
        </div>
      </div>

      {activeSourceTask && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-xs sm:text-sm font-medium text-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <Link2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              Conectando: <strong>{activeSourceTask.title}</strong>
              {hoveredCandidate && !isHoveredSelf ? (
                <>
                  {" "}→{" "}
                  <strong className={isValidTarget ? "text-primary" : "text-destructive"}>
                    {hoveredCandidate.title}
                  </strong>
                  {!isValidTarget && (
                    <span className="ml-1 text-xs text-destructive font-normal">
                      ({isHoveredCycle ? "Criaria ciclo de dependências" : "Já conectada"})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground font-normal">
                  {" "}— arraste até outra tarefa ou clique nela para conectar
                </span>
              )}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setConnecting(null)}
          >
            Cancelar (Esc)
          </Button>
        </div>
      )}

      <div
        className="w-full max-h-[65vh] min-w-0 overflow-auto rounded-xl border border-border bg-card shadow-2xs"
        tabIndex={0}
        aria-label="Linha do tempo rolável"
      >
          <div style={{ width: LABEL_WIDTH + width + 168 }}>
            <div className="sticky top-0 z-30 flex h-10 border-b border-border bg-card text-xs font-semibold">
              <div
                className="sticky left-0 z-10 flex shrink-0 border-r border-border bg-primary text-primary-foreground"
                style={{ width: LABEL_WIDTH }}
              >
                <span
                  className="flex shrink-0 items-center justify-center border-r border-primary-foreground/20 px-1"
                  style={{ width: ID_COLUMN_WIDTH }}
                >
                  ID
                </span>
                <span className="flex flex-1 items-center truncate px-2.5">Atividade</span>
              </div>
              <div className="relative flex-1">
                {ticks.map((offset) => (
                  <span
                    key={offset}
                    className="absolute h-full whitespace-nowrap border-l border-border px-1 py-2 text-muted-foreground"
                    style={{ left: offset * view.dayWidth }}
                  >
                    {formatTaskDate(dayLabel(view.from + offset)).slice(0, 5)}
                  </span>
                ))}
              </div>
            </div>

            <TaskGanttMilestoneTrack
              milestones={milestoneControls.currentMilestones}
              fromDay={view.from}
              dayWidth={view.dayWidth}
              ticks={ticks}
              tickStep={view.tickStep}
              labelWidth={LABEL_WIDTH}
              todayIso={todayIso}
              canEdit={Boolean(canEdit && teamId)}
              onAddAtDate={milestoneControls.openCreate}
              onSelectMilestone={milestoneControls.openVerify}
            />

            <div ref={rowsContainerRef} className="relative">
              {milestoneControls.currentMilestones
                .filter((item) => parseTaskDate(item.targetDate) !== null)
                .map((item) => {
                  const summaryItem = evaluateMilestoneSummary(item, todayIso);
                  const x = Math.max(8, (taskDay(item.targetDate) - view.from) * view.dayWidth + view.dayWidth / 2);
                  return (
                    <span
                      key={item.id}
                      aria-hidden="true"
                      className={milestoneGuide({ status: summaryItem.status })}
                      style={{ left: LABEL_WIDTH + x }}
                    />
                  );
                })}
              {view.rows.map(({ task, left, width: duration, baseLeft, baseWidth, y }, index) => {
                const metrics = metricsMap.get(task.id);
                const signal = metrics?.signal ?? "ON_TRACK";
                const isCritical = metrics?.isCritical ?? false;
                const shortId = metrics?.shortId ?? String(index + 1);
                const isSource = connecting?.sourceId === task.id;
                const isTargetCandidate = Boolean(connecting && !isSource && hoveredCandidate?.id === task.id);
                const barWidth = Math.max(28, duration);
                const baselineBarWidth = Math.max(24, baseWidth);
                const canManageBar = canEdit && (task.canManage ?? true);
                const isBeingReordered = Boolean(reordering?.isDragging && reordering.taskId === task.id);
                const isReorderTarget = Boolean(
                  reordering?.isDragging && reordering.targetIndex === index && reordering.taskId !== task.id
                );
                const tagLeft = Math.max(left + barWidth, baseLeft + baselineBarWidth) + (canEdit ? 34 : 18);
                const displayTagText = isCritical ? "Crítica" : (metrics?.signalLabel ?? TASK_STATUS_LABELS[task.status]);
                const displayTagTone = isCritical ? "CRITICAL" : signal;
                const connectorState = isSource ? "active" : connecting ? "suppressed" : "idle";
                const connectorStyles = dependencyConnectorStyles({ state: connectorState });

                return (
                  <div
                    key={task.id}
                    data-critical={isCritical ? "true" : undefined}
                    className={`flex border-b border-border last:border-b-0 transition-colors ${
                      isBeingReordered ? "opacity-50" : ""
                    } ${isReorderTarget ? "bg-primary/5 ring-1 ring-inset ring-primary/60" : ""} ${
                      isCritical ? "bg-destructive/[0.03] ring-2 ring-inset ring-destructive/80" : ""
                    }`}
                    style={{ height: ROW_HEIGHT }}
                  >
                    <button
                      type="button"
                      className="sticky left-0 z-20 flex shrink-0 items-center border-r border-border bg-card text-left text-xs focus-visible:outline-2"
                      onClick={() => handleTaskBarClick(task.id)}
                      style={{ width: LABEL_WIDTH }}
                    >
                      <span
                        className="flex h-full shrink-0 items-center justify-center border-r border-border/70 font-bold text-foreground"
                        style={{ width: ID_COLUMN_WIDTH }}
                      >
                        {shortId}
                      </span>
                      <span className="min-w-0 flex-1 px-2.5">
                        <span className="block truncate font-semibold text-foreground">{task.title}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {DELIVERY_GROUP_LABELS[task.deliveryGroup]}
                        </span>
                        {conflicts.has(task.id) && (
                          <span className="block truncate text-[11px] font-medium text-destructive">
                            Conflito de datas
                          </span>
                        )}
                      </span>
                    </button>

                    <div
                      className="relative flex-1"
                      style={{
                        backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px)",
                        backgroundSize: view.dayWidth * view.tickStep + "px 100%",
                      }}
                    >
                      {/* Barra Cinza: Linha de Base (Planejado) */}
                      <div
                        aria-hidden="true"
                        title={`Linha de base: ${formatTaskDate(task.baselineStartDate ?? task.startDate)} — ${formatTaskDate(task.baselineEndDate ?? task.endDate)}`}
                        className="pointer-events-none absolute top-2 z-[5] h-3.5 rounded-sm bg-muted-foreground/30"
                        style={{ left: baseLeft, width: baselineBarWidth }}
                      />

                      {/* Wrapper da Barra + Conector de Dependência (z-10; bolinha em z-[5] atrás da barra) */}
                      <div
                        className="group/task absolute top-5 z-10 h-7"
                        style={{ left, width: barWidth }}
                      >
                        {canEdit && (
                          <div
                            aria-hidden="true"
                            className="absolute -inset-y-2 -left-2 -right-9 z-0"
                          />
                        )}

                        {/* Barra Colorida: Execução / Status de Prazo */}
                        <div
                          className={bar({
                            signal,
                            critical: isCritical,
                            highlighted: highlightedTasks.has(task.id),
                            isConnectingSource: isSource,
                            isDropTargetValid: Boolean(isTargetCandidate && isValidTarget),
                            isDropTargetInvalid: Boolean(isTargetCandidate && !isValidTarget),
                          })}
                        >
                      {/* Left Edge Resize Handle (startDate) */}
                      {canManageBar && (
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Alterar data de início de ${task.title}`}
                          title="Arraste a aresta esquerda para alterar a data de início"
                          onPointerDown={(e) => {
                            if (e.button !== 0) return;
                            e.preventDefault();
                            e.stopPropagation();
                            setConnecting(null);
                            setResizing({
                              taskId: task.id,
                              edge: "start",
                              startClientX: e.clientX,
                              originalStartDate: task.startDate,
                              originalEndDate: task.endDate,
                              deltaDays: 0,
                            });
                          }}
                          className="absolute inset-y-0 left-0 z-20 w-2 cursor-ew-resize rounded-l-md transition-colors hover:bg-primary/35"
                        />
                      )}

                      {/* Target Snap Anchor (Left) */}
                      {connecting && !isSource && (
                        <div
                          className={`pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 z-20 flex h-4 w-4 items-center justify-center rounded-full border bg-card transition-all ${
                            isTargetCandidate
                              ? isValidTarget
                                ? "scale-125 border-primary bg-primary text-primary-foreground"
                                : "scale-125 border-destructive bg-destructive text-destructive-foreground"
                              : "border-primary/50 text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              isTargetCandidate
                                ? isValidTarget
                                  ? "bg-primary-foreground"
                                  : "bg-destructive-foreground"
                                : "bg-primary"
                            }`}
                          />
                        </div>
                      )}

                      {/* Main Bar Body (Click to open, Drag vertically away from edges to reorder) */}
                      <button
                        type="button"
                        className={`h-full flex-1 truncate px-2 text-left focus-visible:outline-none ${
                          canEdit && !connecting ? "cursor-grab active:cursor-grabbing" : ""
                        }`}
                        onPointerDown={(e) => {
                          if (!canEdit || connecting || e.button !== 0 || !rowsContainerRef.current) return;
                          const rect = rowsContainerRef.current.getBoundingClientRect();
                          const x = e.clientX - rect.left - LABEL_WIDTH;
                          const pointerY = e.clientY - rect.top;
                          setReordering({
                            taskId: task.id,
                            startX: x,
                            startY: pointerY,
                            currentY: pointerY,
                            targetIndex: index,
                            isDragging: false,
                          });
                        }}
                        onClick={() => handleTaskBarClick(task.id)}
                        aria-label={
                          shortId +
                          " · " +
                          task.title +
                          " · " +
                          formatTaskDate(task.startDate) +
                          " até " +
                          formatTaskDate(task.endDate) +
                          " · " +
                          (metrics?.signalLabel ?? TASK_STATUS_LABELS[task.status]) +
                          (isCritical ? " · Caminho crítico" : "") +
                          (highlightedTasks.has(task.id) ? " · Em destaque" : "")
                        }
                        title={
                          `${shortId} — ${task.title}\n` +
                          `Atual: ${formatTaskDate(task.startDate)} — ${formatTaskDate(task.endDate)}\n` +
                          `Linha de base: ${formatTaskDate(task.baselineStartDate ?? task.startDate)} — ${formatTaskDate(task.baselineEndDate ?? task.endDate)}\n` +
                          `Status: ${metrics?.signalLabel ?? TASK_STATUS_LABELS[task.status]}` +
                          (isCritical ? " · Crítica" : "")
                        }
                      >
                        {highlightedTasks.has(task.id) && "★ "}
                        <span className="sr-only">{metrics?.signalLabel ?? TASK_STATUS_LABELS[task.status]}</span>
                      </button>

                      {/* Selo de verificação ✓ para atividades concluídas */}
                      {signal === "COMPLETED" && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-2.5 top-1/2 z-20 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-card shadow-xs"
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}

                      {/* Right Edge Resize Handle (endDate) */}
                      {canManageBar && (
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Alterar data de término de ${task.title}`}
                          title="Arraste a aresta direita para alterar a data de término"
                          onPointerDown={(e) => {
                            if (e.button !== 0) return;
                            e.preventDefault();
                            e.stopPropagation();
                            setConnecting(null);
                            setResizing({
                              taskId: task.id,
                              edge: "end",
                              startClientX: e.clientX,
                              originalStartDate: task.startDate,
                              originalEndDate: task.endDate,
                              deltaDays: 0,
                            });
                          }}
                          className="absolute inset-y-0 right-0 z-20 w-2 cursor-ew-resize rounded-r-md transition-colors hover:bg-primary/35"
                        />
                      )}
                        </div>

                        {/* Source Drag Connector Handle (Atrás da barra -> desliza para fora no hover/foco) */}
                        {canEdit && (
                          <>
                            <span
                              aria-hidden="true"
                              className={connectorStyles.stem()}
                            />
                            <div
                              role="button"
                              tabIndex={0}
                              aria-label={`Conectar dependência a partir de ${task.title}`}
                              title="Puxe esta bolinha para conectar uma dependência"
                              onPointerDown={(e) => {
                                if (e.button !== 0) return;
                                e.preventDefault();
                                e.stopPropagation();
                                setConnecting({
                                  sourceId: task.id,
                                  startX: left + barWidth + 18,
                                  startY: y,
                                  currentX: left + barWidth + 18,
                                  currentY: y,
                                  isDragging: false,
                                });
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (connecting?.sourceId === task.id) {
                                  setConnecting(null);
                                } else {
                                  setConnecting({
                                    sourceId: task.id,
                                    startX: left + barWidth + 18,
                                    startY: y,
                                    currentX: left + barWidth + 18,
                                    currentY: y,
                                    isDragging: false,
                                  });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setConnecting({
                                    sourceId: task.id,
                                    startX: left + barWidth + 18,
                                    startY: y,
                                    currentX: left + barWidth + 18,
                                    currentY: y,
                                    isDragging: false,
                                  });
                                }
                              }}
                              className={connectorStyles.handle()}
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Rótulo textual de status / criticidade ao lado da barra */}
                      <span
                        className={statusTag({ tone: displayTagTone })}
                        style={{ left: tagLeft }}
                      >
                        {displayTagText}
                      </span>
                    </div>
                  </div>
                );
              })}

            {/* SVG Layer for Edges and Active Connecting Line */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute top-0 z-10 overflow-visible text-muted-foreground"
              style={{ left: LABEL_WIDTH }}
              width={width}
              height={view.rows.length * ROW_HEIGHT}
            >
              <defs>
                <marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                  <path d="M0 0 L6 3 L0 6 Z" fill="context-stroke" />
                </marker>
                <marker id={marker + "-primary"} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                  <path d="M0 0 L6 3 L0 6 Z" fill="var(--primary)" />
                </marker>
                <marker id={marker + "-destructive"} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                  <path d="M0 0 L6 3 L0 6 Z" fill="var(--destructive)" />
                </marker>
              </defs>

              {/* Render Existing Edges */}
              {shown.map((edge) => {
                const source = rows.get(edge.predecessorId);
                const target = rows.get(edge.successorId);
                if (!source || !target) return null;
                const key = edgeKey(edge);
                const x = source.left + source.width;
                const approach = target.left - 8;
                const highlight = highlightedEdges.has(key);
                const conflict = scheduleConflict(source.task.endDate, target.task.startDate);
                const segments =
                  approach >= x + 8
                    ? ["H", approach, "V", target.y]
                    : ["H", x + 8, "V", target.y - 15, "H", approach, "V", target.y];
                const pathD = ["M", x, source.y, ...segments, "H", target.left].join(" ");

                return (
                  <g key={key} className="group/edge">
                    {/* Interactive hit area to select/remove edge */}
                    {canEdit && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={14}
                        className="pointer-events-auto cursor-pointer"
                        onClick={() => setEdgeToDelete(edge)}
                      >
                        <title>{`Clique para remover dependência: ${source.task.title} → ${target.task.title}`}</title>
                      </path>
                    )}
                    <path
                      d={pathD}
                      className={
                        highlight
                          ? "text-primary"
                          : conflict
                            ? "text-destructive"
                            : "text-muted-foreground group-hover/edge:text-primary transition-colors"
                      }
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={highlight ? 3 : 1.5}
                      strokeDasharray={conflict ? "4 3" : undefined}
                      markerEnd={"url(#" + marker + ")"}
                    />
                  </g>
                );
              })}

              {/* Render Active Temporary Connecting Line */}
              {connecting && (
                <path
                  d={calculateBezierPath(connecting.startX, connecting.startY, connectingEndX, connectingEndY)}
                  className={isValidTarget || !hoveredCandidate ? "text-primary" : "text-destructive"}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  markerEnd={
                    "url(#" + (isValidTarget || !hoveredCandidate ? marker + "-primary" : marker + "-destructive") + ")"
                  }
                />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Dependencies List with Quick Remove Action */}
      {shown.length > 0 && (
        <details className="rounded-lg border border-border bg-card p-3 text-sm">
          <summary className="cursor-pointer font-medium">Dependências ({shown.length})</summary>
          <ul className="mt-2 divide-y divide-border">
            {shown.map((edge) => {
              const a = byId.get(edge.predecessorId);
              const b = byId.get(edge.successorId);
              if (!a || !b) return null;
              const external = !rows.has(a.id) || !rows.has(b.id);
              const conflict = scheduleConflict(a.endDate, b.startDate);

              return (
                <li key={edgeKey(edge)} className="flex items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0">
                  <span className="truncate text-xs sm:text-sm">
                    <strong>{a.title}</strong> ({DELIVERY_GROUP_LABELS[a.deliveryGroup]}) →{" "}
                    <strong>{b.title}</strong> ({DELIVERY_GROUP_LABELS[b.deliveryGroup]})
                    {external && " · Fora do filtro"}
                    {conflict && <span className="ml-1 text-destructive font-medium">· Conflito de datas</span>}
                    {highlightedEdges.has(edgeKey(edge)) && (
                      <span className="ml-1 text-primary font-medium">· Em destaque</span>
                    )}
                  </span>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={() => setEdgeToDelete(edge)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remover
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {/* Confirmation Dialog to Remove Dependency */}
      <Dialog open={Boolean(edgeToDelete)} onOpenChange={(isOpen) => !isOpen && setEdgeToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover dependência?</DialogTitle>
            <DialogDescription>
              A dependência entre <strong>{edgeToDeleteSource?.title ?? "Tarefa"}</strong> e{" "}
              <strong>{edgeToDeleteTarget?.title ?? "Tarefa"}</strong> será desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeletingEdge}
              onClick={() => setEdgeToDelete(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeletingEdge}
              onClick={confirmDeleteEdge}
              className="text-xs gap-1.5"
            >
              {isDeletingEdge && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Remover dependência</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {teamId && (
        <TaskGanttMilestoneFormDialog
          open={milestoneControls.formState.open}
          onOpenChange={(isOpen) => {
            if (!isOpen) milestoneControls.closeForm();
          }}
          teamId={teamId}
          tasks={tasks}
          milestone={milestoneControls.formState.milestone}
          defaultDate={milestoneControls.formState.defaultDate ?? todayIso}
          onSaved={() => router.refresh()}
        />
      )}

      <TaskGanttMilestoneVerifyDialog
        milestone={milestoneControls.selectedMilestone}
        tasks={tasks}
        todayIso={todayIso}
        canEdit={Boolean(canEdit && teamId)}
        pendingCheckKey={milestoneControls.pendingCheckKey}
        isDeleting={milestoneControls.isDeleting}
        onOpenChange={(isOpen) => {
          if (!isOpen) milestoneControls.closeVerify();
        }}
        onEdit={milestoneControls.openEdit}
        onDelete={milestoneControls.handleDeleteMilestone}
        onToggleCheck={milestoneControls.handleCheckChange}
      />
    </section>
  );
}
